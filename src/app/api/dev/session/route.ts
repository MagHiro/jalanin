import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isE2EMode } from "@/lib/supabase/server";
import { signE2ESession } from "@/lib/auth/require";

// E2E/dev session mirror ONLY. Active solely when E2E_MODE=1 (local/CI test
// runs); returns 404 otherwise — including every production deployment.
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
  if (!body.userId) return NextResponse.json({ ok: false }, { status: 400 });
  cookies().set("e2e_session", signE2ESession(body.userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return NextResponse.json({ ok: true });
}
