import { publishEmail, requestEmail, forwardEmail } from "./email-text";
import type { Express, Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { db, pool } from "./db";
import { storage } from "./storage";
import { listings, insertListingSchema, contactSchema, editListingSchema, type Listing, type PublicListing } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { newToken, hashToken, limit, sendMail, baseUrl, mailConfigured, PublicError } from "./mail";

export function publicListing(row: Listing): PublicListing {
  const { contactEmail, contactPhone, secretKey, manageHash, emailVerified, published, ...safe } = row;
  return { ...safe, canContact: !!(published && emailVerified && row.contactEnabled && contactEmail) };
}
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
const idSchema = z.coerce.number().int().positive();
const wrap = (handler: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response, _next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    try { await handler(req, res); }
    catch (error) {
      if (error instanceof ZodError) return void res.status(400).json({ message: "Bitte prüfe deine Eingaben. " + error.issues[0].message });
      if (error instanceof PublicError) return void res.status(error.status).json({ message: error.message });
      console.error("Contact request failed", error instanceof Error ? error.name : "UnknownError");
      res.status(503).json({ message: "Die Anfrage konnte gerade nicht verarbeitet werden. Bitte später erneut versuchen." });
    }
  };
async function publicRow(id: number) {
  const row = await storage.getListing(id);
  if (!row?.published) throw new PublicError(404, "Anzeige nicht gefunden.");
  return row;
}
async function managedRow(req: Request) {
  const token = tokenSchema.parse(req.headers.authorization?.replace(/^Bearer /, ""));
  const id = idSchema.parse(req.params.id);
  const [row] = await db.select().from(listings).where(and(eq(listings.id,id),eq(listings.manageHash,hashToken(token))));
  if (!row?.emailVerified) throw new PublicError(403, "Dieser Verwaltungslink ist ungültig.");
  return row;
}
export function registerContactRoutes(app: Express) {
  app.get("/api/listings", wrap(async (req,res) => {
    const filters = z.object({city:z.string().max(100).optional(),category:z.string().max(100).optional(),level:z.string().max(100).optional(),search:z.string().max(150).optional()}).parse(req.query);
    res.json((await storage.getListings(filters)).map(publicListing));
  }));
  app.get("/api/listings/:id", wrap(async (req,res) => {
    res.json(publicListing(await publicRow(idSchema.parse(req.params.id))));
  }));
  app.post("/api/listings", wrap(async (req,res) => {
    if(req.body.website) throw new PublicError(400,"Spam erkannt.");
    const { consent, ...data } = insertListingSchema.parse(req.body);
    mailConfigured();
    await limit(`create-ip:${req.ip}`,3,3600);
    await limit(`create-mail:${data.contactEmail.toLowerCase()}`,3,3600);
    const confirmToken = newToken();
    const manageToken = newToken();
    const [row] = await db.insert(listings).values({ ...data, contactPhone:null, secretKey:newToken(),
      published:false,emailVerified:false,manageHash:hashToken(manageToken),
    }).returning();
    try {
      await pool.query(`INSERT INTO email_actions(token_hash,kind,listing_id,expires_at) VALUES($1,'publish',$2,now()+interval '24 hours')`,[hashToken(confirmToken),row.id]);
      await sendMail({to:data.contactEmail,idempotencyKey:`publish-${hashToken(confirmToken)}`,
        ...publishEmail({language:data.language,name:data.name,title:data.title,
          confirmUrl:`${baseUrl()}/email-action?lang=${data.language}#${confirmToken}`,
          manageUrl:`${baseUrl()}/manage/${row.id}?lang=${data.language}#${manageToken}`,
        })});
    } catch(error) {
      // If delivery timed out, the provider may still deliver; the now-invalid link cannot publish anything.
      await db.delete(listings).where(eq(listings.id,row.id)); throw error;
    }
    res.status(202).json({message:"Bitte bestätige deine Anzeige über den Link in deinem E-Mail-Postfach. Der Link ist 24 Stunden gültig."});
  }));
  app.post("/api/listings/:id/contact", wrap(async (req,res) => {
    const data = contactSchema.parse(req.body);
    const row = await publicRow(idSchema.parse(req.params.id));
    if(!row.emailVerified || !row.contactEnabled || !row.contactEmail) throw new PublicError(409,"Für diese Anzeige sind aktuell keine Anfragen möglich.");
    mailConfigured();
    await limit(`contact-ip:${req.ip}`,5,3600);
    await limit(`contact-mail:${data.email.toLowerCase()}`,5,3600);
    await limit(`contact-listing:${row.id}`,10,86400);
    const token = newToken();
    const tokenHash = hashToken(token);
    await pool.query(`INSERT INTO email_actions(token_hash,kind,listing_id,payload,expires_at) VALUES($1,'message',$2,$3,now()+interval '1 hour')`,[tokenHash,row.id,JSON.stringify({name:data.name,email:data.email,message:data.message})]);
    try {
      await sendMail({to:data.email,idempotencyKey:`request-${tokenHash}`,
        ...requestEmail({language:data.language,name:data.name,title:row.title,
          url:`${baseUrl()}/email-action?lang=${data.language}#${token}`,
        })});
    } catch(error) { await pool.query("DELETE FROM email_actions WHERE token_hash=$1",[tokenHash]); throw error; }
    res.status(202).json({message:"Bitte bestätige deine Anfrage über den Link in deinem E-Mail-Postfach. Erst danach wird sie weitergeleitet."});
  }));
  // GET never consumes a token: scanners and link previews cannot publish or forward.
  app.post("/api/email-actions/confirm", wrap(async (req,res) => {
    const token = tokenSchema.parse(req.body.token);
    await limit(`confirm-ip:${req.ip}`,30,3600);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query("SELECT * FROM email_actions WHERE token_hash=$1 FOR UPDATE",[hashToken(token)]);
      const action = rows[0];
      if(!action || action.expires_at <= new Date()) throw new PublicError(410,"Dieser Link ist ungültig oder abgelaufen. Bitte erstelle die Anzeige oder Anfrage erneut.");
      if(action.consumed_at) { await client.query("COMMIT"); res.json({message:"Bereits erfolgreich bestätigt."}); return; }
      const result = await client.query("SELECT * FROM listings WHERE id=$1 FOR UPDATE",[action.listing_id]);
      const row = result.rows[0];
      if(!row) throw new PublicError(404,"Anzeige nicht gefunden.");
      if(action.kind === "publish") {
        await client.query("UPDATE listings SET published=true,email_verified=true WHERE id=$1",[row.id]);
      } else if(action.kind === "message") {
        if(!row.published || !row.email_verified || !row.contact_enabled || !row.contact_email) throw new PublicError(409,"Die Anzeige nimmt keine Anfragen mehr an.");
        const data = contactSchema.omit({consent:true,website:true}).parse(action.payload);
        await sendMail({to:row.contact_email,replyTo:data.email,idempotencyKey:`forward-${action.token_hash}`,
          ...forwardEmail({language:row.language,owner:row.name,name:data.name,title:row.title,
            message:data.message,email:data.email,url:`${baseUrl()}/listing/${row.id}`,
          })},client);
      } else throw new PublicError(400,"Ungültiger Link.");
      // Increment only after a successful action, in the same transaction as token consumption.
      // No names, addresses, message bodies or listing identifiers in this aggregate table.
      await client.query(`INSERT INTO platform_daily(day,published_count,contact_count)
        VALUES((now() AT TIME ZONE 'Europe/Berlin')::date,$1,$2)
        ON CONFLICT(day) DO UPDATE SET
          published_count=platform_daily.published_count+excluded.published_count,
          contact_count=platform_daily.contact_count+excluded.contact_count`,
        [action.kind === "publish" ? 1 : 0, action.kind === "message" ? 1 : 0]);
      await client.query("UPDATE email_actions SET consumed_at=now(),payload='{}' WHERE token_hash=$1",[action.token_hash]);
      await client.query("COMMIT");
      res.json({message:action.kind === "publish" ? "Deine Anzeige ist jetzt veröffentlicht." : "Deine Nachricht wurde weitergeleitet.",listingId:row.id});
    } catch(error) { await client.query("ROLLBACK"); throw error; }
    finally {client.release();}
  }));
  app.get("/api/manage/:id",wrap(async(req,res)=>{
    await limit(`manage-ip:${req.ip}`,60,3600);
    const row=await managedRow(req);
    res.json({...publicListing(row),contactEmail:row.contactEmail});
  }));
  app.patch("/api/manage/:id",wrap(async(req,res)=>{
    await limit(`manage-ip:${req.ip}`,60,3600);
    const row=await managedRow(req);
    const changes=editListingSchema.parse(req.body);
    await db.update(listings).set(changes).where(eq(listings.id,row.id));
    res.json({message:"Änderungen gespeichert."});
  }));
  app.delete("/api/manage/:id",wrap(async(req,res)=>{
    await limit(`manage-ip:${req.ip}`,60,3600);
    const row=await managedRow(req);
    await db.delete(listings).where(eq(listings.id,row.id));
    res.json({message:"Anzeige gelöscht."});
  }));
}
