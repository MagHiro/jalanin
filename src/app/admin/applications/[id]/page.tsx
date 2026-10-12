import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require";
import {
  allowedTransitionsFor,
  getAdminApplication,
} from "@/features/admin/service";
import { APPLICATION_STATUSES, formatSgd, type ApplicationStatus } from "@/lib/workflow/transitions";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusTimeline } from "@/components/ui/status-timeline";
import { TransitionControls } from "@/components/admin/transition-controls";
import { ReopenControl } from "@/components/admin/reopen-control";
import { cn } from "@/components/ui/cn";

export const metadata = { title: "Review application", robots: "noindex" };
export const dynamic = "force-dynamic";

// Full review surface (ADM-APP-03…13): snapshot, internship context, private
// CV (signed admin download), audit/revision history, state-aware actions.
export default async function AdminApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const data = await getAdminApplication(params.id);
  if (!data) notFound();
  const { application, internship, revisions, documents, events, quotes } = data;
  const allowed = application.isDraft
    ? []
    : allowedTransitionsFor(application.lifecycleStatus as ApplicationStatus);
  const chainIndex = application.isDraft
    ? -1
    : APPLICATION_STATUSES.indexOf(application.lifecycleStatus as ApplicationStatus);

  return (
    <div className="space-y-6">
      <div>
        <nav aria-label="Breadcrumb">
          <Link href="/admin/applications" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
            <span aria-hidden="true">←</span> All applications
          </Link>
        </nav>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          {application.firstName} {application.lastName}
        </h1>
        <p className="tnum mt-1 text-sm text-muted-foreground">
          {application.email} · {internship.title} · r{application.revision}
          {application.reviewedRevision < application.revision && ` (reviewed r${application.reviewedRevision})`}
        </p>
        <p className="mt-2 flex flex-wrap gap-1.5">
          <StatusBadge status={application.isDraft ? "Draft (not submitted)" : application.lifecycleStatus} />
          {application.needsReReview && (
            <span className="badge badge-rereview">
              <span aria-hidden="true" className="badge-dot" />
              Updated — re-review required
            </span>
          )}
        </p>
        {/* Lifecycle chain (incident.io-informed status chain, DL-04) */}
        {!application.isDraft && (
          <ol aria-label="Application lifecycle" className="mt-3 flex flex-wrap items-center gap-1 text-xs">
            {APPLICATION_STATUSES.map((s, i) => {
              const reached = i <= chainIndex;
              const current = i === chainIndex;
              return (
                <li key={s} className="flex items-center gap-1">
                  {i > 0 && <span aria-hidden="true" className="text-muted-foreground">›</span>}
                  <span
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "rounded-full px-2.5 py-1 font-semibold",
                      current
                        ? "bg-primary text-white"
                        : reached
                          ? "bg-secondary text-primary"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {s}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <section aria-labelledby="snapshot-h" className="surface-card p-5 md:p-6">
            <h2 id="snapshot-h" className="text-base font-semibold tracking-tight text-foreground">Submitted snapshot</h2>
            <dl className="mt-3 grid gap-x-8 text-sm md:grid-cols-2">
              {[["Nationality", application.nationality],
                ["University", application.university],
                ["Course", application.course],
                ["Graduation year", String(application.graduationYear)],
                ["Preferred dates", `${application.preferredStart} → ${application.preferredEnd}`],
                ["Submitted", application.submittedAt ? new Date(application.submittedAt).toLocaleString("en-SG") : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-border py-2">
                  <dt className="shrink-0 text-muted-foreground">{k}</dt><dd className="text-right font-medium text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            {application.additionalInformation && (
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{application.additionalInformation}</p>
            )}
          </section>

          <section aria-labelledby="docs-h" className="surface-card p-5 md:p-6">
            <h2 id="docs-h" className="text-base font-semibold tracking-tight text-foreground">Documents <span className="ml-1 text-xs font-normal text-muted-foreground">(private — admin only)</span></h2>
            {documents.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No CV attached.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {documents.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
                    <span className="font-medium text-foreground">{d.originalFilename}
                      <span className="tnum ml-2 text-xs font-normal text-muted-foreground">
                        {(d.byteSize / 1024).toFixed(0)} KB · {new Date(d.createdAt).toLocaleDateString("en-SG")}
                      </span>
                    </span>
                    <a
                      href={`/api/documents/download?documentId=${d.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {quotes.length > 0 && (
            <section aria-labelledby="quotes-h" className="surface-card p-5 md:p-6">
              <h2 id="quotes-h" className="text-base font-semibold tracking-tight text-foreground">Quotations (SGD)</h2>
              <ul className="mt-3 space-y-2">
                {quotes.map((q) => (
                  <li key={q.id} className="rounded-xl bg-muted p-4 text-sm">
                    <p className="tnum font-bold text-foreground">{formatSgd(q.amountMinor)} {q.currency} <span className="font-normal text-muted-foreground">· revision {q.revision}</span></p>
                    <p className="mt-1.5"><span className="font-medium text-foreground">Student terms:</span> <span className="text-muted-foreground">{q.notesStudent}</span></p>
                    {q.notesInternal && <p className="mt-1 text-muted-foreground"><span className="font-medium text-foreground">Internal (never emailed):</span> {q.notesInternal}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {revisions.length > 0 && (
            <section aria-labelledby="revisions-h" className="revisions-panel p-5 md:p-6">
              <h2 id="revisions-h" className="text-base font-semibold tracking-tight text-foreground">Student revision history <span className="text-xs font-normal text-muted-foreground">(auditable)</span></h2>
              <ul className="mt-3 space-y-2">
                {revisions.map((r) => (
                  <li key={r.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                    <p className="tnum font-medium text-foreground">Revision r{r.revision} · {new Date(r.createdAt).toLocaleString("en-SG")}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Changed: {r.changedFields.join(", ")}</p>
                    <details className="mt-1.5 text-xs">
                      <summary className="cursor-pointer font-medium text-primary">Old → new values</summary>
                      <pre className="tnum mt-1.5 overflow-auto rounded-lg bg-muted p-2.5 text-[11px] leading-5">{JSON.stringify({ old: r.oldValues, new: r.newValues }, null, 2)}</pre>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="audit-h" className="surface-card p-5 md:p-6">
            <h2 id="audit-h" className="text-base font-semibold tracking-tight text-foreground">Audit & status history</h2>
            <div className="mt-4">
              <StatusTimeline
                events={events.map((e) => ({
                  id: e.id,
                  fromStatus: e.fromStatus,
                  toStatus: e.toStatus,
                  reason: e.reason,
                  createdAt: e.createdAt,
                }))}
                emptyLabel="No events yet."
              />
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section aria-labelledby="actions-h" className="surface-card h-fit p-5 md:p-6 xl:sticky xl:top-28">
            <h2 id="actions-h" className="text-base font-semibold tracking-tight text-foreground">Workflow actions</h2>
            <div className="mt-3">
              {application.isDraft ? (
                <p className="text-sm text-muted-foreground">Drafts cannot transition until the student submits.</p>
              ) : application.lifecycleStatus === "Rejected" ? (
                <ReopenControl applicationId={application.id} />
              ) : (
                <TransitionControls
                  applicationId={application.id}
                  currentStatus={application.lifecycleStatus}
                  allowed={allowed}
                  revision={application.revision}
                />
              )}
            </div>
          </section>

          <section aria-labelledby="context-h" className="rounded-2xl border border-border bg-muted p-5 text-sm">
            <h2 id="context-h" className="font-semibold text-foreground">Internship context</h2>
            <p className="mt-1.5 font-medium text-foreground">{internship.title}</p>
            <p className="tnum text-xs text-muted-foreground">{internship.city}, {internship.countryCode} · {internship.startDate} → {internship.endDate}</p>
            <Link href={`/opportunities/${internship.slug}`} className="mt-2 inline-flex min-h-9 items-center text-xs font-semibold text-primary hover:underline">
              View public listing →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
