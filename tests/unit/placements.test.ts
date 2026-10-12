import { describe, expect, it } from "vitest";
import {
  allowedNextPlacementStatuses,
  canTransitionPlacement,
} from "@/lib/workflow/placements";

describe("placement lifecycle (D17)", () => {
  it("follows Preparing → Confirmed → Active → Completed", () => {
    expect(canTransitionPlacement("Preparing", "Confirmed").ok).toBe(true);
    expect(canTransitionPlacement("Confirmed", "Active").ok).toBe(true);
    expect(canTransitionPlacement("Active", "Completed").ok).toBe(true);
  });

  it("allows Cancelled as terminal exit from non-terminal states", () => {
    for (const from of ["Preparing", "Confirmed", "Active"] as const) {
      expect(canTransitionPlacement(from, "Cancelled").ok).toBe(true);
    }
  });

  it("rejects skips, reversals, and terminal exits", () => {
    expect(canTransitionPlacement("Preparing", "Active").ok).toBe(false);
    expect(canTransitionPlacement("Active", "Preparing").ok).toBe(false);
    expect(canTransitionPlacement("Completed", "Active").ok).toBe(false);
    expect(canTransitionPlacement("Cancelled", "Preparing").ok).toBe(false);
  });

  it("exposes the allowed next statuses for state-aware UI", () => {
    expect(allowedNextPlacementStatuses("Preparing")).toEqual([
      "Confirmed",
      "Cancelled",
    ]);
    expect(allowedNextPlacementStatuses("Completed")).toEqual([]);
  });
});
