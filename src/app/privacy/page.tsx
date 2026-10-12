import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Jalanin handles personal data for internship applications.",
};

// DRAFT legal copy (B07 release blocker). Replaced with owner-approved copy
// before any personal-data workflow goes live; policy version bumped then.
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <div role="note" className="alert alert-warning">
        Draft — pending legal approval (B07). Consent records reference policy
        version <code>draft-0.1</code> until final copy is published.
      </div>
      <p className="eyebrow mt-8">Legal</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">Privacy policy (draft)</h1>
      <div className="mt-6 space-y-4 text-base leading-7 text-muted-foreground">
        <p>
          Jalanin collects the personal details you provide in internship
          applications (identity, education, availability, CV) to review your
          application, prepare quotations, and arrange placements.
        </p>
        <p>
          CVs and application documents are stored privately and are accessible
          only to authorized Jalanin administrators. We never sell personal data.
        </p>
        <p>
          Contact us to request access, correction, or deletion of your data.
          Retention periods and jurisdiction-specific disclosures will be
          confirmed in the final policy.
        </p>
      </div>
    </article>
  );
}
