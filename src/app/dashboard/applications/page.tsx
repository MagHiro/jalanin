import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/require";
import { listStudentApplications } from "@/features/applications/service";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "My applications" };

export default async function StudentApplicationsPage({
  searchParams,
}: {
  searchParams: { draft?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard/applications");
  const apps = await listStudentApplications(user.id);
  const drafts = apps.filter((a) => a.application.isDraft);
  const submitted = apps.filter((a) => !a.application.isDraft);

  return (
    <div className="space-y-6">
      {searchParams.draft && (
        <div role="status" className="alert alert-success">
          <b>Draft saved.</b> Resume it any time — nothing is sent until you submit.
        </div>
      )}
      <PageHeader
        icon="☰"
        eyebrow="Your history"
        title="My applications"
        description={`${submitted.length} submitted · ${drafts.length} draft${drafts.length === 1 ? "" : "s"}`}
      />
      {apps.length === 0 ? (
        <EmptyState
          icon="☰"
          title="Nothing here yet."
          body="Browse internships and start an application — your progress saves as a draft."
          actionHref="/opportunities"
          actionLabel="Browse internships"
        />
      ) : (
        <div className="space-y-6">
          {drafts.length > 0 && (
            <section aria-labelledby="drafts-h">
              <h2 id="drafts-h" className="text-sm font-semibold uppercase tracking-[.12em] text-muted-foreground">
                Drafts ({drafts.length})
              </h2>
              <ul className="mt-2 space-y-2">
                {drafts.map(({ application, internshipTitle, internshipCity, internshipCountry }) => (
                  <li key={application.id} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 md:p-5">
                    <div>
                      <p className="font-semibold text-foreground">{internshipTitle}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{internshipCity}, {internshipCountry} · draft, not submitted</p>
                    </div>
                    <Link href={`/apply/${application.internshipId}`} className="btn btn-outline btn-sm">
                      Resume draft
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="submitted-h">
            <h2 id="submitted-h" className="text-sm font-semibold uppercase tracking-[.12em] text-muted-foreground">
              Submitted ({submitted.length})
            </h2>
            {submitted.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No submitted applications yet — drafts appear above.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {submitted.map(({ application, internshipTitle, internshipCity, internshipCountry, internshipSlug }) => (
                  <li key={application.id} className="surface-card surface-card-hover flex flex-wrap items-center justify-between gap-4 p-4 md:p-5">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{internshipTitle}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {internshipCity}, {internshipCountry} ·
                        {` submitted ${application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("en-SG") : ""}`}
                      </p>
                      <p className="mt-2 flex flex-wrap gap-1.5">
                        <StatusBadge status={application.lifecycleStatus} />
                        {application.needsReReview && (
                          <span className="badge badge-rereview">
                            <span aria-hidden="true" className="badge-dot" />
                            Updated — re-review required
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 text-sm">
                      <Link href={`/dashboard/applications/${application.id}`} className="btn btn-outline btn-sm">Details</Link>
                      <Link href={`/opportunities/${internshipSlug}`} className="btn btn-ghost btn-sm">Listing</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
