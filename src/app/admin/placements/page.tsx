import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { getAdminOverview, listAdminPlacements } from "@/features/admin/service";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { WorkspaceSelect } from "@/components/ui/workspace-select";
import { CrmViews, CrmFilterChips, CrmTableMeta, listHref } from "@/components/ui/crm-list";

export const metadata = { title: "Placements", robots: "noindex" };
export const dynamic = "force-dynamic";
const path = "/admin/placements";
const STATUSES = ["Preparing", "Confirmed", "Active", "Completed", "Cancelled"];

export default async function AdminPlacementsPage({ searchParams }: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  await requireAdmin();
  const rawPage = Number(searchParams.page ?? 1);
  const page = Number.isSafeInteger(rawPage) ? Math.max(1, Math.min(100000, rawPage)) : 1;
  const pageSize = 20;
  const [{ rows, total }, overview] = await Promise.all([listAdminPlacements({ q: searchParams.q, status: searchParams.status, page, pageSize }), getAdminOverview()]);
  const allPlacementsCount = Object.values(overview.placementCounts).reduce((sum, n) => sum + n, 0);
  const filters = [
    ...(searchParams.q ? [{ label: `Search: ${searchParams.q}`, href: listHref(path, searchParams, { q: null }) }] : []),
    ...(searchParams.status ? [{ label: `Status: ${searchParams.status}`, href: listHref(path, searchParams, { status: null }) }] : []),
  ];
  return <div className="crm-list-page">
    <PageHeader icon="✦" eyebrow="Operations / Outcomes" title="Placements" description="Manage team-arranged placements, schedules, and lifecycle progress." actions={<Link href="/admin/placements/new" className="btn btn-primary btn-sm"><Plus size={16} /> New placement</Link>} />
    <CrmViews label="Placement status views" items={[
      { label: "All placements", href: listHref(path, searchParams, { status: null }), active: !searchParams.status, count: allPlacementsCount },
      ...STATUSES.map(status => ({ label: status, href: listHref(path, searchParams, { status }), active: searchParams.status === status, count: overview.placementCounts[status] ?? 0 })),
    ]} />
    <section className="crm-records" aria-label="Placement records">
      <form method="get" aria-label="Filter placements" className="crm-toolbar">
        <label className="crm-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search organization or role</span><input type="search" name="q" defaultValue={searchParams.q ?? ""} placeholder="Search organization or role" /></label>
        <label className="crm-toolbar-select"><span className="sr-only">Placement status</span><WorkspaceSelect name="status" ariaLabel="Filter by placement status" defaultValue={searchParams.status ?? ""} options={[{ value: "", label: "All statuses" }, ...STATUSES.map(value => ({ value, label: value }))]} /></label>
        <button type="submit" className="btn btn-primary crm-apply">Apply</button>
      </form>
      <CrmFilterChips filters={filters} clearHref={path} />
      <CrmTableMeta total={total} page={page} pageSize={pageSize} noun="placements" note="Placement updates are visible to the linked student." />
      {rows.length ? <>
        <div className="crm-table-scroll hidden md:block"><table className="crm-table">
          <thead><tr><th scope="col">Role / Organization</th><th scope="col">Country</th><th scope="col">Dates</th><th scope="col">Lifecycle stage</th><th scope="col" className="crm-col-action">Action</th></tr></thead>
          <tbody>{rows.map(p => <tr key={p.id}>
            <td><Link href={`/admin/placements/${p.id}/edit`} className="crm-record-name">{p.role}</Link><span className="crm-record-sub">{p.organization}</span></td>
            <td className="crm-record-secondary">{p.countryCode}</td>
            <td className="crm-date tnum">{p.startDate ?? "TBC"} – {p.endDate ?? "TBC"}</td>
            <td><StatusBadge status={p.placementStatus} /></td>
            <td className="crm-col-action"><Link href={`/admin/placements/${p.id}/edit`} className="crm-row-link">Manage</Link></td>
          </tr>)}</tbody>
        </table></div>
        <ul className="crm-mobile-records md:hidden">{rows.map(p => <li key={p.id}><div className="crm-mobile-top"><Link className="crm-record-name" href={`/admin/placements/${p.id}/edit`}>{p.role}</Link><StatusBadge status={p.placementStatus} /></div><p>{p.organization} · {p.countryCode}</p><p className="crm-record-sub tnum">{p.startDate ?? "Start TBC"} – {p.endDate ?? "End TBC"}</p><div className="crm-mobile-bottom"><Link className="crm-row-link" href={`/admin/placements/${p.id}/edit`}>Manage placement</Link></div></li>)}</ul>
      </> : <div className="crm-empty"><EmptyState icon="✦" title="No placements in this view" body="Change your filters or add a placement to start tracking outcomes." actionHref="/admin/placements/new" actionLabel="New placement" /></div>}
      <Pagination page={page} totalPages={Math.max(1,Math.ceil(total/pageSize))} pathname={path} searchParams={searchParams} total={total} pageSize={pageSize} />
    </section>
  </div>;
}
