import { describe, expect, it } from "vitest";
import { waitingDays, waitingLabel, waitingSince } from "@/lib/workflow/waiting-time";

const NOW = new Date("2026-10-20T12:00:00.000Z");

describe("waiting-time helpers (A2 — committed events only, no invented SLAs)", () => {
  it("uses the latest entry into the current status", () => {
    const since = waitingSince({
      lifecycleStatus: "In Review",
      submittedAt: new Date("2026-10-01T00:00:00.000Z"),
      events: [
        { toStatus: "New", createdAt: new Date("2026-10-01T00:00:00.000Z") },
        { toStatus: "In Review", createdAt: new Date("2026-10-10T00:00:00.000Z") },
        { toStatus: "In Review", createdAt: new Date("2026-10-12T00:00:00.000Z") },
      ],
    });
    expect(since?.toISOString()).toBe("2026-10-12T00:00:00.000Z");
  });

  it("falls back to submission time for the initial New state", () => {
    const since = waitingSince({
      lifecycleStatus: "New",
      submittedAt: new Date("2026-10-15T00:00:00.000Z"),
      events: [],
    });
    expect(since?.toISOString()).toBe("2026-10-15T00:00:00.000Z");
  });

  it("returns null instead of an invented duration when timing is unavailable", () => {
    expect(
      waitingSince({ lifecycleStatus: "In Review", submittedAt: null, events: [] }),
    ).toBeNull();
    // Non-initial status without a matching event: no fallback.
    expect(
      waitingSince({
        lifecycleStatus: "In Review",
        submittedAt: new Date("2026-10-15T00:00:00.000Z"),
        events: [{ toStatus: "New", createdAt: new Date("2026-10-15T00:00:00.000Z") }],
      }),
    ).toBeNull();
    // Other statuses carry no waiting indicator.
    expect(waitingLabel(waitingDays(null, NOW))).toBeNull();
  });

  it("counts whole days and labels them compactly", () => {
    expect(waitingDays(new Date("2026-10-20T11:00:00.000Z"), NOW)).toBe(0);
    expect(waitingLabel(0)).toBe("Today");
    expect(waitingLabel(1)).toBe("Yesterday");
    expect(waitingLabel(9)).toBe("9 days");
    expect(waitingDays(new Date("2026-10-11T12:00:00.000Z"), NOW)).toBe(9);
  });

  it("rejects future or invalid timestamps", () => {
    expect(waitingDays(new Date("2026-10-21T00:00:00.000Z"), NOW)).toBeNull();
    expect(
      waitingSince({
        lifecycleStatus: "New",
        submittedAt: "not-a-date",
        events: [],
      }),
    ).toBeNull();
  });
});
