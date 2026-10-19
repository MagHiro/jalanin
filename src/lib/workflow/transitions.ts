// Canonical application lifecycle (PRD §7.7, decisions D05/D10/D14–D16).
// Centralized transition rules — imported by services, actions, and tests.
// Draft is the pre-submission form state, NOT a lifecycle_status value.

export const APPLICATION_STATUSES = [
  "New",
  "In Review",
  "Quotation Sent",
  "Accepted",
  "Rejected",
  "Completed",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ActorRole = "student" | "admin";

/** Editable by the owning student only while status is New/In Review (D14). */
export const STUDENT_EDITABLE_STATUSES: ReadonlySet<ApplicationStatus> =
  new Set<ApplicationStatus>(["New", "In Review"]);

/** Student writes are hard-locked at Quotation Sent and later (D14). */
export function isStudentEditLocked(status: ApplicationStatus): boolean {
  return !STUDENT_EDITABLE_STATUSES.has(status);
}

export interface TransitionRule {
  from: ApplicationStatus | null; // null = Draft (pre-submission)
  to: ApplicationStatus;
  actor: ActorRole;
  /** Whether a valid SGD quotation row must exist before committing. */
  requiresQuotation: boolean;
  /** Whether latest revision must already be admin-reviewed. */
  requiresReviewedRevision: boolean;
}

/**
 * Canonical transition table. Interim default for admin-only reopen of
 * Rejected → In Review (open decision B03, see docs/open-decisions.md).
 * Early rejection New/In Review → Rejected is permitted (policy-pending per
 * PRD; reason required and audited).
 */
export const TRANSITIONS: readonly TransitionRule[] = [
  { from: null, to: "New", actor: "student", requiresQuotation: false, requiresReviewedRevision: false },
  { from: "New", to: "In Review", actor: "admin", requiresQuotation: false, requiresReviewedRevision: false },
  { from: "New", to: "Rejected", actor: "admin", requiresQuotation: false, requiresReviewedRevision: false },
  // Temporary stage-only quotation workflow: no quotation data entry required.
  { from: "In Review", to: "Quotation Sent", actor: "admin", requiresQuotation: false, requiresReviewedRevision: true },
  { from: "In Review", to: "Rejected", actor: "admin", requiresQuotation: false, requiresReviewedRevision: false },
  { from: "Quotation Sent", to: "Accepted", actor: "admin", requiresQuotation: false, requiresReviewedRevision: false },
  { from: "Quotation Sent", to: "Rejected", actor: "admin", requiresQuotation: false, requiresReviewedRevision: false },
  { from: "Accepted", to: "Completed", actor: "admin", requiresQuotation: false, requiresReviewedRevision: false },
  // Admin-only reopen (D15). Same record, audited; interim target In Review.
  { from: "Rejected", to: "In Review", actor: "admin", requiresQuotation: false, requiresReviewedRevision: false },
];

export function findTransition(
  from: ApplicationStatus | null,
  to: ApplicationStatus,
): TransitionRule | undefined {
  return TRANSITIONS.find((t) => t.from === from && t.to === to);
}

export interface TransitionCheckInput {
  from: ApplicationStatus | null;
  to: ApplicationStatus;
  actor: ActorRole;
  /** Current needs_re_review flag on the application row. */
  needsReReview: boolean;
  /** Whether a valid SGD quotation row exists for the application. */
  hasValidQuotation: boolean;
  /** Latest revision already acknowledged by an admin (reviewed_revision == revision). */
  revisionReviewed: boolean;
}

export interface TransitionCheckResult {
  ok: boolean;
  reason?: string;
}

/** Pure guard: permission + valid transition + prerequisites (D10 re-review block). */
export function canTransition(input: TransitionCheckInput): TransitionCheckResult {
  const rule = findTransition(input.from, input.to);
  if (!rule) {
    return {
      ok: false,
      reason: `Transition ${input.from ?? "Draft"} → ${input.to} is not permitted.`,
    };
  }
  if (rule.actor !== input.actor) {
    return {
      ok: false,
      reason: `Only ${rule.actor === "admin" ? "an authorized admin" : "the owning student"} may perform this transition.`,
    };
  }
  // While re-review is pending, progression to quote/accept/complete is blocked.
  if (
    input.needsReReview &&
    (input.to === "Quotation Sent" ||
      input.to === "Accepted" ||
      input.to === "Completed")
  ) {
    return {
      ok: false,
      reason:
        "A student revision is awaiting admin re-review. Acknowledge the latest revision before progressing.",
    };
  }
  if (rule.requiresQuotation && !input.hasValidQuotation) {
    return {
      ok: false,
      reason: "A valid SGD quotation is required before sending a quotation.",
    };
  }
  if (rule.requiresReviewedRevision && !input.revisionReviewed) {
    return {
      ok: false,
      reason: "The latest application revision must be admin-reviewed first.",
    };
  }
  return { ok: true };
}

/** Next transitions shown in state-aware admin UI (ADM-APP-10). */
export function allowedNextStatuses(
  from: ApplicationStatus,
  actor: ActorRole,
): ApplicationStatus[] {
  return TRANSITIONS.filter((t) => t.from === from && t.actor === actor).map(
    (t) => t.to,
  );
}

/** Parse SGD major-unit input (e.g. "1,250.50") to integer minor units. */
export function parseSgdToMinor(input: string): number | null {
  const normalized = input.replace(/[\s,]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [dollars, cents = ""] = normalized.split(".");
  const minor = Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor <= 0) return null;
  return minor;
}

/** Format integer minor units as an SGD display string. No float math. */
export function formatSgd(minor: number): string {
  const dollars = Math.trunc(minor / 100);
  const cents = Math.abs(minor % 100).toString().padStart(2, "0");
  return `SGD ${dollars.toLocaleString("en-SG")}.${cents}`;
}
