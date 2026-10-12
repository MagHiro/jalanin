import { NextResponse } from "next/server";
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
  const outcome = await dispatchDueEmails();
  return NextResponse.json({ ok: true, ...outcome });
}
