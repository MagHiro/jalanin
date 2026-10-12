import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";
import { dispatchDueEmails } from "@/lib/email/outbox";

// Production cron entrypoint (Vercel Cron or equivalent) for the email
// outbox. Authorized by CRON_SECRET bearer token. Local alternative:
// `pnpm email:dispatch`.
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  // Keep the shared throttle table bounded.
  await db.execute(sql`DELETE FROM request_rate_limits WHERE expires_at < now()`);
  const outcome = await dispatchDueEmails();
  return NextResponse.json({ ok: true, ...outcome });
}
