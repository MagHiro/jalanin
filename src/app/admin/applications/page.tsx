import Link from "next/link";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { getAdminOverview, listAdminApplications } from "@/features/admin/service";
import { waitingDays, waitingLabel } from "@/lib/workflow/waiting-time";
import { PageHeader } from "@/components/ui/page-header";
import { AdminRecords } from "@/components/admin/admin-records";
import { StatusBadge } from "@/components/ui/status-badge";
import { DiscoveryEmptyState } from "@/components/ui/discovery-empty-state";
import { WorkspaceSelect } from "@/components/ui/workspace-select";
import { Pagination } from "@/components/ui/pagination";
import { RecordActions } from "@/components/ui/record-actions";
import { CrmViews, CrmFilterChips, CrmTableMeta, listHref } from "@/components/ui/crm-list";

export const metadata = { title: "Applications", robots: "noindex" };
export const dynamic = "force-dynamic";
const STATUSES = ["New", "In Review", "Quotation Sent", "Accepted", "Rejected", "Completed"];
const path = "/admin/applications";

export default async function AdminApplicationsPage({ searchParams }: {
  searchParams: { q?: string; status?: string; rereview?: string; sort?: string; page?: string };
}) {
  await requireAdmin();
  const rawPage = Number(searchParams.page ?? 1);
  const page = Number.isSafeInteger(rawPage) ? Math.max(1, Math.min(100000, rawPage)) : 1;
  const pageSize = 20;
  const sort = searchParams.sort === "oldest" ? "oldest" : searchParams.sort === "name" ? "name" : searchParams.sort === "waiting" ? "waiting" : "newest";
  const [{ rows, total }, overview, reReviewQueue] = await Promise.all([listAdminApplications({
    q: searchParams.q,
    status: searchParams.status,
    sort,
    needsReReview: searchParams.rereview === "1" ? true : undefined,
    page, pageSize,
  }), getAdminOverview(), listAdminApplications({ needsReReview: true, page: 1, pageSize: 1 })]);
  const allApplicationsCount = Object.values(overview.statusCounts).reduce((sum, n) => sum + n, 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const filterStatus = searchParams.status ?? "";
  const reReview = searchParams.rereview === "1";
  const filters = [
    ...(searchParams.q ? [{ label: `Search: ${searchParams.q}`, href: listHref(path, searchParams, { q: null }) }] : []),
    ...(filterStatus ? [{ label: `Status: ${filterStatus}`, href: listHref(path, searchParams, { status: null }) }] : []),
    ...(reReview ? [{ label: "Needs re-review", href: listHref(path, searchParams, { rereview: null }) }] : []),
  ];

  return <AdminRecords filters={searchParams}>
    <PageHeader title="Applications" description="Review submissions, track lifecycle stages, and acknowledge revised records." />
    <CrmViews label="Application queues" items={[
      { label: "All applications", href: listHref(path, searchParams, { status: null, rereview: null }), active: !filterStatus && !reReview, count: allApplicationsCount },
      { label: "New", href: listHref(path, searchParams, { status: "New", rereview: null }), active: filterStatus === "New" && !reReview, count: overview.statusCounts["New"] ?? 0 },
      { label: "In review", href: listHref(path, searchParams, { status: "In Review", rereview: null }), active: filterStatus === "In Review" && !reReview, count: overview.statusCounts["In Review"] ?? 0 },
      { label: "Quotation sent", href: listHref(path, searchParams, { status: "Quotation Sent", rereview: null }), active: filterStatus === "Quotation Sent" && !reReview, count: overview.statusCounts["Quotation Sent"] ?? 0 },
      { label: "Completed", href: listHref(path, searchParams, { status: "Completed", rereview: null }), active: filterStatus === "Completed" && !reReview, count: overview.statusCounts["Completed"] ?? 0 },
      { label: "Re-review required", href: listHref(path, searchParams, { status: null, rereview: "1" }), active: reReview, count: reReviewQueue.total },
    ]} />
    <section className="crm-records" aria-label="Application records">
      <form method="get" aria-label="Filter applications" className="crm-toolbar">
        <label className="crm-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search name, email, university</span>
          <input type="search" name="q" defaultValue={searchParams.q ?? ""} placeholder="Search applicant, email or university" />
        </label>
        <label className="crm-toolbar-select"><span className="sr-only">Status</span>
          <WorkspaceSelect name="status" ariaLabel="Filter by application status" defaultValue={filterStatus} options={[{ value: "", label: "All statuses" }, ...STATUSES.map(value => ({ value, label: value }))]} />
        </label>
        <label className="crm-toolbar-select"><span className="sr-only">Sort applications</span>
          <WorkspaceSelect name="sort" ariaLabel="Sort applications" defaultValue={sort} options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "waiting", label: "Oldest waiting" }, { value: "name", label: "Applicant A–Z" }]} />
        </label>
        <label className="crm-toolbar-check"><input type="checkbox" name="rereview" value="1" defaultChecked={reReview} /> Re-review</label>
        <button type="submit" className="btn btn-primary crm-apply">Apply</button>
      </form>
      <CrmFilterChips filters={filters} clearHref={path} />
      <CrmTableMeta total={total} page={page} pageSize={pageSize} noun="applications" note="Open an applicant to review documents and status history." />
      {rows.length > 0 ? <>
        <div className="crm-table-scroll hidden md:block">
          <table className="crm-table">
            <thead><tr>
              <th scope="col"><Link href={listHref(path, searchParams, { sort: "name" })} className="crm-sort">Applicant {searchParams.sort === "name" && <ArrowDown size={13} />}</Link></th>
              <th scope="col">Internship</th><th scope="col">Lifecycle stage</th>
              <th scope="col"><Link href={listHref(path, searchParams, { sort: "waiting" })} className="crm-sort">Waiting {sort === "waiting" ? <ArrowUp size={13} /> : <ArrowDown size={13} />}</Link></th>
              <th scope="col"><Link href={listHref(path, searchParams, { sort: searchParams.sort === "oldest" ? "newest" : "oldest" })} className="crm-sort">Submitted {searchParams.sort === "oldest" ? <ArrowUp size={13} /> : <ArrowDown size={13} />}</Link></th>
              <th scope="col" className="crm-col-numeric">Revision</th><th scope="col" className="crm-col-action">Action</th>
            </tr></thead>
            <tbody>{rows.map(({ application, internshipTitle, waitingSince }) => {
              const label = waitingSince ? waitingLabel(waitingDays(waitingSince)) : null;
              return <tr key={application.id}>
              <td><Link href={`/admin/applications/${application.id}`} className="crm-record-name">{application.firstName} {application.lastName}</Link><span className="crm-record-sub">{application.email}</span></td>
              <td><span className="crm-record-secondary">{internshipTitle}</span></td>
              <td><div className="crm-badge-stack"><StatusBadge status={application.lifecycleStatus} />{application.needsReReview && <span className="badge badge-rereview">Re-review</span>}</div></td>
              <td className="crm-date">{label ? <time className="tnum" dateTime={waitingSince!.toISOString()} title={`Waiting since ${waitingSince!.toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" })}`}>{label}</time> : <span className="text-muted-foreground">—</span>}</td>
              <td className="crm-date">{application.submittedAt ? <time dateTime={new Date(application.submittedAt).toISOString()}>{new Date(application.submittedAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" })}</time> : "—"}</td>
              <td className="crm-col-numeric tnum">r{application.revision}</td>
              <td className="crm-col-action"><RecordActions primary={{ href: `/admin/applications/${application.id}`, label: "Review" }} items={[{ href: `mailto:${application.email}`, label: "Email applicant" }]} /></td>
            </tr>;})}</tbody>
          </table>
        </div>
        <ul className="crm-mobile-records md:hidden">{rows.map(({ application, internshipTitle, waitingSince }) => {
          const label = waitingSince ? waitingLabel(waitingDays(waitingSince)) : null;
          return <li key={application.id}>
          <div className="crm-mobile-top"><Link href={`/admin/applications/${application.id}`} className="crm-record-name">{application.firstName} {application.lastName}</Link><StatusBadge status={application.lifecycleStatus} /></div>
          <p>{internshipTitle}</p><p className="crm-record-sub">{application.email} · r{application.revision}{label ? ` · waiting ${label.toLowerCase()}` : ""}</p>
          <div className="crm-mobile-bottom">{application.needsReReview && <span className="badge badge-rereview">Re-review</span>}<Link href={`/admin/applications/${application.id}`} className="crm-row-link">Review record</Link></div>
        </li>;})}</ul>
      </> : <DiscoveryEmptyState
        title={filters.length ? "No applications in this view" : "No applications yet"}
        description={filters.length ? "Try another search or clear your filters to see other submissions." : "Student submissions will appear here when they’re ready for review."}
        href={filters.length ? path : "/admin/internships"}
        action={filters.length ? "Clear filters" : "Manage internships"}
        variant={filters.length ? "search" : "application"}
      />}
      <Pagination page={page} totalPages={totalPages} pathname={path} searchParams={searchParams} total={total} pageSize={pageSize} />
    </section>
  </AdminRecords>;
}
