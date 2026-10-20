import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { applicationDocuments, applications, internships } from "@/lib/db/schema";
import { AuthError, requireStudent } from "@/lib/auth/require";
import { applicationRequestSchema } from "@/features/applications/request";
import { logServerError } from "@/lib/observability/logger";
import { ApplicationForm } from "@/components/applications/application-form";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft } from "lucide-react";
import "./application.css";

export const metadata = { title: "Apply" };

// New or resumed application for one internship (APP-*). Unauthenticated
// visitors are bounced to login with ?next= back to this page (AUTH-04).
export default async function ApplyPage({
  params,
}: {
  params: { internshipId: string };
}) {
  if (!applicationRequestSchema.shape.internshipId.safeParse(params.internshipId).success) notFound();
  const user = await requireStudent().catch((error: unknown) => {
    if (error instanceof AuthError && error.status === 401) {
      redirect(`/auth/login?next=${encodeURIComponent(`/apply/${params.internshipId}`)}`);
    }
    throw error;
  });

  const data = await (async () => {
    const existing = await db
      .select()
      .from(applications)
      .where(and(
        eq(applications.applicantUserId, user.id),
        eq(applications.internshipId, params.internshipId),
      ))
      .limit(1);
    const listing = await db
    .select()
    .from(internships)
    .where(and(
      eq(internships.id, params.internshipId),
      existing[0] ? undefined : eq(internships.publicationStatus, "Published"),
    ))
    .limit(1);
    // Owner-scoped CV metadata (filename + upload date only — never the
    // private storage path). Students cannot download CVs (B05 interim).
    const existingCv = existing[0]
      ? await db
        .select({
          originalFilename: applicationDocuments.originalFilename,
          byteSize: applicationDocuments.byteSize,
          createdAt: applicationDocuments.createdAt,
        })
        .from(applicationDocuments)
        .where(and(
          eq(applicationDocuments.applicationId, existing[0].id),
          eq(applicationDocuments.documentType, "cv"),
        ))
        .limit(1)
      : [];
    return { existing, listing, existingCv: (existingCv ?? [])[0] ?? null };
  })().catch(() => {
    const incidentId = logServerError("applications.apply.load.failed", null);
    return { incidentId };
  });
  if ("incidentId" in data) {
    return <div role="alert" className="alert alert-error">Could not load this application. Please try again. Reference: {data.incidentId}</div>;
  }
  const { existing, listing } = data;
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

  const state = existing[0]
    ? existing[0].isDraft
      ? "Resume your saved draft below — nothing is sent until you submit."
      : `Your application status is ${existing[0].lifecycleStatus}. Review your submitted details below; editing availability is shown with the form.`
    : "Save a draft to keep your progress. Nothing is sent until you submit.";

  return (
    <div className="learn-application application-page-calm">
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
      <ApplicationForm internshipId={internship.id} existing={existing[0] ? { ...existing[0] } : null} existingCv={data.existingCv ? { originalFilename: data.existingCv.originalFilename, byteSize: data.existingCv.byteSize, createdAt: data.existingCv.createdAt instanceof Date ? data.existingCv.createdAt.toISOString() : String(data.existingCv.createdAt) } : null} />
    </div>
  );
}

export const dynamic = "force-dynamic";
