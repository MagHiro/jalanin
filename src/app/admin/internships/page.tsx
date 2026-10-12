import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { listAdminInternships } from "@/features/admin/service";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Manage internships", robots: "noindex" };
export const dynamic = "force-dynamic";

export default async function AdminInternshipsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  await requireAdmin();
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const pageSize = 20;
  const { rows, total } = await listAdminInternships({
    q: searchParams.q,
    status: searchParams.status,
    page,
    pageSize,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pubBadge = (s: string) =>
    s === "Published"
      ? "badge-published"
      : s === "Draft"
        ? "badge-draft"
        : "badge-unpublished";

  return (
    <div className="space-y-5">
      <PageHeader
        icon="▤"
        eyebrow="Listings"
        title={`Internships (${total})`}
        actions={<Link href="/admin/internships/new" className="btn btn-primary btn-sm">+ New internship</Link>}
      />
      <form method="get" aria-label="Filter internships" className="toolbar grid gap-3 text-sm sm:grid-cols-[1.4fr_1fr_auto]">
        <label className="field-label">
          <span className="sr-only">Search title or city</span>
          <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search title or city" className="field !min-h-11" />
        </label>
        <label className="field-label">
          <span className="sr-only">Publication status</span>
          <select name="status" defaultValue={searchParams.status ?? ""} className="field !min-h-11">
            <option value="">All statuses</option>
            <option>Draft</option>
            <option>Published</option>
            <option>Unpublished</option>
          </select>
        </label>
        <div className="flex items-end">
          <button className="btn btn-primary btn-sm min-h-11">Filter</button>
        </div>
      </form>

      {rows.length > 0 && (
        <div className="table-shell hidden md:block">
          <table>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Location</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <p className="font-semibold text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">/{r.slug}</p>
                  </td>
                  <td className="text-muted-foreground">{r.city}, {r.countryCode}</td>
                  <td>
                    <span className={`badge border ${pubBadge(r.publicationStatus)}`}>
                      <span aria-hidden="true" className="badge-dot" />{r.publicationStatus}{r.featured ? " · featured" : ""}
                    </span>
                  </td>
                  <td className="text-right">
                    <Link href={`/admin/internships/${r.id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ul className="space-y-2 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="surface-card flex items-center justify-between gap-3 p-4 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{r.title}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.city}, {r.countryCode}</p>
              <p className="mt-1.5"><span className={`badge border ${pubBadge(r.publicationStatus)}`}><span aria-hidden="true" className="badge-dot" />{r.publicationStatus}</span></p>
            </div>
            <Link href={`/admin/internships/${r.id}/edit`} className="btn btn-outline btn-sm shrink-0">Edit</Link>
          </li>
        ))}
      </ul>

      {rows.length === 0 && (
        <EmptyState icon="▤" title="No internships found." body="Create your first listing to get started." actionHref="/admin/internships/new" actionLabel="New internship" />
      )}

      {totalPages > 1 && (
        <p className="tnum text-center text-sm text-muted-foreground" role="status">Page {page} of {totalPages} — {total} total. Use filters to narrow results.</p>
      )}
    </div>
  );
}
