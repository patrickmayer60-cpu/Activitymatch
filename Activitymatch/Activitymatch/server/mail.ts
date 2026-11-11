import { createHash, randomBytes } from "node:crypto";
import { pool } from "./db";
import type { PoolClient } from "pg";

export const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
export const newToken = () => randomBytes(32).toString("hex");
export class PublicError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function baseUrl() {
  const url = new URL(process.env.APP_BASE_URL || "");
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) {
    throw new Error("APP_BASE_URL must use HTTPS");
  }
  return url.origin;
}
export function mailConfigured() {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new PublicError(503, "Der E-Mail-Versand ist noch nicht eingerichtet.");
  }
  baseUrl();
}
// PostgreSQL counters survive restarts and coordinate multiple instances.
export async function limit(key: string, maximum: number, seconds: number, connection?: PoolClient) {
  const result = await (connection || pool).query(`INSERT INTO mail_limits (key, count, expires_at)
    VALUES ($1,1,now()+($2 * interval '1 second'))
    ON CONFLICT (key) DO UPDATE SET
      count=CASE WHEN mail_limits.expires_at<=now() THEN 1 ELSE mail_limits.count+1 END,
      expires_at=CASE WHEN mail_limits.expires_at<=now() THEN excluded.expires_at ELSE mail_limits.expires_at END
    RETURNING count`, [hashToken(key), seconds]);
  if (result.rows[0].count > maximum) {
    throw new PublicError(429, "Zu viele Anfragen. Bitte versuche es später erneut.");
  }
}
export async function sendMail(input: { to: string; subject: string; text: string; replyTo?: string; idempotencyKey: string }, connection?: PoolClient) {
  mailConfigured();
  // Leave headroom below the initial provider daily quota. Adjustable after upgrading.
  const budget = Number(process.env.MAIL_DAILY_LIMIT || 90);
  await limit(`daily-mail:${new Date().toISOString().slice(0,10)}`, Number.isFinite(budget) && budget > 0 ? budget : 90, 172800, connection);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [input.to], subject: input.subject, text: input.text,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    }),
  });
  if (!response.ok) {
    // Provider error bodies may contain private addresses. Do not log them.
    console.error("Mail provider returned status", response.status);
    throw new PublicError(503, "E-Mail konnte gerade nicht versendet werden. Bitte später erneut versuchen.");
  }
}
