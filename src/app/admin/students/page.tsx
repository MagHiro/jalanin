import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { listAdminStudents } from "@/features/admin/service";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkspaceSelect } from "@/components/ui/workspace-select";

export const metadata = { title: "Students", robots: "noindex" };
export const dynamic = "force-dynamic";

// Searchable student directory: basic profile + application relationship
// only, never a full CRM.
export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; page?: string };
}) {
  await requireAdmin();
  const rawPage = Number(searchParams.page ?? 1);
  const page = Number.isSafeInteger(rawPage) ? Math.max(1, Math.min(100000, rawPage)) : 1;
  const pageSize = 20;
  const { rows, total } = await listAdminStudents({
    q: searchParams.q,
    sort: searchParams.sort === "newest" ? "newest" : "name",
    page,
    pageSize,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.sort) params.set("sort", searchParams.sort);
    params.set("page", String(p));
    return `/admin/students?${params}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader icon="○" eyebrow="People" title={`Students (${total})`} />
      <form method="get" aria-label="Search students" className="toolbar !flex-nowrap">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search display name</span>
          <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search display name" className="field !mt-0 !min-h-11 max-w-md" />
        </label>
        <label>
          <span className="sr-only">Sort students</span>
          <WorkspaceSelect name="sort" ariaLabel="Sort students" defaultValue={searchParams.sort ?? "name"} options={[{ value: "name", label: "Name A–Z" }, { value: "newest", label: "Newest" }]} />
        </label>
        <button className="btn btn-primary btn-sm min-h-11 shrink-0">Search</button>
      </form>
      {rows.length > 0 ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {rows.map((r) => (
            <li key={r.userId} className="surface-card surface-card-hover flex items-center justify-between gap-3 p-4 text-sm">
              <span className="min-w-0 truncate font-medium text-foreground">{r.displayName ?? "(no name)"}</span>
              <Link href={`/admin/students/${r.userId}`} className="btn btn-outline btn-sm shrink-0">View record</Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="○" title="No students found." body="Student profiles appear here once accounts are created." />
      )}
      {totalPages > 1 && (
        <nav aria-label="Student pagination" className="flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={pageHref(page - 1)} className="btn btn-outline btn-sm">← Previous</Link>}
          <span className="tnum text-muted-foreground" aria-current="page">Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={pageHref(page + 1)} className="btn btn-outline btn-sm">Next →</Link>}
        </nav>
      )}
    </div>
  );
}
