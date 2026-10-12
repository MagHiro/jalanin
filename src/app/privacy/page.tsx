import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Jalanin handles personal data for internship applications.",
};

// DRAFT legal copy (B07 release blocker). Replaced with owner-approved copy
// before any personal-data workflow goes live; policy version bumped then.
export default function PrivacyPage() {
  return (
    <article className="prose mx-auto max-w-3xl">
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm not-prose">
        Draft — pending legal approval (B07). Consent records reference policy
        version <code>draft-0.1</code> until final copy is published.
      </p>
      <h1>Privacy policy (draft)</h1>
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
    </article>
  );
}
