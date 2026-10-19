import { NextResponse } from "next/server";
import { z } from "zod";
import { emailSchema, passwordSchema } from "@/lib/validation/schemas";
import { AuthServiceError, createSession, createUser } from "@/lib/auth/service";
import { setSessionCookie } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/security/ratelimit";
import { logServerError } from "@/lib/observability/logger";

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  remember: z.boolean().optional(),
});

// Native registration: validate → create user → verification email (outbox)
// → immediate session. Email failures never fail the signup itself.
export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    if (!(await rateLimit(`auth:signup:${ip}`, 10, 10 * 60 * 1000)).ok) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }
    const parsed = signUpSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Enter a valid email and a password of at least 8 characters." }, { status: 400 });
    }
    const { user } = await createUser({
      email: parsed.data.email.trim().toLowerCase(),
      password: parsed.data.password,
    });
    const session = await createSession(user.id, {
      remember: parsed.data.remember,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    setSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({ ok: true, emailVerified: user.emailVerified });
  } catch (error) {
    if (error instanceof AuthServiceError && error.code === "email_taken") {
      // Deliberately generic: identical shape to the success path minus session.
      return NextResponse.json(
        { ok: false, error: "Could not create the account. If an account exists, try logging in or resetting the password." },
        { status: 400 },
      );
    }
    const incidentId = logServerError("auth.signup.failed", error);
    return NextResponse.json(
      { ok: false, error: "Could not create the account. Please try again.", incidentId },
      { status: 500 },
    );
  }
}
