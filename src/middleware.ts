import { NextRequest, NextResponse } from "next/server";

// Cookie-authenticated mutations must not accept requests from arbitrary
// origins (including same-site sibling subdomains). Do not depend on hidden
// form buttons or SameSite cookies as the only CSRF defense.
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  if (unsafe && path.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    let invalidOrigin = false;
    if (origin) {
      try {
        invalidOrigin = new URL(origin).origin !== request.nextUrl.origin;
      } catch {
        invalidOrigin = true;
      }
    }
    if (invalidOrigin || (!origin && fetchSite === "cross-site")) {
      return NextResponse.json(
        { ok: false, error: "Cross-origin mutation is not allowed." },
        { status: 403 },
      );
    }
  }
  const response = NextResponse.next();
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
