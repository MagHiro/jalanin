import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { listAdminPlacements } from "@/features/admin/service";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { WorkspaceSelect } from "@/components/ui/workspace-select";

export const metadata = { title: "Placements", robots: "noindex" };
export const dynamic = "force-dynamic";

const PLACEMENT_STATUSES = ["Preparing", "Confirmed", "Active", "Completed", "Cancelled"];

export default async function AdminPlacementsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  await requireAdmin();
  const rawPage = Number(searchParams.page ?? 1);
  const page = Number.isSafeInteger(rawPage) ? Math.max(1, Math.min(100000, rawPage)) : 1;
  const pageSize = 20;
  const { rows, total } = await listAdminPlacements({
    q: searchParams.q,
    status: searchParams.status,
    page,
    pageSize,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      <PageHeader
        icon="✦"
        eyebrow="Outcomes"
        title={`Placements (${total})`}
        description="Manually created and advanced. Only the linked student sees their record."
        actions={<Link href="/admin/placements/new" className="btn btn-primary btn-sm">+ New placement</Link>}
      />
      <form method="get" aria-label="Filter placements" className="toolbar grid gap-3 text-sm sm:grid-cols-[1.4fr_1fr_auto]">
        <label className="field-label">
          <span className="sr-only">Search organization or role</span>
          <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search organization or role" className="field !min-h-11" />
        </label>
        <label className="field-label">
          <span className="sr-only">Placement status</span>
          <WorkspaceSelect name="status" ariaLabel="Filter by placement status" defaultValue={searchParams.status ?? ""} options={[{ value: "", label: "All statuses" }, ...PLACEMENT_STATUSES.map(v => ({ value: v, label: v }))]} />
        </label>
        <div className="flex items-end">
          <button className="btn btn-primary btn-sm min-h-11">Filter</button>
        </div>
      </form>

      {rows.length > 0 ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {rows.map((p) => (
            <li key={p.id} className="surface-card surface-card-hover flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-foreground [overflow-wrap:anywhere]">{p.role} · {p.organization}</p>
                <p className="mt-1.5"><StatusBadge status={p.placementStatus} /></p>
              </div>
              <Link href={`/admin/placements/${p.id}/edit`} className="btn btn-outline btn-sm shrink-0">Manage</Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="✦" title="No placements found." body="Create placements manually for students — they will see their own records." actionHref="/admin/placements/new" actionLabel="New placement" />
      )}
      <Pagination page={page} totalPages={totalPages} pathname="/admin/placements" searchParams={searchParams} />
    </div>
  );
}
