import { pgTable, text, varchar, integer, timestamp, serial, boolean, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  city: text("city").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  level: text("level").notNull(),
  activityDate: text("activity_date"),
  activityTime: text("activity_time"),
  recurrence: text("recurrence").default("Einmalig"),
  matchPreference: text("match_preference"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactNote: text("contact_note"),
  secretKey: text("secret_key").notNull(),
  published: boolean("published").default(true).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  contactEnabled: boolean("contact_enabled").default(true).notNull(),
  manageHash: text("manage_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertListingSchema = createInsertSchema(listings).omit({
  published: true,
  emailVerified: true,
  contactEnabled: true,
  manageHash: true,
  id: true,
  secretKey: true,
  createdAt: true,
}).extend({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein").max(100),
  age: z.number().min(13, "Mindestalter ist 13").max(120, "Maximales Alter ist 120"),
  gender: z.enum(["Männlich", "Weiblich", "Divers", "Keine Angabe"]),
  city: z.string().min(2, "Stadt muss mindestens 2 Zeichen lang sein").max(100),
  category: z.enum(["Sport", "Gaming", "Musik", "Outdoor", "Fitness", "Sonstiges"]),
  title: z.string().min(5, "Titel muss mindestens 5 Zeichen lang sein").max(150),
  description: z.string().min(10, "Beschreibung muss mindestens 10 Zeichen lang sein").max(500, "Beschreibung darf maximal 500 Zeichen lang sein"),
  level: z.enum(["Anfänger", "Amateur", "Profi"]),
  activityDate: z.string().optional().nullable().or(z.literal("")),
  activityTime: z.string().optional().nullable().or(z.literal("")),
  recurrence: z.enum(["Einmalig", "Wöchentlich", "Monatlich"]).default("Einmalig"),
  matchPreference: z.string().max(200, "Maximal 200 Zeichen").optional().nullable().or(z.literal("")),
  contactEmail: z.string().trim().email("Ungültige E-Mail-Adresse").max(254),
  contactPhone: z.literal("").optional().nullable(),
  contactNote: z.string().max(200, "Maximal 200 Zeichen").optional().nullable().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "Zustimmung ist erforderlich" }) }),
});

export const editListingSchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(10).max(500),
  city: z.string().trim().min(2).max(100),
  category: z.enum(["Sport", "Gaming", "Musik", "Outdoor", "Fitness", "Sonstiges"]),
  level: z.enum(["Anfänger", "Amateur", "Profi"]),
  activityDate: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/).nullable(),
  activityTime: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  contactEnabled: z.boolean(),
});
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(2000),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
});
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;
export type PublicListing = Omit<Listing, "contactEmail" | "contactPhone" | "secretKey" | "manageHash" | "emailVerified" | "published"> & { canContact: boolean };

// Keep schema tooling aware of the auxiliary tables as well.
export const emailActions = pgTable("email_actions", {
  tokenHash: text("token_hash").primaryKey(),
  kind: text("kind").notNull(),
  listingId: integer("listing_id").notNull().references(() => listings.id, {onDelete: "cascade"}),
  payload: jsonb("payload").notNull().default({}),
  expiresAt: timestamp("expires_at", {withTimezone: true}).notNull(),
  consumedAt: timestamp("consumed_at", {withTimezone: true}),
});
export const mailLimits = pgTable("mail_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: timestamp("expires_at", {withTimezone: true}).notNull(),
});

export const platformDaily = pgTable("platform_daily", {
  day: date("day").primaryKey(),
  publishedCount: integer("published_count").notNull().default(0),
  contactCount: integer("contact_count").notNull().default(0),
});
export const platformMetricsMeta = pgTable("platform_metrics_meta", {
  id: integer("id").primaryKey(),
  startedAt: timestamp("started_at", {withTimezone: true}).notNull().defaultNow(),
});
