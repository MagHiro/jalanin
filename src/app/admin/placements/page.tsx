import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { listAdminPlacements } from "@/features/admin/service";
import { statusBadgeClass } from "@/components/ui/cn";

export const metadata = { title: "Placements", robots: "noindex" };
export const dynamic = "force-dynamic";

export default async function AdminPlacementsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  await requireAdmin();
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const { rows, total } = await listAdminPlacements({
    q: searchParams.q,
    status: searchParams.status,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Placements ({total})</h1>
        <Link href="/admin/placements/new" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          New placement
        </Link>
      </div>
      <form method="get" className="flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search organization or role" className="rounded border px-3 py-1.5" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="rounded border px-3 py-1.5">
          <option value="">All statuses</option>
          {["Preparing", "Confirmed", "Active", "Completed", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="rounded border px-3 py-1.5 hover:bg-slate-50">Filter</button>
      </form>
      <ul className="space-y-2">
        {rows.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
            <div>
              <p className="font-semibold">{p.role} · {p.organization}</p>
              <p className="mt-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.placementStatus)}`}>{p.placementStatus}</span>
              </p>
            </div>
            <Link href={`/admin/placements/${p.id}/edit`} className="rounded-lg border px-3 py-1.5 font-medium hover:bg-slate-50">Manage</Link>
          </li>
        ))}
        {rows.length === 0 && <li className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">No placements found.</li>}
      </ul>
    </div>
  );
}
