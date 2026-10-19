import { NextResponse } from "next/server";
import { z } from "zod";
import { emailSchema } from "@/lib/validation/schemas";
import { AuthServiceError, authenticate, createSession } from "@/lib/auth/service";
import { setSessionCookie } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/security/ratelimit";
import { logServerError } from "@/lib/observability/logger";

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(128),
  remember: z.boolean().optional(),
});

// Native login: rate-limited, constant-shape failures (no enumeration).
export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    if (!(await rateLimit(`auth:login:${ip}`, 20, 10 * 60 * 1000)).ok) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }
    const parsed = loginSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Email or password is incorrect." }, { status: 401 });
    }
    // Reuse the password policy type without its message (login must not
    // distinguish "too short" from "wrong").
    if (parsed.data.password.length > 128) {
      return NextResponse.json({ ok: false, error: "Email or password is incorrect." }, { status: 401 });
    }
    const user = await authenticate(
      parsed.data.email.trim().toLowerCase(),
      parsed.data.password,
    );
    const session = await createSession(user.id, {
      remember: parsed.data.remember,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    setSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({ ok: true, emailVerified: user.emailVerified });
  } catch (error) {
    if (error instanceof AuthServiceError && error.code === "invalid_credentials") {
      return NextResponse.json({ ok: false, error: "Email or password is incorrect." }, { status: 401 });
    }
    const incidentId = logServerError("auth.login.failed", error);
    return NextResponse.json(
      { ok: false, error: "Could not log in. Please try again.", incidentId },
      { status: 500 },
    );
  }
}

