import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

// PostgreSQL-backed throttling across Vercel instances and Docker development.
// Only a salted bucket hash is stored, never an IP address.
export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAfterMs: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(windowMs) || windowMs < 1000) {
    throw new Error("Invalid rate limiting configuration.");
  }
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const expires = new Date((window + 1) * windowMs);
  const pepper = process.env.RATE_LIMIT_PEPPER || process.env.CRON_SECRET || "development-only";
  const digest = createHash("sha256").update(`${pepper}:${key}:${window}`).digest("hex");
  const result = await db.execute(sql`
    INSERT INTO request_rate_limits (bucket_hash, request_count, expires_at)
    VALUES (${digest}, 1, ${expires})
    ON CONFLICT (bucket_hash)
    DO UPDATE SET request_count = request_rate_limits.request_count + 1
    RETURNING request_count
  `);
  const count = Number(result.rows[0]?.request_count ?? 1);
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAfterMs: Math.max(0, expires.getTime() - now),
  };
}

export function clientIp(headers: Headers): string {
  // On Vercel, prefer the provider-supplied address over client-controlled XFF.
  const raw = process.env.VERCEL === "1"
    ? headers.get("x-vercel-forwarded-for")
    : headers.get("x-real-ip") || headers.get("x-forwarded-for");
  return raw?.split(",")[0]?.trim() || "unknown";
}

/** Server-side Cloudflare Turnstile verification. Never trust client alone. */
export async function verifyTurnstile(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || (process.env.NODE_ENV === "production" && /^[123]x0{10,}/.test(secret))) {
    return false;
  }
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
