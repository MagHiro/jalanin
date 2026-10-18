import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { contactSubmissions } from "@/lib/db/schema";
import { enqueueEmail } from "@/lib/email/outbox";
import { adminAlertRecipients } from "@/lib/email/provider";
import { clientIp, rateLimit, verifyTurnstile } from "@/lib/security/ratelimit";
import { contactInputSchema } from "@/lib/validation/schemas";
import { logServerError } from "@/lib/observability/logger";

// Public contact intake (COM-*): validate → Turnstile → store → notify.
// Rate-limited per IP. Failures never expose internals.
export async function POST(request: Request) {
  try {
  const ip = clientIp(request.headers);
  const limit = await rateLimit(`contact:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many messages. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const parsed = contactInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid fields." },
      { status: 400 },
    );
  }

  // Server-side Turnstile verification (COM-02). Test keys from .env.example
  // always pass via Cloudflare; missing/invalid tokens fail safely.
  const human = await verifyTurnstile(parsed.data.turnstileToken, ip === "unknown" ? undefined : ip);
  if (!human) {
    return NextResponse.json(
      { ok: false, error: "Bot verification failed. Please try again." },
      { status: 400 },
    );
  }

  // Submission and notification must commit together.
  await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(contactSubmissions).values({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    }).returning({ id: contactSubmissions.id });
    for (const recipient of adminAlertRecipients()) {
      await enqueueEmail({
        eventKey: `contact-notify:${inserted.id}:${recipient}`,
        recipient,
        templateKey: "contact-notify",
        payload: {
          name: parsed.data.name,
          email: parsed.data.email,
          subject: parsed.data.subject,
          message: parsed.data.message,
        },
      }, tx);
    }
  });

  return NextResponse.json({ ok: true });
  } catch (error) {
    const incidentId = logServerError("contact.submit.failed", error);
    return NextResponse.json(
      { ok: false, error: "We could not send your message. Please try again later.", incidentId },
      { status: 503 },
    );
  }
}
