import {
  RE_REVIEW_GUIDANCE,
  statusGuidanceFor,
} from "@/lib/workflow/status-guidance";

/**
 * Contextual status guidance panel (S1). Brief, factual explanation of the
 * current lifecycle status: what it means, what happens next, and whether
 * the student must act. Server component — no new client state.
 */
export function ApplicationStatusGuidance({
  status,
  isDraft,
  needsReReview,
}: {
  status: string;
  isDraft: boolean;
  needsReReview: boolean;
}) {
  const guidance = isDraft
    ? statusGuidanceFor("Draft")
    : needsReReview
      ? RE_REVIEW_GUIDANCE
      : statusGuidanceFor(status);
  return (
    <section
      aria-labelledby="status-guidance-h"
      className="surface-card status-guidance p-5 md:p-6"
    >
      <p className="eyebrow">What this means</p>
      <h2 id="status-guidance-h" className="text-base font-semibold tracking-tight text-foreground">
        {isDraft ? "Draft — not submitted" : needsReReview ? "Updated — awaiting re-review" : status}
      </h2>
      <dl className="mt-3 space-y-2.5 text-sm leading-6">
        <div>
          <dt className="font-semibold text-foreground">Status</dt>
          <dd className="text-muted-foreground">{guidance.status}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Next step</dt>
          <dd className="text-muted-foreground">{guidance.next}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Your action</dt>
          <dd className="text-muted-foreground">
            {guidance.actionRequired ? (
              <strong className="font-semibold text-foreground">{guidance.action}</strong>
            ) : (
              guidance.action
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
