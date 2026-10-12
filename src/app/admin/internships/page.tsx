import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { listAdminInternships } from "@/features/admin/service";

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Internships ({total})</h1>
        <Link href="/admin/internships/new" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          New internship
        </Link>
      </div>
      <form method="get" className="flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search title or city" className="rounded border px-3 py-1.5" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="rounded border px-3 py-1.5">
          <option value="">All statuses</option>
          <option>Draft</option>
          <option>Published</option>
          <option>Unpublished</option>
        </select>
        <button className="rounded border px-3 py-1.5 hover:bg-slate-50">Filter</button>
      </form>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
            <div>
              <p className="font-semibold">{r.title}</p>
              <p className="text-xs text-slate-500">/{r.slug} · {r.city}, {r.countryCode} · {r.publicationStatus}{r.featured ? " · featured" : ""}</p>
            </div>
            <Link href={`/admin/internships/${r.id}/edit`} className="rounded-lg border px-3 py-1.5 font-medium hover:bg-slate-50">
              Edit
            </Link>
          </li>
        ))}
        {rows.length === 0 && <li className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">No internships found.</li>}
      </ul>
      {total > pageSize && (
        <p className="text-sm text-slate-600">Page {page} — {total} total. Use filters to narrow results.</p>
      )}
    </div>
  );
}
