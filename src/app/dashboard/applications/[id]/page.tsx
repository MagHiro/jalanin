import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/require";
import { getApplicationForStudent } from "@/features/applications/service";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusTimeline } from "@/components/ui/status-timeline";

// Student application detail: own record only (IDOR-safe: service returns
// null for other students' ids → 404, never a leak).
export default async function StudentApplicationDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { submitted?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect(`/auth/login?next=/dashboard/applications/${params.id}`);
  const data = await getApplicationForStudent(user.id, params.id);
  if (!data) notFound();
  const { application, internship, revisions, events } = data;
  const editable =
    !application.isDraft &&
    ["New", "In Review"].includes(application.lifecycleStatus);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {searchParams.submitted && (
        <div role="status" className="alert alert-success">
          <p className="font-semibold">Application submitted.</p>
          <p className="mt-0.5 text-sm">Our team will review it and contact you. You can track the status here.</p>
        </div>
      )}
      <div>
        <nav aria-label="Breadcrumb">
          <Link href="/dashboard/applications" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
            <span aria-hidden="true">←</span> All applications
          </Link>
        </nav>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{internship.title}</h1>
        <p className="mt-2 flex flex-wrap gap-1.5">
          <StatusBadge status={application.isDraft ? "Draft" : application.lifecycleStatus} />
          {application.needsReReview && (
            <span className="badge badge-rereview">
              <span aria-hidden="true" className="badge-dot" />
              Updated — awaiting admin re-review
            </span>
          )}
        </p>
      </div>

      <section aria-labelledby="submission-h" className="surface-card p-5 md:p-6">
        <h2 id="submission-h" className="text-base font-semibold tracking-tight text-foreground">Your submission</h2>
        <dl className="mt-3 text-sm">
          {[["Name", `${application.firstName} ${application.lastName}`],
            ["Email", application.email],
            ["Nationality", application.nationality],
            ["University", application.university],
            ["Course", application.course],
            ["Graduation year", String(application.graduationYear)],
            ["Preferred dates", `${application.preferredStart} → ${application.preferredEnd}`],
            ["Revision", `r${application.revision}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
              <dt className="shrink-0 text-muted-foreground">{k}</dt><dd className="text-right font-medium text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        {application.additionalInformation && (
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{application.additionalInformation}</p>
        )}
        <div className="mt-4">
          {application.isDraft ? (
            <Link href={`/apply/${application.internshipId}`} className="btn btn-outline btn-sm">Resume draft</Link>
          ) : editable ? (
            <Link href={`/apply/${application.internshipId}`} className="btn btn-outline btn-sm">Edit application</Link>
          ) : (
            <p className="rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">
              Editing is locked from Quotation Sent onwards. Your quotation will
              arrive by email — reply there to accept or decline. Contact us if
              you need changes.
            </p>
          )}
        </div>
      </section>

      {!application.isDraft && (
        <>
          <section aria-labelledby="timeline-h" className="surface-card p-5 md:p-6">
            <h2 id="timeline-h" className="text-base font-semibold tracking-tight text-foreground">Status timeline</h2>
            <div className="mt-4">
              <StatusTimeline
                events={events.map((e) => ({
                  id: e.id,
                  fromStatus: e.fromStatus,
                  toStatus: e.toStatus,
                  reason: e.reason,
                  createdAt: e.createdAt,
                }))}
              />
            </div>
            {revisions.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-foreground">Your change history</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {revisions.map((r) => (
                    <li key={r.id}>Revision r{r.revision}: changed {r.changedFields.join(", ")} · {new Date(r.createdAt).toLocaleString("en-SG")}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby="quote-h" className="quote-panel p-5 text-sm leading-6 text-muted-foreground md:p-6">
            <h2 id="quote-h" className="text-sm font-semibold text-foreground">About your quotation</h2>
            <p className="mt-1.5">
              {application.lifecycleStatus === "Quotation Sent" || application.lifecycleStatus === "Accepted"
                ? "Your quotation was sent by email with the amount in SGD and the reply instructions. This dashboard shows the status only — the email is authoritative."
                : "When our team prepares your custom quotation, it arrives by email with the SGD amount and reply instructions. No expiry is claimed here — if terms mention timing, they are in the email."}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
