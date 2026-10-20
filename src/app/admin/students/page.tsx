import Link from "next/link";
import { ArrowDown, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { listAdminStudents } from "@/features/admin/service";
import { PageHeader } from "@/components/ui/page-header";
import { AdminRecords } from "@/components/admin/admin-records";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkspaceSelect } from "@/components/ui/workspace-select";
import { Pagination } from "@/components/ui/pagination";
import { CrmFilterChips, CrmTableMeta, listHref } from "@/components/ui/crm-list";

export const metadata = { title: "Students", robots: "noindex" };
export const dynamic = "force-dynamic";
const path = "/admin/students";

/** Student directory is profile-backed; no fabricated CRM properties. */
export default async function AdminStudentsPage({ searchParams }: {
  searchParams: { q?: string; sort?: string; page?: string };
}) {
  await requireAdmin();
  const rawPage = Number(searchParams.page ?? 1);
  const page = Number.isSafeInteger(rawPage) ? Math.max(1, Math.min(100000, rawPage)) : 1;
  const pageSize = 20;
  const { rows, total } = await listAdminStudents({
    q: searchParams.q, sort: searchParams.sort === "newest" ? "newest" : "name", page, pageSize,
  });
  const filters = searchParams.q ? [{ label: `Name: ${searchParams.q}`, href: listHref(path, searchParams, { q: null }) }] : [];
  return <AdminRecords filters={searchParams}>
    <PageHeader title="Students" description="Student profiles linked to submitted applications and placement records." />
    <section className="crm-records" aria-label="Student records">
      <form method="get" aria-label="Search students" className="crm-toolbar">
        <label className="crm-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search display name</span><input type="search" name="q" defaultValue={searchParams.q ?? ""} placeholder="Search display name" /></label>
        <label className="crm-toolbar-select"><span className="sr-only">Sort students</span><WorkspaceSelect name="sort" ariaLabel="Sort students" defaultValue={searchParams.sort ?? "name"} options={[{ value: "name", label: "Name A–Z" }, { value: "newest", label: "Recently joined" }]} /></label>
        <button type="submit" className="btn btn-primary crm-apply">Search</button>
      </form>
      <CrmFilterChips filters={filters} clearHref={path} />
      <CrmTableMeta total={total} page={page} pageSize={pageSize} noun="students" note="Open a profile to see its applications and placements." />
      {rows.length ? <>
        <div className="crm-table-scroll hidden md:block"><table className="crm-table">
          <thead><tr>
            <th scope="col"><Link className="crm-sort" href={listHref(path, searchParams, { sort: "name" })}>Student {(!searchParams.sort || searchParams.sort === "name") && <ArrowDown size={13} />}</Link></th>
            <th scope="col">Profile reference</th>
            <th scope="col"><Link className="crm-sort" href={listHref(path, searchParams, { sort: "newest" })}>Joined {searchParams.sort === "newest" && <ArrowDown size={13} />}</Link></th>
            <th scope="col">Profile updated</th><th scope="col" className="crm-col-action">Action</th>
          </tr></thead>
          <tbody>{rows.map(student => <tr key={student.userId}>
            <td><div className="crm-person"><span className="crm-person-avatar" aria-hidden="true">{(student.displayName?.trim()?.[0] || "S").toUpperCase()}</span><Link href={`/admin/students/${student.userId}`} className="crm-record-name">{student.displayName || "Unnamed student"}</Link></div></td>
            <td className="crm-record-sub tnum">{student.userId.slice(0,8)}</td>
            <td className="crm-date">{new Date(student.createdAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" })}</td>
            <td className="crm-date">{new Date(student.updatedAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" })}</td>
            <td className="crm-col-action"><Link className="crm-row-link" href={`/admin/students/${student.userId}`}>View profile</Link></td>
          </tr>)}</tbody>
        </table></div>
        <ul className="crm-mobile-records md:hidden">{rows.map(student => <li key={student.userId}><div className="crm-mobile-top"><div className="crm-person"><span className="crm-person-avatar" aria-hidden="true">{(student.displayName?.trim()?.[0] || "S").toUpperCase()}</span><Link className="crm-record-name" href={`/admin/students/${student.userId}`}>{student.displayName || "Unnamed student"}</Link></div></div><p>Joined {new Date(student.createdAt).toLocaleDateString("en-SG")}</p><div className="crm-mobile-bottom"><span className="crm-record-sub tnum">ID {student.userId.slice(0,8)}</span><Link className="crm-row-link" href={`/admin/students/${student.userId}`}>View profile</Link></div></li>)}</ul>
      </> : <div className="crm-empty"><EmptyState icon="○" title="No students found" body="Adjust your search to find another student profile." actionHref={path} actionLabel="Clear search" /></div>}
      <Pagination page={page} totalPages={Math.max(1,Math.ceil(total/pageSize))} pathname={path} searchParams={searchParams} total={total} pageSize={pageSize} />
    </section>
  </AdminRecords>;
}
