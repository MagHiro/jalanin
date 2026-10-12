// Minimal in-memory IP rate limiter for public endpoints (contact, auth).
// Single-instance semantics are sufficient for MVP scale; documented so a
// shared store (or platform limits) can replace it without changing callers.
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAfterMs: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAfterMs: windowMs };
  }
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAfterMs: existing.resetAt - now };
  }
  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAfterMs: existing.resetAt - now,
  };
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Server-side Cloudflare Turnstile verification. Never trust client alone. */
export async function verifyTurnstile(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Cloudflare's always-pass testing secrets MUST NOT be deployable as a
  // production anti-bot control. Missing secrets fail closed everywhere.
  if (!secret || (process.env.NODE_ENV === "production" && /^[123]x0{10,}/.test(secret))) {
    return false;
  }
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: token,
          ...(remoteIp ? { remoteip: remoteIp } : {}),
        }),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
