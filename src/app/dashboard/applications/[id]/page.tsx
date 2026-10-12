import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/require";
import { getApplicationForStudent } from "@/features/applications/service";
import { statusBadgeClass } from "@/components/ui/cn";

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
        <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-800">Application submitted.</p>
          <p className="text-sm text-emerald-900">Our team will review it and contact you. You can track the status here.</p>
        </div>
      )}
      <div>
        <Link href="/dashboard/applications" className="text-sm text-emerald-700 hover:underline">← All applications</Link>
        <h1 className="mt-1 text-2xl font-bold">{internship.title}</h1>
        <p className="mt-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(application.isDraft ? "Draft" : application.lifecycleStatus)}`}>
            {application.isDraft ? "Draft" : application.lifecycleStatus}
          </span>
          {application.needsReReview && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
              Updated — awaiting admin re-review
            </span>
          )}
        </p>
      </div>

      <section className="rounded-xl border p-5 text-sm">
        <h2 className="font-semibold">Your submission</h2>
        <dl className="mt-2 grid gap-1 md:grid-cols-2">
          {[["Name", `${application.firstName} ${application.lastName}`],
            ["Email", application.email],
            ["Nationality", application.nationality],
            ["University", application.university],
            ["Course", application.course],
            ["Graduation year", String(application.graduationYear)],
            ["Preferred dates", `${application.preferredStart} → ${application.preferredEnd}`],
            ["Revision", `r${application.revision}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b py-1">
              <dt className="text-slate-500">{k}</dt><dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {application.additionalInformation && (
          <p className="mt-2 whitespace-pre-line text-slate-700">{application.additionalInformation}</p>
        )}
        <div className="mt-3">
          {application.isDraft ? (
            <Link href={`/apply/${application.internshipId}`} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">Resume draft</Link>
          ) : editable ? (
            <Link href={`/apply/${application.internshipId}`} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">Edit application</Link>
          ) : (
            <p className="text-xs text-slate-500">Editing is locked from Quotation Sent onwards. Contact us if you need changes.</p>
          )}
        </div>
      </section>

      {!application.isDraft && (
        <section className="rounded-xl border p-5">
          <h2 className="font-semibold">Status timeline</h2>
          <ol className="mt-2 space-y-1 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 border-b py-1">
                <span>{e.fromStatus ? `${e.fromStatus} → ` : ""}<strong>{e.toStatus}</strong></span>
                <span className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleString("en-SG")}</span>
              </li>
            ))}
            {events.length === 0 && <li className="text-sm text-slate-500">Submitted — awaiting review.</li>}
          </ol>
          {revisions.length > 0 && (
            <>
              <h3 className="mt-4 font-semibold">Your change history</h3>
              <ul className="mt-1 space-y-1 text-sm text-slate-600">
                {revisions.map((r) => (
                  <li key={r.id}>Revision r{r.revision}: changed {r.changedFields.join(", ")} · {new Date(r.createdAt).toLocaleString("en-SG")}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
