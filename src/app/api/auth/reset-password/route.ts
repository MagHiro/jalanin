import { NextResponse } from "next/server";
import { z } from "zod";
import { passwordSchema } from "@/lib/validation/schemas";
import { AuthServiceError, resetPasswordWithToken } from "@/lib/auth/service";
import { clientIp, rateLimit } from "@/lib/security/ratelimit";
import { logServerError } from "@/lib/observability/logger";

const schema = z.object({
  token: z.string().min(10).max(200),
  password: passwordSchema,
});

// Consumes a single-use reset token, sets the new password, revokes all
// sessions. Generic failures: tokens are not distinguished as invalid vs
// expired to the caller beyond the message (both require a new link).
export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    if (!(await rateLimit(`auth:reset:${ip}`, 10, 10 * 60 * 1000)).ok) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "The reset link is invalid. Request a new one." }, { status: 400 });
    }
    await resetPasswordWithToken(parsed.data.token, parsed.data.password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return NextResponse.json(
        { ok: false, error: "The reset link is invalid or has expired. Request a new one." },
        { status: 400 },
      );
    }
    const incidentId = logServerError("auth.reset.failed", error);
    return NextResponse.json(
      { ok: false, error: "Reset failed. Please try again.", incidentId },
      { status: 500 },
    );
  }
}
