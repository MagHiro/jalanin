import Link from "next/link";
import { ArrowDown, ArrowUp, Plus, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { listAdminInternships } from "@/features/admin/service";
import { PageHeader } from "@/components/ui/page-header";
import { AdminRecords } from "@/components/admin/admin-records";
import { DiscoveryEmptyState } from "@/components/ui/discovery-empty-state";
import { WorkspaceSelect } from "@/components/ui/workspace-select";
import { RecordActions } from "@/components/ui/record-actions";
import { Pagination } from "@/components/ui/pagination";
import { CrmViews, CrmFilterChips, CrmTableMeta, listHref } from "@/components/ui/crm-list";

export const metadata = { title: "Manage internships", robots: "noindex" };
export const dynamic = "force-dynamic";
const path = "/admin/internships";
const STATUSES = ["Draft", "Published", "Unpublished"];

export default async function AdminInternshipsPage({ searchParams }: {
  searchParams: { q?: string; status?: string; sort?: string; page?: string };
}) {
  await requireAdmin();
  const rawPage = Number(searchParams.page ?? 1);
  const page = Number.isSafeInteger(rawPage) ? Math.max(1, Math.min(100000, rawPage)) : 1;
  const pageSize = 20;
  const { rows, total } = await listAdminInternships({
    q: searchParams.q, status: searchParams.status,
    sort: searchParams.sort === "title" ? "title" : searchParams.sort === "start" ? "start" : "updated",
    page, pageSize,
  });
  const badgeClass = (status: string) => status === "Published" ? "badge-published" : status === "Draft" ? "badge-draft" : "badge-unpublished";
  const filters = [
    ...(searchParams.q ? [{ label: `Search: ${searchParams.q}`, href: listHref(path, searchParams, { q: null }) }] : []),
    ...(searchParams.status ? [{ label: `Publication: ${searchParams.status}`, href: listHref(path, searchParams, { status: null }) }] : []),
  ];

  return <AdminRecords filters={searchParams}>
    <PageHeader title="Internships" description="Manage published opportunities, drafts, and application dates." actions={<Link href="/admin/internships/new" className="btn btn-primary btn-sm"><Plus size={16} /> New internship</Link>} />
    <CrmViews label="Internship publication views" items={[
      { label: "All listings", href: listHref(path, searchParams, { status: null }), active: !searchParams.status },
      ...STATUSES.map(status => ({ label: status, href: listHref(path, searchParams, { status }), active: searchParams.status === status })),
    ]} />
    <section className="crm-records" aria-label="Internship records">
      <form method="get" aria-label="Filter internships" className="crm-toolbar">
        <label className="crm-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search title or city</span><input type="search" name="q" defaultValue={searchParams.q ?? ""} placeholder="Search title or location" /></label>
        <label className="crm-toolbar-select"><span className="sr-only">Publication status</span><WorkspaceSelect name="status" ariaLabel="Filter by publication status" defaultValue={searchParams.status ?? ""} options={[{ value: "", label: "All statuses" }, ...STATUSES.map(status => ({ value: status, label: status }))]} /></label>
        <label className="crm-toolbar-select"><span className="sr-only">Sort internships</span><WorkspaceSelect name="sort" ariaLabel="Sort internships" defaultValue={searchParams.sort ?? "updated"} options={[{ value: "updated", label: "Recently updated" }, { value: "title", label: "Title A–Z" }, { value: "start", label: "Start date" }]} /></label>
        <button type="submit" className="btn btn-primary crm-apply">Apply</button>
      </form>
      <CrmFilterChips filters={filters} clearHref={path} />
      <CrmTableMeta total={total} page={page} pageSize={pageSize} noun="internships" note="Edit a listing to change publication or dates." />
      {rows.length ? <>
        <div className="crm-table-scroll hidden md:block"><table className="crm-table">
          <thead><tr>
            <th scope="col"><Link href={listHref(path, searchParams, { sort: "title" })} className="crm-sort">Listing {searchParams.sort === "title" && <ArrowDown size={13} />}</Link></th>
            <th scope="col">Location</th>
            <th scope="col"><Link href={listHref(path, searchParams, { sort: "start" })} className="crm-sort">Start date {searchParams.sort === "start" && <ArrowUp size={13} />}</Link></th>
            <th scope="col">Publication</th>
            <th scope="col"><Link href={listHref(path, searchParams, { sort: "updated" })} className="crm-sort">Last updated {(!searchParams.sort || searchParams.sort === "updated") && <ArrowDown size={13} />}</Link></th>
            <th scope="col" className="crm-col-action">Actions</th>
          </tr></thead>
          <tbody>{rows.map(row => <tr key={row.id}>
            <td><Link className="crm-record-name" href={`/admin/internships/${row.id}/edit`}>{row.title}</Link><span className="crm-record-sub">/{row.slug}</span></td>
            <td className="crm-record-secondary">{row.city}, {row.countryCode}</td>
            <td className="crm-date tnum">{row.startDate ?? "—"}</td>
            <td><div className="crm-badge-stack"><span className={`badge ${badgeClass(row.publicationStatus)}`}><span className="badge-dot" aria-hidden="true" />{row.publicationStatus}</span>{row.featured && <span className="crm-featured-label">Featured</span>}</div></td>
            <td className="crm-date">{new Date(row.updatedAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" })}</td>
            <td className="crm-col-action">{row.publicationStatus === "Published"
              ? <RecordActions primary={{ href: `/admin/internships/${row.id}/edit`, label: "Edit" }} items={[{ href: `/opportunities/${row.slug}`, label: "Public listing", external: true }]} />
              : <Link href={`/admin/internships/${row.id}/edit`} className="crm-row-link">Edit</Link>}</td>
          </tr>)}</tbody>
        </table></div>
        <ul className="crm-mobile-records md:hidden">{rows.map(row => <li key={row.id}>
          <div className="crm-mobile-top"><Link className="crm-record-name" href={`/admin/internships/${row.id}/edit`}>{row.title}</Link><span className={`badge ${badgeClass(row.publicationStatus)}`}>{row.publicationStatus}</span></div>
          <p>{row.city}, {row.countryCode}</p><p className="crm-record-sub">Starts {row.startDate ?? "to be confirmed"}</p>
          <div className="crm-mobile-bottom">{row.featured && <span className="crm-featured-label">Featured</span>}<Link className="crm-row-link" href={`/admin/internships/${row.id}/edit`}>Edit listing</Link></div>
        </li>)}</ul>
      </> : <DiscoveryEmptyState
        title={filters.length ? "No matching internships" : "No internships yet"}
        description={filters.length ? "Try a broader search or clear your filters to see other listings." : "Create your first listing. Save it as a draft until it’s ready to publish."}
        href={filters.length ? path : "/admin/internships/new"}
        action={filters.length ? "Clear filters" : "New internship"}
        variant={filters.length ? "search" : "application"}
      />}
      <Pagination page={page} totalPages={Math.max(1,Math.ceil(total/pageSize))} pathname={path} searchParams={searchParams} total={total} pageSize={pageSize} />
    </section>
  </AdminRecords>;
}
