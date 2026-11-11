import { pool } from "./db";

export async function cleanupExpiredData() {
  await pool.query("DELETE FROM email_actions WHERE expires_at < now()");
  await pool.query("DELETE FROM listings WHERE published=false AND email_verified=false AND created_at < now()-interval '24 hours'");
  await pool.query("DELETE FROM mail_limits WHERE expires_at < now()");
}
export function startCleanup() {
  const run = () => cleanupExpiredData().catch(() => console.error("Expired-data cleanup failed"));
  void run();
  setInterval(run, 60 * 60 * 1000).unref();
}
