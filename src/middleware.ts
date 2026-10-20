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
        // Compare host only: TLS terminates at nginx, so the browser sends
        // `Origin: https://<host>` while the app behind the proxy sees
        // `http://<host>`. `Host` is set to $host by nginx
        // (see deploy/nginx/*.conf), so it is proxy-controlled — unlike
        // X-Forwarded-Host, which nginx currently passes through from the
        // client and must NOT be trusted here.
        const expectedHost = (
          request.headers.get("host") ?? request.nextUrl.host
        )
          .split(",")[0]
          .split(":")[0]
          .trim()
          .toLowerCase();
        const originHost = new URL(origin).hostname.toLowerCase();
        invalidOrigin = originHost !== expectedHost;
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
