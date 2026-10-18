import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";
import { dispatchDueEmails } from "@/lib/email/outbox";
import { logServerError } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

// Vercel Cron invokes GET; external workers may use POST. Both require the
// exact CRON_SECRET bearer token and never expose email data in the response.
function authorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const match = auth?.match(/^Bearer\\s+(.+)$/i);
  if (!expected || !match) return false;
  const provided = Buffer.from(match[1], "utf8");
  const secret = Buffer.from(expected, "utf8");
  return provided.length === secret.length && timingSafeEqual(provided, secret);
}

async function dispatch(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    await db.execute(sql`DELETE FROM request_rate_limits WHERE expires_at < now()`);
    const outcome = await dispatchDueEmails();
    console.info(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "email.dispatch.completed",
      ...outcome,
    }));
    return NextResponse.json({ ok: true, ...outcome }, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const incidentId = logServerError("email.dispatch.failed", error);
    return NextResponse.json(
      { ok: false, error: "Email dispatch is temporarily unavailable.", incidentId },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}

export const GET = dispatch;
export const POST = dispatch;
