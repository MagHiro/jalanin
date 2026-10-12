import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { listAdminApplications } from "@/features/admin/service";
import { statusBadgeClass } from "@/components/ui/cn";

export const metadata = { title: "Applications", robots: "noindex" };
export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; rereview?: string; page?: string };
}) {
  await requireAdmin();
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const pageSize = 20;
  const { rows, total } = await listAdminApplications({
    q: searchParams.q,
    status: searchParams.status,
    needsReReview: searchParams.rereview === "1" ? true : undefined,
    page,
    pageSize,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Applications ({total})</h1>
      <form method="get" className="flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search name, email, university" className="rounded border px-3 py-1.5" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="rounded border px-3 py-1.5">
          <option value="">All statuses</option>
          {["New", "In Review", "Quotation Sent", "Accepted", "Rejected", "Completed"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 rounded border px-3 py-1.5">
          <input type="checkbox" name="rereview" value="1" defaultChecked={searchParams.rereview === "1"} /> Re-review only
        </label>
        <button className="rounded border px-3 py-1.5 hover:bg-slate-50">Filter</button>
      </form>
      <ul className="space-y-2">
        {rows.map(({ application, internshipTitle }) => (
          <li key={application.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
            <div>
              <p className="font-semibold">
                {application.firstName} {application.lastName}
                <span className="font-normal text-slate-500"> · {application.email}</span>
              </p>
              <p className="text-xs text-slate-500">
                {internshipTitle} · submitted {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("en-SG") : "—"} · r{application.revision}
              </p>
              <p className="mt-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(application.lifecycleStatus)}`}>
                  {application.lifecycleStatus}
                </span>
                {application.needsReReview && (
                  <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900">
                    Updated — re-review required
                  </span>
                )}
              </p>
            </div>
            <Link href={`/admin/applications/${application.id}`} className="rounded-lg border px-3 py-1.5 font-medium hover:bg-slate-50">
              Review
            </Link>
          </li>
        ))}
        {rows.length === 0 && <li className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">No applications found.</li>}
      </ul>
      {total > pageSize && <p className="text-sm text-slate-600">Page {page} — {total} total.</p>}
    </div>
  );
}
