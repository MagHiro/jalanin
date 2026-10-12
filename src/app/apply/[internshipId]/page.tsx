import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { applications, internships } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/require";
import { ApplicationForm } from "@/components/applications/application-form";
import { and, eq } from "drizzle-orm";
import Link from "next/link";

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
      <div>
        <h1 className="text-2xl font-bold">Internship not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          <Link href="/opportunities" className="text-emerald-700 hover:underline">Back to all internships</Link>
        </p>
      </div>
    );
  }
  const internship = listing[0];
  if (internship.publicationStatus !== "Published") {
    return (
      <div>
        <h1 className="text-2xl font-bold">{internship.title}</h1>
        <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          This internship is not currently accepting applications. Your existing
          draft (if any) is preserved — please contact us for guidance.
        </p>
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

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-slate-500">
        <Link href={`/opportunities/${internship.slug}`} className="text-emerald-700 hover:underline">← Back to {internship.title}</Link>
      </p>
      <h1 className="mt-1 text-3xl font-bold">Apply: {internship.title}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {existing.length > 0
          ? existing[0].isDraft
            ? "Resume your saved draft below — nothing is sent until you submit."
            : `You have a ${existing[0].lifecycleStatus} application. Edits are allowed before a quotation is sent and will require admin re-review.`
          : "Your progress saves as a draft. Nothing is sent until you submit."}
      </p>
      <div className="mt-6">
        <ApplicationForm internshipId={internship.id} existing={existing[0] ? { ...existing[0] } : null} />
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
