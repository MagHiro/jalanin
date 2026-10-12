import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require";
import {
  allowedTransitionsFor,
  getAdminApplication,
} from "@/features/admin/service";
import { formatSgd, type ApplicationStatus } from "@/lib/workflow/transitions";
import { statusBadgeClass } from "@/components/ui/cn";
import { TransitionControls } from "@/components/admin/transition-controls";
import { ReopenControl } from "@/components/admin/reopen-control";

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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/applications" className="text-sm text-emerald-700 hover:underline">← All applications</Link>
        <h1 className="mt-1 text-2xl font-bold">
          {application.firstName} {application.lastName}
        </h1>
        <p className="text-sm text-slate-600">
          {application.email} · {internship.title} · r{application.revision}
          {application.reviewedRevision < application.revision && ` (reviewed r${application.reviewedRevision})`}
        </p>
        <p className="mt-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(application.lifecycleStatus)}`}>
            {application.isDraft ? "Draft (not submitted)" : application.lifecycleStatus}
          </span>
          {application.needsReReview && (
            <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900">
              Updated — re-review required
            </span>
          )}
        </p>
      </div>

      <section className="rounded-xl border p-5 text-sm">
        <h2 className="font-semibold">Submitted snapshot</h2>
        <dl className="mt-2 grid gap-1 md:grid-cols-2">
          {[["Nationality", application.nationality],
            ["University", application.university],
            ["Course", application.course],
            ["Graduation year", String(application.graduationYear)],
            ["Preferred dates", `${application.preferredStart} → ${application.preferredEnd}`],
            ["Submitted", application.submittedAt ? new Date(application.submittedAt).toLocaleString("en-SG") : "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b py-1">
              <dt className="text-slate-500">{k}</dt><dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {application.additionalInformation && (
          <p className="mt-2 whitespace-pre-line">{application.additionalInformation}</p>
        )}
      </section>

      <section className="rounded-xl border p-5 text-sm">
        <h2 className="font-semibold">Documents (private — admin only)</h2>
        {documents.length === 0 ? (
          <p className="mt-1 text-slate-500">No CV attached.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {documents.map((d) => (
              <li key={d.id}>
                <a
                  href={`/api/documents/download?documentId=${d.id}`}
                  className="font-medium text-emerald-700 hover:underline"
                >
                  Download {d.originalFilename}
                </a>
                <span className="ml-2 text-xs text-slate-500">
                  {(d.byteSize / 1024).toFixed(0)} KB · {new Date(d.createdAt).toLocaleDateString("en-SG")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {quotes.length > 0 && (
        <section className="rounded-xl border p-5 text-sm">
          <h2 className="font-semibold">Quotations (SGD)</h2>
          <ul className="mt-2 space-y-2">
            {quotes.map((q) => (
              <li key={q.id} className="rounded-lg bg-slate-50 p-3">
                <p className="font-bold">{formatSgd(q.amountMinor)} {q.currency} <span className="font-normal text-slate-500">· revision {q.revision}</span></p>
                <p className="mt-1"><span className="font-medium">Student terms:</span> {q.notesStudent}</p>
                {q.notesInternal && <p className="mt-1 text-slate-600"><span className="font-medium">Internal (never emailed):</span> {q.notesInternal}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {revisions.length > 0 && (
        <section className="rounded-xl border border-amber-300 p-5 text-sm">
          <h2 className="font-semibold">Student revision history (auditable)</h2>
          <ul className="mt-2 space-y-2">
            {revisions.map((r) => (
              <li key={r.id} className="rounded-lg bg-amber-50 p-3">
                <p className="font-medium">Revision r{r.revision} · {new Date(r.createdAt).toLocaleString("en-SG")}</p>
                <p className="text-xs text-slate-600">Changed: {r.changedFields.join(", ")}</p>
                <details className="mt-1 text-xs">
                  <summary className="cursor-pointer text-emerald-700">Old → new values</summary>
                  <pre className="mt-1 overflow-auto rounded bg-white p-2">{JSON.stringify({ old: r.oldValues, new: r.newValues }, null, 2)}</pre>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border p-5">
        <h2 className="font-semibold">Workflow actions</h2>
        <div className="mt-3">
          {application.isDraft ? (
            <p className="text-sm text-slate-500">Drafts cannot transition until the student submits.</p>
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

      <section className="rounded-xl border p-5 text-sm">
        <h2 className="font-semibold">Audit & status history</h2>
        <ol className="mt-2 space-y-1">
          {events.map((e) => (
            <li key={e.id} className="flex justify-between gap-3 border-b py-1">
              <span>{e.fromStatus ? `${e.fromStatus} → ` : ""}<strong>{e.toStatus}</strong>{e.reason ? ` — ${e.reason}` : ""}</span>
              <span className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleString("en-SG")}</span>
            </li>
          ))}
          {events.length === 0 && <li className="text-slate-500">No events yet.</li>}
        </ol>
      </section>
    </div>
  );
}
