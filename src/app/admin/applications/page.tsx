import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { listAdminApplications } from "@/features/admin/service";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Applications", robots: "noindex" };
export const dynamic = "force-dynamic";

const STATUSES = ["New", "In Review", "Quotation Sent", "Accepted", "Rejected", "Completed"];

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
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      <PageHeader
        icon="☰"
        eyebrow="Review queue"
        title={`Applications (${total})`}
        description={
          searchParams.rereview === "1"
            ? "Student revisions awaiting explicit admin acknowledgement."
            : "Search, filter, and open records for review."
        }
        actions={
          searchParams.rereview === "1" ? (
            <Link href="/admin/applications" className="btn btn-outline btn-sm">Show all</Link>
          ) : (
            <Link href="/admin/applications?rereview=1" className="btn btn-outline btn-sm">Re-review only</Link>
          )
        }
      />
      <form method="get" aria-label="Filter applications" className="toolbar grid gap-3 text-sm md:grid-cols-[1.4fr_1fr_auto]">
        <label className="field-label">
          <span className="sr-only">Search name, email, university</span>
          <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search name, email, university" className="field !min-h-11" />
        </label>
        <label className="field-label">
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={searchParams.status ?? ""} className="field !min-h-11">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-[13px]">
            <input type="checkbox" name="rereview" value="1" defaultChecked={searchParams.rereview === "1"} className="size-4 accent-primary" /> Re-review
          </label>
          <button className="btn btn-primary btn-sm min-h-11">Filter</button>
        </div>
      </form>

      {/* Desktop table */}
      {rows.length > 0 && (
        <div className="table-shell hidden md:block">
          <table>
            <thead>
              <tr>
                <th scope="col">Applicant</th>
                <th scope="col">Internship</th>
                <th scope="col">Status</th>
                <th scope="col">Submitted</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ application, internshipTitle }) => (
                <tr key={application.id}>
                  <td>
                    <p className="font-semibold text-foreground">{application.firstName} {application.lastName}</p>
                    <p className="tnum text-xs text-muted-foreground">{application.email} · r{application.revision}</p>
                  </td>
                  <td className="text-muted-foreground">{internshipTitle}</td>
                  <td>
                    <span className="flex flex-wrap gap-1.5">
                      <StatusBadge status={application.lifecycleStatus} />
                      {application.needsReReview && (
                        <span className="badge badge-rereview"><span aria-hidden="true" className="badge-dot" />Re-review</span>
                      )}
                    </span>
                  </td>
                  <td className="tnum whitespace-nowrap text-xs text-muted-foreground">
                    {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("en-SG") : "—"}
                  </td>
                  <td className="text-right">
                    <Link href={`/admin/applications/${application.id}`} className="btn btn-outline btn-sm">Review</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {rows.map(({ application, internshipTitle }) => (
          <li key={application.id} className="surface-card flex items-center justify-between gap-3 p-4 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">
                {application.firstName} {application.lastName}
              </p>
              <p className="tnum mt-0.5 truncate text-xs text-muted-foreground">
                {internshipTitle} · {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("en-SG") : "—"} · r{application.revision}
              </p>
              <p className="mt-1.5 flex flex-wrap gap-1.5">
                <StatusBadge status={application.lifecycleStatus} />
                {application.needsReReview && (
                  <span className="badge badge-rereview"><span aria-hidden="true" className="badge-dot" />Re-review</span>
                )}
              </p>
            </div>
            <Link href={`/admin/applications/${application.id}`} className="btn btn-outline btn-sm shrink-0">
              Review
            </Link>
          </li>
        ))}
      </ul>

      {rows.length === 0 && (
        <EmptyState icon="☰" title="No applications found." body="Try widening the search or clearing the status filter." />
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={`/admin/applications?page=${page - 1}${searchParams.status ? `&status=${encodeURIComponent(searchParams.status)}` : ""}${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ""}`} className="btn btn-outline btn-sm">← Previous</Link>
          ) : null}
          <span className="tnum text-muted-foreground" aria-current="page">Page {page} of {totalPages} · {total} total</span>
          {page < totalPages ? (
            <Link href={`/admin/applications?page=${page + 1}${searchParams.status ? `&status=${encodeURIComponent(searchParams.status)}` : ""}${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ""}`} className="btn btn-outline btn-sm">Next →</Link>
          ) : null}
        </nav>
      )}
    </div>
  );
}
