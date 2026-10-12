import { NextResponse } from "next/server";
import { isE2EMode } from "@/lib/supabase/server";
import { signE2ESession } from "@/lib/auth/require";

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
  const res = NextResponse.redirect(new URL(next, request.url));
  res.cookies.set("e2e_session", signE2ESession(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return res;
}
