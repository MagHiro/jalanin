import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Bell, ClipboardList, History, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { getAdminOverview, recentAudit } from "@/features/admin/service";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = { title: "Admin overview", robots: "noindex" };
export const dynamic = "force-dynamic";

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
  const audit = await recentAudit(8);
  const totalPlacements = Object.values(overview.placementCounts).reduce((a, b) => a + b, 0);
  const totalApplications = Object.values(overview.statusCounts).reduce((a, b) => a + b, 0);

  return <div className="workspace-overview">
    <section className="workspace-welcome" aria-labelledby="overview-title">
      <div><p className="workspace-kicker">The operations desk</p><h1 id="overview-title">A clear view.<br /><span>Better next steps.</span></h1><p className="workspace-intro">Every application is the start of something.<br className="hidden md:block" /> Keep the details moving, from first review to placement.</p></div>
      <Link href="/admin/internships/new" className="btn btn-primary"><Plus size={17} /> New internship</Link>
    </section>

    <section aria-label="Platform at a glance" className="workspace-stat-strip">
      {[
        { value: totalApplications, label: "Applications", href: "/admin/applications" },
        { value: overview.publishedInternships, label: "Published internships", href: "/admin/internships?status=Published" },
        { value: overview.totalStudents, label: "Students", href: "/admin/students" },
        { value: totalPlacements, label: "Placements", href: "/admin/placements" },
      ].map(stat => <Link key={stat.label} href={stat.href} className="workspace-stat"><span className="workspace-stat-label">{stat.label}<ArrowUpRight size={16} /></span><strong className="tnum">{stat.value}</strong></Link>)}
    </section>

    <section className="workspace-priority" aria-labelledby="review-title">
      <div className="workspace-priority-icon"><ClipboardList size={25} strokeWidth={1.5} /></div>
      <div><p className="workspace-kicker">Start here</p><h2 id="review-title">Make room for the next chapter.</h2><p><span className="tnum">{overview.statusCounts.New ?? 0}</span> new applications await review. Revisit updated submissions in the re-review queue.</p></div>
      <div className="workspace-priority-actions"><Link href="/admin/applications?status=New" className="btn btn-primary">Review applications <ArrowRight size={17} /></Link><Link href="/admin/applications?rereview=1" className="workspace-text-link">Re-review queue <ArrowUpRight size={16} /></Link></div>
    </section>

    <section aria-labelledby="apps-h" className="workspace-section">
      <div className="workspace-section-heading"><div><p className="workspace-kicker">01 / Application pipeline</p><h2 id="apps-h">Where things stand</h2></div><Link href="/admin/applications" className="workspace-text-link">All applications <ArrowRight size={16} /></Link></div>
      <div className="workspace-pipeline-visual">
        <div className="workspace-pipeline-meter" role="img" aria-label={`Distribution of ${totalApplications} applications across six lifecycle statuses`}>
          {STATUS_LINKS.map(([status]) => <span key={status} style={{ width: `${((overview.statusCounts[status] ?? 0) / Math.max(totalApplications, 1)) * 100}%` }} title={`${status}: ${overview.statusCounts[status] ?? 0}`} />)}
        </div>
        <div className="workspace-pipeline-context"><span>Application lifecycle distribution</span><span className="tnum">{totalApplications} total records</span></div>
      </div>
      <ul className="workspace-pipeline">{STATUS_LINKS.map(([status, href]) => <li key={status}><Link href={href}><StatusBadge status={status} /><strong className="tnum">{overview.statusCounts[status] ?? 0}</strong><span className="workspace-pipeline-link">View records <ArrowUpRight size={15} /></span></Link></li>)}</ul>
    </section>

    <div className="workspace-bottom-grid">
      <section aria-labelledby="activity-h" className="workspace-section">
        <div className="workspace-section-heading"><div><p className="workspace-kicker">02 / Latest updates</p><h2 id="activity-h">Behind the scenes</h2></div><History size={20} strokeWidth={1.5} className="text-muted-foreground" /></div>
        {audit.length === 0 ? <div className="workspace-quiet-empty"><History size={26} strokeWidth={1.5} /><h3>A clean slate.</h3><p>No audited actions yet. Recorded platform activity will appear here.</p></div> : <ol className="workspace-activity">{audit.map(a => <li key={a.id}><span className="workspace-activity-dot" aria-hidden="true" /><div><p>{a.action}</p><span>{a.entityType} · {String(a.entityId).slice(0, 8)}</span></div><time className="tnum" dateTime={new Date(a.createdAt).toISOString()}>{new Date(a.createdAt).toLocaleString("en-SG")}</time></li>)}</ol>}
      </section>
      <section className="workspace-note" aria-labelledby="alerts-title"><Bell size={24} strokeWidth={1.5} /><p className="workspace-kicker">Keep in the loop</p><strong className="workspace-note-count tnum">{overview.unreadNotifications}</strong><h2 id="alerts-title">Unread alerts</h2><p>{overview.unreadNotifications > 0 ? "New updates are ready for your attention. Open your inbox to catch up." : "You’re all caught up. New application alerts will appear in your inbox."}</p><Link href="/admin/notifications?unread=1" className="workspace-text-link">Open notifications <ArrowUpRight size={17} /></Link></section>
    </div>
  </div>;
}
