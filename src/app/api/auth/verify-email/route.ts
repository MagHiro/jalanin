import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthServiceError,
  createSession,
  verifyEmailToken,
} from "@/lib/auth/service";
import { setSessionCookie } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/security/ratelimit";
import { logServerError } from "@/lib/observability/logger";

const schema = z.object({ token: z.string().min(10).max(200) });

// Consumes a single-use verification token and signs the user in.
export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    if (!(await rateLimit(`auth:verify:${ip}`, 20, 10 * 60 * 1000)).ok) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "The verification link is invalid." }, { status: 400 });
    }
    const user = await verifyEmailToken(parsed.data.token);
    const session = await createSession(user.id, {
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    setSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return NextResponse.json(
        { ok: false, error: "The verification link is invalid or has expired." },
        { status: 400 },
      );
    }
    const incidentId = logServerError("auth.verify.failed", error);
    return NextResponse.json(
      { ok: false, error: "Verification failed. Please try again.", incidentId },
      { status: 500 },
    );
  }
}
