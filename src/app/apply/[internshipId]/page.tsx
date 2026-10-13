import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { applications, internships } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/require";
import { ApplicationForm } from "@/components/applications/application-form";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Apply" };

// New or resumed application for one internship (APP-*). Unauthenticated
// visitors are bounced to login with ?next= back to this page (AUTH-04).
export default async function ApplyPage({
  params,
}: {
  params: { internshipId: string };
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/apply/${params.internshipId}`)}`);
  }

  const listing = await db
    .select()
    .from(internships)
    .where(eq(internships.id, params.internshipId))
    .limit(1);
  if (listing.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Internship not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/opportunities" className="font-medium text-primary hover:underline">Back to all internships</Link>
        </p>
      </div>
    );
  }
  const internship = listing[0];
  if (internship.publicationStatus !== "Published") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{internship.title}</h1>
        <div role="note" className="alert alert-warning">
          This internship is not currently accepting applications. Your existing
          draft (if any) is preserved — please contact us for guidance.
        </div>
        <Link href="/opportunities" className="btn btn-outline">Back to all internships</Link>
      </div>
    );
  }

  const existing = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.applicantUserId, user.id),
        eq(applications.internshipId, internship.id),
      ),
    )
    .limit(1);

  const state = existing[0]
    ? existing[0].isDraft
      ? "Resume your saved draft below — nothing is sent until you submit."
      : `You have a ${existing[0].lifecycleStatus} application. Edits are allowed before a quotation is sent and will require admin re-review.`
    : "Your progress saves as a draft. Nothing is sent until you submit.";

  return (
    <div className="learn-application mx-auto max-w-3xl space-y-6">
      <div className="learn-application-heading">
        <Link href={`/opportunities/${internship.slug}`} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} aria-hidden="true" /> Back to {internship.title}
        </Link>
        <PageHeader
          eyebrow={internship.city}
          title={`Apply: ${internship.title}`}
          description={state}
        />
      </div>
      <ApplicationForm internshipId={internship.id} existing={existing[0] ? { ...existing[0] } : null} />
    </div>
  );
}

export const dynamic = "force-dynamic";
