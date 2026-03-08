# ActivityMatch

A modern, responsive web platform for connecting people through shared activities in their city. No login required.

## Architecture

- **Frontend**: React + TypeScript with Tailwind CSS and shadcn/ui components
- **Backend**: Node.js + Express with PostgreSQL database via Drizzle ORM
- **Routing**: wouter for client-side navigation
- **Data Fetching**: TanStack React Query
- **Font**: Inter (Google Fonts)
- **Theme**: Olive green (HSL 85) + warm orange/brown (HSL 28) matching the logo

## Key Features

1. **Browse Listings**: Card-based overview with search and filters (city dropdown, category, level)
2. **Create Listings**: Comprehensive form with validation, honeypot spam protection, searchable city dropdown (10,000+ German cities with PLZ)
3. **Detail View**: Full listing info with contact details
4. **Delete Listings**: Via secret key generated at creation time
5. **Admin Panel**: Password-protected admin page for managing and deleting any listing

## Pages

- `/` - Home page with listing grid, search, and filters
- `/create` - Create new listing form
- `/listing/:id` - Listing detail view
- `/admin` - Admin panel (password-protected, uses ADMIN_PASSWORD secret)

## Data Model

**Listings** table with fields: name, age, gender, city, category, title, description, level, activityDate (nullable — null means "Flexibel"), activityTime, recurrence (Einmalig/Wöchentlich/Monatlich), matchPreference (optional text for describing ideal match partner), contactEmail, contactPhone, contactNote (optional text for contact remarks like "Anfrage über WhatsApp möglich"), secretKey, createdAt

## Categories

Sport, Gaming, Musik, Outdoor, Fitness, Sonstiges

## Levels

Anfänger, Amateur, Profi

## File Structure

- `shared/schema.ts` - Drizzle schema and Zod validation
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface (DatabaseStorage with PostgreSQL)
- `server/routes.ts` - API routes (/api/listings, /api/admin/*)
- `server/seed.ts` - Database seed data
- `client/src/data/german-cities.ts` - German cities dataset (10,000+ cities with PLZ)
- `client/src/components/city-combobox.tsx` - Searchable city dropdown component
- `client/src/pages/home.tsx` - Home page with listing grid
- `client/src/pages/create-listing.tsx` - Create listing form
- `client/src/pages/listing-detail.tsx` - Listing detail page
- `client/src/pages/admin.tsx` - Admin panel page
