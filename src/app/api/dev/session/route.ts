import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isE2EMode, signE2ESession } from "@/lib/auth/require";
import { createSession } from "@/lib/auth/service";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE } from "@/lib/auth/session";

// E2E/dev session mirror ONLY. Active solely when E2E_MODE=1 (local/CI test
// runs); returns 404 otherwise — including every production deployment.
// Issues a REAL native session cookie for the given user id (auto-provisioned
// as a verified user when missing), plus the legacy signed e2e_session
// cookie consumed by require.ts's devSession() seam.
export async function POST(request: Request) {
  if (!isE2EMode()) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  let body: { userId?: string };
  try {
    body = (await request.json()) as { userId?: string };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.userId || !/^[0-9a-f-]{36}$/i.test(body.userId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const existing = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(users).values({
      id: body.userId,
      email: `e2e-${body.userId}@example.com`,
      // Random 60-char bcrypt-shaped placeholder; never used for login.
      passwordHash: `$2b$12$e2eprovisioned${"x".repeat(38)}`,
      emailVerifiedAt: new Date(),
    }).onConflictDoNothing();
  }
  const session = await createSession(body.userId, {});
  cookies().set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });
  cookies().set("e2e_session", signE2ESession(body.userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return NextResponse.json({ ok: true });
}
