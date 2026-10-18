import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { isAnalyticsEvent, sanitizePayload } from "@/lib/analytics/events";
import { clientIp, rateLimit } from "@/lib/security/ratelimit";
import { logServerError } from "@/lib/observability/logger";

// Persist allowlisted events without identifiers or arbitrary payloads.
// Event data can be aggregated later; no vendor tracker or PII is required.
export async function POST(request: Request) {
  try {
  const ip = clientIp(request.headers);
  if (!(await rateLimit(`analytics:${ip}`, 120, 60 * 1000)).ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const raw = body as { event?: unknown; payload?: unknown };
  if (typeof raw.event !== "string" || !isAnalyticsEvent(raw.event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const safeInput = raw.payload && typeof raw.payload === "object" && !Array.isArray(raw.payload)
    ? sanitizePayload(raw.payload as Record<string, unknown>)
    : {};
  const path = typeof safeInput.path === "string" && /^\/[a-z0-9/\-]{0,300}$/.test(safeInput.path)
    ? safeInput.path : null;
  const slug = typeof safeInput.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(safeInput.slug) && safeInput.slug.length <= 160
    ? safeInput.slug : null;
  await db.execute(sql`
    INSERT INTO analytics_events (event_type, page_path, internship_slug)
    VALUES (${raw.event}, ${path}, ${slug})
  `);
  return NextResponse.json({ ok: true });
  } catch (error) {
    const incidentId = logServerError("analytics.ingest.failed", error);
    return NextResponse.json({ ok: false, incidentId }, { status: 503 });
  }
}
