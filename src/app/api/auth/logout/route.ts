import { NextResponse } from "next/server";
import { clearSessionCookie, readSessionCookie } from "@/lib/auth/session";
import { revokeSession } from "@/lib/auth/service";

// Logout: revoke the current session server-side, then clear the cookie.
// Always succeeds from the client's perspective (idempotent).
export async function POST() {
  const token = readSessionCookie();
  if (token) {
    try {
      await revokeSession(token);
    } catch {
      // Cookie is cleared regardless — a dead row is harmless.
    }
  }
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
