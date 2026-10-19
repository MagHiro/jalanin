import { NextResponse } from "next/server";
import { z } from "zod";
import { emailSchema } from "@/lib/validation/schemas";
import { requestPasswordReset } from "@/lib/auth/service";
import { clientIp, rateLimit } from "@/lib/security/ratelimit";
import { logServerError } from "@/lib/observability/logger";

const schema = z.object({ email: emailSchema });

// Always returns ok (no account enumeration); throttled per IP.
export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    if (!(await rateLimit(`auth:forgot:${ip}`, 5, 10 * 60 * 1000)).ok) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      // Same success shape for malformed input — no oracle.
      return NextResponse.json({ ok: true });
    }
    await requestPasswordReset(parsed.data.email.trim().toLowerCase());
    return NextResponse.json({ ok: true });
  } catch (error) {
    const incidentId = logServerError("auth.forgot.failed", error);
    return NextResponse.json(
      { ok: false, error: "Request failed. Please try again.", incidentId },
      { status: 500 },
    );
  }
}
