// Privacy-respecting analytics (PRD §11.3). Allowlisted event names only;
// payloads must never contain PII (no email, nationality, CV filename, notes).
// Transport: POST /api/analytics → structured server log. No third-party
// tracker is bundled; enabling NEXT_PUBLIC_ANALYTICS_ENABLED=1 activates the
// beacon. Conversion denominators come from database records, not this log.
export const ANALYTICS_EVENTS = [
  "page_view",
  "internship_view",
  "apply_clicked",
  "application_draft_saved",
  "application_submitted",
  "contact_submitted",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEvent(value: string): value is AnalyticsEvent {
  return (ANALYTICS_EVENTS as readonly string[]).includes(value);
}

const FORBIDDEN_KEYS = [
  "email",
  "nationality",
  "firstName",
  "lastName",
  "filename",
  "message",
  "notes",
];

export function sanitizePayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (FORBIDDEN_KEYS.includes(k)) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      clean[k] = v;
    }
  }
  return clean;
}

export function track(event: AnalyticsEvent, payload: Record<string, unknown> = {}): void {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true") return;
  try {
    const body = JSON.stringify({ event, payload: sanitizePayload(payload) });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    // Analytics must never break the user journey.
  }
}
