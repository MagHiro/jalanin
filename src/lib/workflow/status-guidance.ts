// Student-facing application status guidance (S1).
// Pure content module: explains what each existing lifecycle status means,
// what happens next, and whether the student needs to act. No invented
// deadlines, percentages, or SLA claims — only committed workflow semantics
// from src/lib/workflow/transitions.ts.

export interface StatusGuidance {
  /** Short meaning of the current status. */
  status: string;
  /** What happens next (team-owned steps only). */
  next: string;
  /** Whether the student must act, and what to do. */
  action: string;
  /** True when the student has something to do. */
  actionRequired: boolean;
}

type KnownStatus =
  | "Draft"
  | "New"
  | "In Review"
  | "Quotation Sent"
  | "Accepted"
  | "Rejected"
  | "Completed";

const GUIDANCE: Record<KnownStatus, StatusGuidance> = {
  Draft: {
    status: "Your application is a saved draft and has not been submitted.",
    next: "Nothing is sent until you submit. Your draft is preserved.",
    action: "Resume your draft, attach your CV, and submit when ready.",
    actionRequired: true,
  },
  New: {
    status: "We have received your application.",
    next: "The Jalanin team will begin reviewing it shortly.",
    action: "No action required. Keep your contact details up to date.",
    actionRequired: false,
  },
  "In Review": {
    status: "Your application is being reviewed.",
    next: "The Jalanin team will contact you when there is an update.",
    action: "No action required.",
    actionRequired: false,
  },
  "Quotation Sent": {
    status: "Your quotation has been queued for email delivery.",
    next: "The quotation email carries the SGD amount, terms, and reply instructions. This status means it was queued — not necessarily delivered.",
    action: "Check your email (including spam). To accept or decline, reply to the quotation email.",
    actionRequired: true,
  },
  Accepted: {
    status: "Your application has been accepted.",
    next: "The Jalanin team will contact you about preparation and placement steps.",
    action: "No action required. Watch your email for next steps.",
    actionRequired: false,
  },
  Rejected: {
    status: "This application is not moving forward.",
    next: "You can contact us if you would like feedback or to hear about alternatives.",
    action: "No action required.",
    actionRequired: false,
  },
  Completed: {
    status: "Your internship journey is marked complete.",
    next: "Thank you for travelling with Jalanin.",
    action: "No action required.",
    actionRequired: false,
  },
};

/** Guidance for a submitted application's lifecycle status. */
export function statusGuidanceFor(status: string): StatusGuidance {
  const known = (GUIDANCE as Record<string, StatusGuidance>)[status];
  if (known) return known;
  return {
    status: `Your application is in status “${status}”.`,
    next: "The Jalanin team will contact you when there is an update.",
    action: "No action required.",
    actionRequired: false,
  };
}

/**
 * Re-review overlay: the student edited a submitted application and the team
 * still needs to review the changes. The pending step is admin review — never
 * presented as a student action.
 */
export const RE_REVIEW_GUIDANCE: StatusGuidance = {
  status: "You updated your submitted application.",
  next: "The Jalanin team needs to review your changes before the application can progress.",
  action: "No action required. Your changes are saved and waiting for review.",
  actionRequired: false,
};
