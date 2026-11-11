import { registerAdminDashboard } from "./admin-dashboard";
import { limit, PublicError, hashToken } from "./mail";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { registerContactRoutes } from "./contact";
import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import session from "express-session";
import { storage } from "./storage";

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.isAdmin) {
    return res.status(401).json({ message: "Nicht autorisiert" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 2,
      },
    })
  );

  app.use("/api/admin", (_req,res,next)=>{
    res.setHeader("Cache-Control","no-store");
    res.setHeader("X-Robots-Tag","noindex, nofollow");
    next();
  });
  registerContactRoutes(app);
  registerAdminDashboard(app, requireAdmin);

  app.post("/api/admin/login", async (req, res) => {
    try {
      await limit(`admin-login:${req.ip}`,10,900);
      const { password } = req.body;
      if (typeof password !== "string" || !password || !process.env.ADMIN_PASSWORD ||
          !timingSafeEqual(Buffer.from(hashToken(password),"hex"),Buffer.from(hashToken(process.env.ADMIN_PASSWORD),"hex"))) {
        return res.status(401).json({ message: "Falsches Passwort" });
      }
      await new Promise<void>((resolve,reject)=>req.session.regenerate(error=>error?reject(error):resolve()));
      req.session.isAdmin = true;
      await new Promise<void>((resolve,reject)=>req.session.save(error=>error?reject(error):resolve()));
      res.json({ message: "Erfolgreich angemeldet" });
    } catch (error) {
      res.status(error instanceof PublicError ? error.status : 500).json({ message: error instanceof PublicError ? error.message : "Fehler bei der Anmeldung" });
    }
  });

  app.get("/api/admin/session", (req, res) => {
    res.json({ authenticated: !!req.session.isAdmin });
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Abgemeldet" });
    });
  });

  app.delete("/api/admin/listings/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ungültige ID" });
      }
      const deleted = await storage.adminDeleteListing(id);
      if (!deleted) {
        return res.status(404).json({ message: "Anzeige nicht gefunden" });
      }
      res.json({ message: "Anzeige erfolgreich gelöscht" });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Löschen der Anzeige" });
    }
  });

  app.delete("/api/listings/:id", async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      const { secretKey } = req.body;
      if (isNaN(id) || !secretKey) {
        return res.status(400).json({ message: "Ungültige Anfrage" });
      }
      const deleted = await storage.deleteListing(id, secretKey);
      if (!deleted) {
        return res.status(403).json({ message: "Ungültiger Secret-Key oder Anzeige nicht gefunden" });
      }
      res.json({ message: "Anzeige erfolgreich gelöscht" });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Löschen der Anzeige" });
    }
  });

  return httpServer;
}
