// Placement lifecycle (D17): Preparing → Confirmed → Active → Completed,
// with Cancelled as the terminal exit from any non-terminal state.
// Centralized here; enforced by the admin placement service + UI, tested.

export const PLACEMENT_STATUSES = [
  "Preparing",
  "Confirmed",
  "Active",
  "Completed",
  "Cancelled",
] as const;

export type PlacementStatus = (typeof PLACEMENT_STATUSES)[number];

const FORWARD: Record<PlacementStatus, PlacementStatus[]> = {
  Preparing: ["Confirmed", "Cancelled"],
  Confirmed: ["Active", "Cancelled"],
  Active: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

export function canTransitionPlacement(
  from: PlacementStatus,
  to: PlacementStatus,
): { ok: boolean; reason?: string } {
  if (from === to) return { ok: false, reason: "Placement is already in this status." };
  if (!FORWARD[from].includes(to)) {
    return {
      ok: false,
      reason: `Placement transition ${from} → ${to} is not permitted.`,
    };
  }
  return { ok: true };
}

export function allowedNextPlacementStatuses(
  from: PlacementStatus,
): PlacementStatus[] {
  return FORWARD[from];
}
