import { type Listing, type InsertListing, listings } from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, and, SQL } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  getListings(filters?: {
    city?: string;
    category?: string;
    level?: string;
    search?: string;
  }): Promise<Listing[]>;
  getListing(id: number): Promise<Listing | undefined>;
  createListing(listing: Omit<InsertListing, "consent">): Promise<{ listing: Listing; secretKey: string }>;
  deleteListing(id: number, secretKey: string): Promise<boolean>;
  adminDeleteListing(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getListings(filters?: {
    city?: string;
    category?: string;
    level?: string;
    search?: string;
  }): Promise<Listing[]> {
    const conditions: SQL[] = [];

    if (filters?.city) {
      conditions.push(ilike(listings.city, `%${filters.city}%`));
    }
    if (filters?.category) {
      conditions.push(eq(listings.category, filters.category));
    }
    if (filters?.level) {
      conditions.push(eq(listings.level, filters.level));
    }
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        ilike(listings.title, searchTerm)
      );
    }

    if (conditions.length > 0) {
      return db.select().from(listings).where(and(...conditions)).orderBy(desc(listings.createdAt));
    }

    return db.select().from(listings).orderBy(desc(listings.createdAt));
  }

  async getListing(id: number): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
  }

  async createListing(listing: Omit<InsertListing, "consent">): Promise<{ listing: Listing; secretKey: string }> {
    const secretKey = randomBytes(16).toString("hex");
    const [created] = await db.insert(listings).values({
      ...listing,
      activityDate: listing.activityDate || null,
      activityTime: listing.activityTime || null,
      matchPreference: listing.matchPreference || null,
      contactNote: listing.contactNote || null,
      secretKey,
    }).returning();
    return { listing: created, secretKey };
  }

  async deleteListing(id: number, secretKey: string): Promise<boolean> {
    const listing = await this.getListing(id);
    if (!listing || listing.secretKey !== secretKey) return false;
    await db.delete(listings).where(eq(listings.id, id));
    return true;
  }

  async adminDeleteListing(id: number): Promise<boolean> {
    const listing = await this.getListing(id);
    if (!listing) return false;
    await db.delete(listings).where(eq(listings.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
