"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics/events";

// Fire-and-forget page-view beacon (no PII). Mount once per page as needed.
export function AnalyticsBeacon({
  event,
  payload,
}: {
  event: AnalyticsEvent;
  payload?: Record<string, unknown>;
}) {
  useEffect(() => {
    track(event, payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
  return null;
}
