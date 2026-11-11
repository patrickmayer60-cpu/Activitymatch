import { pool } from "./db";

// Additive and repeatable: never drops existing tables or columns.
export async function migrateContactSchema() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(74110512)");
    await client.query(`CREATE TABLE IF NOT EXISTS listings (
      id serial PRIMARY KEY, name text NOT NULL, age integer NOT NULL,
      gender text NOT NULL, city text NOT NULL, category text NOT NULL,
      title text NOT NULL, description text NOT NULL, level text NOT NULL,
      activity_date text, activity_time text, recurrence text DEFAULT 'Einmalig',
      match_preference text, contact_email text, contact_phone text, contact_note text,
      secret_key text NOT NULL, created_at timestamp NOT NULL DEFAULT now()
    )`);
    await client.query(`ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS contact_enabled boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS manage_hash text`);
    await client.query(`CREATE TABLE IF NOT EXISTS email_actions (
      token_hash text PRIMARY KEY, kind text NOT NULL,
      listing_id integer NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      payload jsonb NOT NULL DEFAULT '{}', expires_at timestamptz NOT NULL,
      consumed_at timestamptz
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS mail_limits (
      key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS platform_daily (
      day date PRIMARY KEY, published_count integer NOT NULL DEFAULT 0,
      contact_count integer NOT NULL DEFAULT 0
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS platform_metrics_meta (
      id integer PRIMARY KEY CHECK(id=1), started_at timestamptz NOT NULL DEFAULT now()
    )`);
    await client.query("INSERT INTO platform_metrics_meta(id) VALUES(1) ON CONFLICT DO NOTHING");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
