import { NextResponse } from "next/server";
import { isAnalyticsEvent, sanitizePayload } from "@/lib/analytics/events";
import { clientIp, rateLimit } from "@/lib/security/ratelimit";

// Privacy-respecting analytics intake: allowlisted events, sanitized payloads,
// rate-limited. Currently logged server-side; wire to an approved provider
// when Jalanin selects one (Q19 pending).
export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  if (!rateLimit(`analytics:${ip}`, 120, 60 * 1000).ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { event, payload } = (body ?? {}) as {
    event?: string;
    payload?: Record<string, unknown>;
  };
  if (!event || !isAnalyticsEvent(event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  console.log(
    JSON.stringify({
      type: "analytics",
      event,
      payload: sanitizePayload(payload ?? {}),
      at: new Date().toISOString(),
    }),
  );
  return NextResponse.json({ ok: true });
}
