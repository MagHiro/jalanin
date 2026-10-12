import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Terms for using the Jalanin internship platform.",
};

// DRAFT legal copy (B07 release blocker) — see privacy page note.
export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <div role="note" className="alert alert-warning">
        Draft — pending legal approval (B07). Consent records reference policy
        version <code>draft-0.1</code> until final copy is published.
      </div>
      <p className="eyebrow mt-8">Legal</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">Terms of service (draft)</h1>
      <div className="mt-6 space-y-4 text-base leading-7 text-muted-foreground">
        <p>
          By applying through Jalanin you confirm your details are accurate and
          you consent to our review and quotation process. Quotations are
          custom-prepared and communicated by email; replying to a quotation
          email is how you accept or decline.
        </p>
        <p>
          Online payment is not part of this platform. Any fees are governed by
          the quotation terms you receive by email.
        </p>
      </div>
    </article>
  );
}
