import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Terms for using the Jalanin internship platform.",
};

// DRAFT legal copy (B07 release blocker) — see privacy page note.
export default function TermsPage() {
  return (
    <article className="prose mx-auto max-w-3xl">
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm not-prose">
        Draft — pending legal approval (B07). Consent records reference policy
        version <code>draft-0.1</code> until final copy is published.
      </p>
      <h1>Terms of service (draft)</h1>
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
    </article>
  );
}
