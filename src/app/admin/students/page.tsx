import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { listAdminStudents } from "@/features/admin/service";

export const metadata = { title: "Students", robots: "noindex" };
export const dynamic = "force-dynamic";

// Searchable student directory (Additional Scope): basic profile +
// application relationship only, never a full CRM.
export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requireAdmin();
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const { rows, total } = await listAdminStudents({
    q: searchParams.q,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Students ({total})</h1>
      <form method="get" className="flex gap-2 text-sm">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search display name" className="rounded border px-3 py-1.5" />
        <button className="rounded border px-3 py-1.5 hover:bg-slate-50">Search</button>
      </form>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.userId} className="flex items-center justify-between gap-2 rounded-xl border p-3 text-sm">
            <span className="font-medium">{r.displayName ?? "(no name)"}</span>
            <Link href={`/admin/students/${r.userId}`} className="rounded-lg border px-3 py-1.5 hover:bg-slate-50">View record</Link>
          </li>
        ))}
        {rows.length === 0 && <li className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">No students found.</li>}
      </ul>
    </div>
  );
}
