import { pgTable, text, varchar, integer, timestamp, serial } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertListingSchema = createInsertSchema(listings).omit({
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
  contactEmail: z.string().email("Ungültige E-Mail-Adresse").optional().nullable().or(z.literal("")),
  contactPhone: z.string().optional().nullable().or(z.literal("")),
  contactNote: z.string().max(200, "Maximal 200 Zeichen").optional().nullable().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "Zustimmung ist erforderlich" }) }),
}).refine(
  (data) => data.contactEmail || data.contactPhone,
  { message: "Mindestens eine Kontaktmöglichkeit ist erforderlich", path: ["contactEmail"] }
);

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;
