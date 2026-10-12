import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require";
import { getAdminOverview, recentAudit } from "@/features/admin/service";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";

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
  const totalPlacements = Object.values(overview.placementCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        icon="⌂"
        eyebrow="Operations"
        title="Overview"
        description="Live application and platform activity — every number links to its records."
        actions={
          <Link href="/admin/applications?rereview=1" className="btn btn-outline btn-sm">
            Re-review queue
          </Link>
        }
      />

      <section aria-labelledby="apps-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="apps-h" className="text-base font-semibold tracking-tight text-foreground">Applications by status</h2>
          <span className="tnum text-xs text-muted-foreground">
            {Object.values(overview.statusCounts).reduce((a, b) => a + b, 0)} total
          </span>
        </div>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STATUS_LINKS.map(([status, href]) => (
            <MetricCard
              key={status}
              value={overview.statusCounts[status] ?? 0}
              label={status}
              href={href}
            />
          ))}
        </ul>
      </section>

      <section aria-labelledby="other-h">
        <h2 id="other-h" className="text-base font-semibold tracking-tight text-foreground">Platform</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard value={overview.publishedInternships} label="Published internships" href="/admin/internships?status=Published" />
          <MetricCard value={overview.totalStudents} label="Students" href="/admin/students" />
          <MetricCard
            value={overview.unreadNotifications}
            label="Unread alerts"
            href="/admin/notifications?unread=1"
            tone={overview.unreadNotifications > 0 ? "alert" : "default"}
            hint={overview.unreadNotifications > 0 ? "Needs triage" : undefined}
          />
          <MetricCard value={totalPlacements} label="Placements" href="/admin/placements" />
        </ul>
      </section>

      <section aria-labelledby="activity-h" className="surface-card p-5 md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="activity-h" className="text-base font-semibold tracking-tight text-foreground">Recent activity</h2>
          <span className="text-xs text-muted-foreground">Committed audit events only</span>
        </div>
        {audit.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">No audited actions yet.</p>
        ) : (
          <ol className="mt-2 divide-y divide-border text-sm">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2.5">
                <span className="text-foreground"><strong className="font-semibold">{a.action}</strong> <span className="text-muted-foreground">· {a.entityType} {String(a.entityId).slice(0, 8)}</span></span>
                <span className="tnum text-xs text-muted-foreground"><time>{new Date(a.createdAt).toLocaleString("en-SG")}</time></span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
