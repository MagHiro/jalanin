import { NextResponse } from "next/server";

// Lightweight middleware: security headers on every response. AuthZ itself is
// enforced server-side per route (requireStudent/requireAdmin) and by RLS —
// middleware is never the sole access control.
export function middleware() {
  const response = NextResponse.next();
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
