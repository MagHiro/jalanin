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
import { FileText, GraduationCap, CalendarDays, ArrowDownToLine } from "lucide-react";
import { ApplicationReviewMotion } from "@/components/motion/application-review-motion";
import "./review.css";

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
  const reachedStatuses = new Set(events.flatMap((event) =>
    event.fromStatus ? [event.fromStatus, event.toStatus] : [event.toStatus],
  ));

  return (
    <ApplicationReviewMotion revision={application.revision} status={application.lifecycleStatus}>
      <header className="application-review-header">
        <nav aria-label="Breadcrumb">
          <Link href="/admin/applications" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
            <span aria-hidden="true">←</span> All applications
          </Link>
        </nav>
        <div className="application-review-identity">
        <span className="application-review-avatar" aria-hidden="true">{application.firstName?.[0]}{application.lastName?.[0]}</span>
        <div className="min-w-0">
        <p className="eyebrow">Application review · Revision {application.revision}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          {application.firstName} {application.lastName}
        </h1>
        <p className="tnum mt-1 text-sm text-muted-foreground">
          {application.email} · {internship.title}
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
        </div>
        </div>
        {/* Lifecycle chain (incident.io-informed status chain, DL-04) */}
        {!application.isDraft && (
          <ol aria-label="Application lifecycle" className="mt-3 flex flex-wrap items-center gap-1 text-xs">
            {APPLICATION_STATUSES.map((s) => {
               const reached = reachedStatuses.has(s);
               const current = s === application.lifecycleStatus;
              return (
                <li key={s} className="flex items-center gap-1">
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
      </header>

      <div className="application-review-grid">
        <div className="min-w-0 space-y-5">
          <div className="application-review-highlights">
            <div><GraduationCap size={20} aria-hidden="true" /><span>Education<strong>{application.university}</strong><small>{application.course} · Class of {application.graduationYear}</small></span></div>
            <div><CalendarDays size={20} aria-hidden="true" /><span>Preferred availability<strong>{application.preferredStart}</strong><small>to {application.preferredEnd}</small></span></div>
          </div>
          <section aria-labelledby="snapshot-h" className="surface-card p-5 md:p-6">
            <div className="application-review-section-title"><h2 id="snapshot-h">Submitted snapshot</h2><span>Revision {application.revision}</span></div>
            <dl className="mt-3 grid gap-x-8 text-sm md:grid-cols-2">
              {[["Nationality", application.nationality],
                ["University", application.university],
                ["Course", application.course],
                ["Graduation year", String(application.graduationYear)],
                ["Preferred dates", `${application.preferredStart} → ${application.preferredEnd}`],
                ["Submitted", application.submittedAt ? new Date(application.submittedAt).toLocaleString("en-SG") : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex min-w-0 flex-wrap justify-between gap-x-4 gap-y-1 border-b border-border py-2">
                  <dt className="text-muted-foreground">{k}</dt><dd className="min-w-0 max-w-full font-medium text-foreground sm:text-right">{v}</dd>
                </div>
              ))}
            </dl>
            {application.additionalInformation && (
              <div className="application-review-note"><h3>Student note</h3><p className="whitespace-pre-line">{application.additionalInformation}</p></div>
            )}
          </section>

          <section aria-labelledby="docs-h" className="surface-card p-5 md:p-6">
            <div className="application-review-section-title"><h2 id="docs-h">Documents</h2><span>Private · Admin only</span></div>
            {documents.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No CV attached.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {documents.map((d) => (
                  <li key={d.id} className="application-review-document">
                    <span className="application-review-file-icon"><FileText size={22} aria-hidden="true" /></span>
                    <span className="application-review-file-name">{d.originalFilename}
                      <span className="tnum ml-2 text-xs font-normal text-muted-foreground">
                        {(d.byteSize / 1024).toFixed(0)} KB · {new Date(d.createdAt).toLocaleDateString("en-SG")}
                      </span>
                    </span>
                    <a
                      href={`/api/documents/download?documentId=${d.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      <ArrowDownToLine size={16} aria-hidden="true" /> Download
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
            <div className="application-review-section-title"><h2 id="audit-h">Audit & status history</h2><span>{events.length} {events.length === 1 ? "event" : "events"}</span></div>
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

        <aside className="application-review-actions min-w-0 space-y-5" aria-label="Review controls and internship">
          <section aria-labelledby="actions-h" className="surface-card h-fit p-5 md:p-6">
            <h2 id="actions-h" className="text-base font-semibold tracking-tight text-foreground">Workflow actions</h2>
            <p className="application-review-action-hint">Current status: <strong>{application.isDraft ? "Draft" : application.lifecycleStatus}</strong>. Changes are recorded in the audit history.</p>
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
            <p className="application-context-location">{internship.city}, {internship.countryCode}</p>
            <dl className="application-context-dates">
              <div><dt>Starts</dt><dd><time dateTime={internship.startDate}>{new Date(`${internship.startDate}T00:00:00Z`).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time></dd></div>
              <div><dt>Ends</dt><dd><time dateTime={internship.endDate}>{new Date(`${internship.endDate}T00:00:00Z`).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time></dd></div>
            </dl>
            <Link href={`/opportunities/${internship.slug}`} className="mt-2 inline-flex min-h-9 items-center text-xs font-semibold text-primary hover:underline">
              View public listing →
            </Link>
          </section>
        </aside>
      </div>
    </ApplicationReviewMotion>
  );
}
