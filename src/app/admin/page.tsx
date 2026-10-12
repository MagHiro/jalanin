import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require";
import { getAdminOverview, recentAudit } from "@/features/admin/service";

export const metadata: Metadata = { title: "Admin overview", robots: "noindex" };
export const dynamic = "force-dynamic";

// Operational overview (D06): every number is a live DB aggregate with a
// link to its filtered list. No synthetic/forecast widgets.
const STATUS_LINKS: Array<[string, string]> = [
  ["New", "/admin/applications?status=New"],
  ["In Review", "/admin/applications?status=In+Review"],
  ["Quotation Sent", "/admin/applications?status=Quotation+Sent"],
  ["Accepted", "/admin/applications?status=Accepted"],
  ["Rejected", "/admin/applications?status=Rejected"],
  ["Completed", "/admin/applications?status=Completed"],
];

export default async function AdminOverviewPage() {
  await requireAdmin();
  const overview = await getAdminOverview();
  const audit = await recentAudit(10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Operations overview</h1>

      <section aria-labelledby="apps-h">
        <h2 id="apps-h" className="font-semibold">Applications by status</h2>
        <ul className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STATUS_LINKS.map(([status, href]) => (
            <li key={status} className="rounded-xl border p-4">
              <p className="text-3xl font-bold">{overview.statusCounts[status] ?? 0}</p>
              <Link href={href} className="text-sm font-medium text-emerald-700 hover:underline">{status}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="other-h">
        <h2 id="other-h" className="font-semibold">Platform</h2>
        <ul className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <li className="rounded-xl border p-4"><p className="text-3xl font-bold">{overview.publishedInternships}</p>
            <Link href="/admin/internships" className="text-sm font-medium text-emerald-700 hover:underline">Published internships</Link></li>
          <li className="rounded-xl border p-4"><p className="text-3xl font-bold">{overview.totalStudents}</p>
            <Link href="/admin/students" className="text-sm font-medium text-emerald-700 hover:underline">Students</Link></li>
          <li className="rounded-xl border p-4"><p className="text-3xl font-bold">{overview.unreadNotifications}</p>
            <Link href="/admin/notifications" className="text-sm font-medium text-emerald-700 hover:underline">Unread alerts</Link></li>
          <li className="rounded-xl border p-4"><p className="text-3xl font-bold">
            {Object.values(overview.placementCounts).reduce((a, b) => a + b, 0)}</p>
            <Link href="/admin/placements" className="text-sm font-medium text-emerald-700 hover:underline">Placements</Link></li>
        </ul>
      </section>

      <section aria-labelledby="activity-h">
        <h2 id="activity-h" className="font-semibold">Recent activity</h2>
        {audit.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No audited actions yet.</p>
        ) : (
          <ol className="mt-2 space-y-1 text-sm">
            {audit.map((a) => (
              <li key={a.id} className="flex justify-between gap-3 border-b py-1">
                <span><strong>{a.action}</strong> <span className="text-slate-500">· {a.entityType} {String(a.entityId).slice(0, 8)}</span></span>
                <span className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString("en-SG")}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
