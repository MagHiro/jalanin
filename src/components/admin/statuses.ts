// Client-safe mirror of allowed placement transitions (D17).
export function allowedNextPlacementStatusesUI(from: string): string[] {
  switch (from) {
    case "Preparing":
      return ["Confirmed", "Cancelled"];
    case "Confirmed":
      return ["Active", "Cancelled"];
    case "Active":
      return ["Completed", "Cancelled"];
    default:
      return [];
  }
}
