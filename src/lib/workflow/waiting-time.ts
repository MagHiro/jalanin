// Waiting-time helpers for admin application review (A2).
// Timing derives from committed lifecycle data: the latest status event
// entering the current status, or submission time for the initial New state.
// No invented SLA targets — durations are informational only.

export interface WaitingSinceInput {
  lifecycleStatus: string;
  submittedAt: Date | string | null;
  /** Committed events for this application, newest first or unsorted. */
  events: Array<{ toStatus: string; createdAt: Date | string }>;
}

/**
 * Start of the current status wait, or null when it cannot be determined
 * from committed data (neutral fallback — never an invented duration).
 */
export function waitingSince(input: WaitingSinceInput): Date | null {
  const entered = input.events
    .filter((e) => e.toStatus === input.lifecycleStatus)
    .map((e) => new Date(e.createdAt).getTime())
    .filter((t) => !Number.isNaN(t));
  if (entered.length > 0) return new Date(Math.max(...entered));
  if (input.lifecycleStatus === "New" && input.submittedAt) {
    const submitted = new Date(input.submittedAt);
    return Number.isNaN(submitted.getTime()) ? null : submitted;
  }
  return null;
}

/** Whole days between `since` and `now` (defaults to now). */
export function waitingDays(since: Date | null, now: Date = new Date()): number | null {
  if (!since) return null;
  const diff = now.getTime() - since.getTime();
  if (Number.isNaN(diff) || diff < 0) return null;
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

/** Compact human label: "Today", "Yesterday", "N days", or null. */
export function waitingLabel(days: number | null): string | null {
  if (days === null) return null;
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days`;
}
