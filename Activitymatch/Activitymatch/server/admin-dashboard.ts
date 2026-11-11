import type { Express, Request, Response, RequestHandler } from "express";
import { z, ZodError } from "zod";
import { pool } from "./db";

const params = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  search: z.string().trim().max(100).default(""),
});
const safe = (handler: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  async (req, res) => {
    try { await handler(req, res); }
    catch (error) {
      if (error instanceof ZodError) { res.status(400).json({message:"Ungültige Such- oder Seitenangabe."}); return; }
      console.error("Admin dashboard failed",error instanceof Error ? error.name : "UnknownError");
      res.status(500).json({message:"Verwaltungsdaten konnten nicht geladen werden."});
    }
  };
const publicAdminProjection = `id,title,name,age,city,category,contact_email AS "contactEmail",
  published,email_verified AS "emailVerified",contact_enabled AS "contactEnabled",created_at AS "createdAt"`;

export function registerAdminDashboard(app: Express, requireAdmin: RequestHandler) {
  app.get("/api/admin/dashboard", requireAdmin, safe(async (_req,res)=>{
    const counts = await pool.query(`SELECT count(*)::int AS stored,
      count(*) FILTER (WHERE published)::int AS published,
      count(*) FILTER (WHERE NOT published)::int AS pending,
      count(DISTINCT lower(trim(contact_email))) FILTER (WHERE published AND email_verified AND contact_email IS NOT NULL)::int AS "confirmedAddresses"
      FROM listings`);
    const tracking = await pool.query("SELECT started_at AS \"trackingSince\" FROM platform_metrics_meta WHERE id=1");
    const sums=await pool.query(`SELECT coalesce(sum(published_count),0)::int AS "publications30",
      coalesce(sum(contact_count),0)::int AS "contacts30" FROM platform_daily
      WHERE day >= (now() AT TIME ZONE 'Europe/Berlin')::date-29`);
    const categories=await pool.query("SELECT category AS label,count(*)::int AS count FROM listings WHERE published GROUP BY category ORDER BY count(*) DESC,category");
    const cities=await pool.query("SELECT city AS label,count(*)::int AS count FROM listings WHERE published GROUP BY city ORDER BY count(*) DESC,city LIMIT 10");
    const daily=await pool.query(`SELECT d::date::text AS day,coalesce(p.published_count,0)::int AS publications,
      coalesce(p.contact_count,0)::int AS contacts FROM generate_series(
        (now() AT TIME ZONE 'Europe/Berlin')::date-29,
        (now() AT TIME ZONE 'Europe/Berlin')::date,interval '1 day') d
      LEFT JOIN platform_daily p ON p.day=d::date ORDER BY d`);
    res.json({...counts.rows[0],...sums.rows[0],trackingSince:tracking.rows[0].trackingSince,
      categories:categories.rows,cities:cities.rows,daily:daily.rows});
  }));
  app.get("/api/admin/listings",requireAdmin,safe(async(req,res)=>{
    const {page,search}=params.parse(req.query);
    const where=`($1='' OR strpos(lower(title),lower($1))>0 OR strpos(lower(name),lower($1))>0
      OR strpos(lower(coalesce(contact_email,'')),lower($1))>0 OR strpos(lower(city),lower($1))>0)`;
    const total=await pool.query(`SELECT count(*)::int AS total FROM listings WHERE ${where}`,[search]);
    const result=await pool.query(`SELECT ${publicAdminProjection} FROM listings WHERE ${where}
      ORDER BY created_at DESC,id DESC LIMIT 25 OFFSET $2`,[search,(page-1)*25]);
    res.json({items:result.rows,total:total.rows[0].total,page,pageSize:25});
  }));
  app.get("/api/admin/contacts",requireAdmin,safe(async(req,res)=>{
    const {page,search}=params.parse(req.query);
    const cte=`WITH contacts AS (
      SELECT DISTINCT ON (lower(trim(contact_email)))
        lower(trim(contact_email)) AS email,name,age,city,
        count(*) OVER (PARTITION BY lower(trim(contact_email)))::int AS "listingCount",
        min(created_at) OVER (PARTITION BY lower(trim(contact_email))) AS "firstCreated",
        max(created_at) OVER (PARTITION BY lower(trim(contact_email))) AS "lastCreated"
      FROM listings WHERE published AND email_verified AND contact_email IS NOT NULL
      ORDER BY lower(trim(contact_email)),created_at DESC,id DESC
    )`;
    const where=`($1='' OR strpos(lower(name),lower($1))>0 OR strpos(email,lower($1))>0 OR strpos(lower(city),lower($1))>0)`;
    const total=await pool.query(`${cte} SELECT count(*)::int AS total FROM contacts WHERE ${where}`,[search]);
    const result=await pool.query(`${cte} SELECT * FROM contacts WHERE ${where} ORDER BY "lastCreated" DESC,email LIMIT 25 OFFSET $2`,[search,(page-1)*25]);
    res.json({items:result.rows,total:total.rows[0].total,page,pageSize:25});
  }));
}
