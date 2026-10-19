import { NextResponse } from "next/server";
import { isE2EMode, signE2ESession } from "@/lib/auth/require";
import { createSession } from "@/lib/auth/service";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE } from "@/lib/auth/session";

// Temporary local-dev entry. E2E_MODE-gated like /api/dev/session — 404s
// unless E2E_MODE=1. Delete before production.
const DESTINATIONS: Record<string, string> = {
  "00000000-0000-0000-0000-00000000ad01": "/admin",
  "00000000-0000-0000-0000-00000000ac01": "/dashboard",
  "00000000-0000-0000-0000-00000000aa01": "/dashboard",
};

export async function GET(request: Request) {
  if (!isE2EMode()) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const userId = new URL(request.url).searchParams.get("as") ?? "";
  const next = DESTINATIONS[userId];
  if (!next) return NextResponse.json({ ok: false }, { status: 400 });
  const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(users).values({
      id: userId,
      email: `e2e-${userId.slice(0, 8)}@example.com`,
      passwordHash: `$2b$12$e2eprovisioned${"x".repeat(38)}`,
      emailVerifiedAt: new Date(),
    });
  }
  const session = await createSession(userId, {});
  const res = NextResponse.redirect(new URL(next, request.url));
  res.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });
  res.cookies.set("e2e_session", signE2ESession(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return res;
}
