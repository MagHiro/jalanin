import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Bell, BriefcaseBusiness, CheckCircle2, ClipboardList, Clock3, FileText, Plus, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { getAdminOverview, listAdminApplications, recentAudit } from "@/features/admin/service";
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
  const [audit, recentApplications] = await Promise.all([recentAudit(8), listAdminApplications({ page: 1, pageSize: 5, sort: "newest" })]);
  const totalPlacements = Object.values(overview.placementCounts).reduce((a, b) => a + b, 0);
  const totalApplications = Object.values(overview.statusCounts).reduce((a, b) => a + b, 0);
  const statistics = [
    { label: "Applications", value: totalApplications, caption: "Across all statuses", href: "/admin/applications", icon: FileText },
    { label: "Published internships", value: overview.publishedInternships, caption: "Visible opportunities", href: "/admin/internships?status=Published", icon: BriefcaseBusiness },
    { label: "Students", value: overview.totalStudents, caption: "Registered profiles", href: "/admin/students", icon: Users },
    { label: "Placements", value: totalPlacements, caption: "Recorded outcomes", href: "/admin/placements", icon: CheckCircle2 },
  ];

  return <div className="workspace-overview">
    <section className="workspace-page-heading workspace-hero workspace-admin-hero" aria-labelledby="overview-title">
      <div>
        <p className="workspace-kicker">Administration / Overview</p>
        <h1 id="overview-title">Overview</h1>
        <p className="workspace-intro">Track decisions, focus the review queue, and keep every placement moving.</p>
      </div>
      <div className="workspace-hero-aside"><span>READY FOR REVIEW</span><strong className="tnum">{overview.statusCounts.New ?? 0} new applications</strong><Link href="/admin/internships/new" className="btn btn-primary"><Plus size={17} /> New internship</Link></div>
    </section>

    <section aria-label="Platform at a glance" className="workspace-stat-strip">
      {statistics.map(({ label, value, caption, href, icon: Icon }) => <Link key={label} href={href} className="workspace-stat">
        <div className="workspace-stat-label"><span>{label}</span><span className="workspace-stat-icon"><Icon size={18} strokeWidth={1.8} /></span></div>
        <strong className="tnum">{value.toLocaleString("en-SG")}</strong>
        <span className="workspace-stat-caption">{caption}</span>
      </Link>)}
    </section>

    <div className="workspace-main-grid">
      <section className="workspace-data-card" aria-labelledby="pipeline-heading">
        <div className="workspace-panel-heading">
          <div><p className="workspace-kicker">Application insights</p><h2 id="pipeline-heading">Pipeline overview</h2></div>
          <Link href="/admin/applications" className="workspace-text-link">View all <ArrowRight size={15} /></Link>
        </div>
        <div className="workspace-pipeline-visual">
          <div className="workspace-pipeline-meter" role="img" aria-label={`Distribution of ${totalApplications} applications across six statuses`}>
            {STATUS_LINKS.map(([status]) => <span key={status} style={{ width: `${((overview.statusCounts[status] ?? 0) / Math.max(totalApplications, 1)) * 100}%` }} title={`${status}: ${overview.statusCounts[status] ?? 0}`} />)}
          </div>
          <div className="workspace-pipeline-context"><span>Applications by lifecycle status</span><span className="tnum">{totalApplications.toLocaleString("en-SG")} total</span></div>
        </div>
        <div className="workspace-status-grid">
          {STATUS_LINKS.map(([status, href]) => <Link key={status} href={href} className="workspace-status-item">
            <StatusBadge status={status} />
            <strong className="tnum">{overview.statusCounts[status] ?? 0}</strong>
          </Link>)}
        </div>
      </section>

      <section className="workspace-data-card workspace-queue-card" aria-labelledby="review-heading">
        <div className="workspace-panel-heading"><div><p className="workspace-kicker">Action center</p><h2 id="review-heading">Needs your attention</h2></div><span className="workspace-panel-icon"><ClipboardList size={20} /></span></div>
        <div className="workspace-queue-number tnum">{overview.statusCounts.New ?? 0}</div>
        <p className="workspace-queue-title">New applications to review</p>
        <p className="workspace-panel-copy">Start with the newest submissions, or revisit changes that students have made.</p>
        <div className="workspace-queue-actions">
          <Link href="/admin/applications?status=New" className="btn btn-primary">Open review queue <ArrowRight size={16} /></Link>
          <Link href="/admin/applications?rereview=1" className="workspace-text-link">Re-review submissions</Link>
        </div>
      </section>
    </div>

    <section className="workspace-data-card workspace-recent-records" aria-labelledby="recent-records-heading">
      <div className="workspace-panel-heading">
        <div><p className="workspace-kicker">Application records</p><h2 id="recent-records-heading">Recent submissions</h2></div>
        <Link href="/admin/applications" className="workspace-text-link">All applications <ArrowRight size={15}/></Link>
      </div>
      {recentApplications.rows.length ? <>
        <div className="crm-table-scroll hidden md:block">
          <table className="crm-table" aria-label="Recent application submissions">
            <thead><tr><th scope="col">Applicant</th><th scope="col">Internship</th><th scope="col">Stage</th><th scope="col">Submitted</th><th scope="col" className="crm-col-action">Review</th></tr></thead>
            <tbody>{recentApplications.rows.map(({ application, internshipTitle }) => <tr key={application.id}>
              <td><Link className="crm-record-name" href={`/admin/applications/${application.id}`}>{application.firstName} {application.lastName}</Link><span className="crm-record-sub">{application.email}</span></td>
              <td className="crm-record-secondary">{internshipTitle}</td>
              <td><StatusBadge status={application.lifecycleStatus}/></td>
              <td className="crm-date tnum">{application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short" }) : "—"}</td>
              <td className="crm-col-action"><Link href={`/admin/applications/${application.id}`} className="crm-row-link">Open record</Link></td>
            </tr>)}</tbody>
          </table>
        </div>
        <ul className="crm-mobile-records md:hidden">{recentApplications.rows.map(({ application, internshipTitle }) => <li key={application.id}><div className="crm-mobile-top"><Link className="crm-record-name" href={`/admin/applications/${application.id}`}>{application.firstName} {application.lastName}</Link><StatusBadge status={application.lifecycleStatus}/></div><p>{internshipTitle}</p><Link href={`/admin/applications/${application.id}`} className="crm-row-link">Review application</Link></li>)}</ul>
      </> : <div className="workspace-recent-records-guide"><p>No applications submitted yet. New student submissions will appear here automatically.</p><Link href="/admin/internships">View internship listings <ArrowRight size={15}/></Link></div>}
    </section>

    <div className="workspace-bottom-grid">
      <section className="workspace-data-card workspace-activity-card" aria-labelledby="activity-heading">
        <div className="workspace-panel-heading"><div><p className="workspace-kicker">Operations log</p><h2 id="activity-heading">Recent activity</h2></div><Clock3 size={18} className="workspace-panel-muted-icon" /></div>
        {audit.length === 0
          ? <div className="workspace-inline-empty"><ClipboardList size={21} /><strong>No recorded changes yet</strong><p>New updates will be logged here as your team reviews applications.</p><Link className="workspace-text-link" href="/admin/applications">Open applications <ArrowRight size={14} /></Link></div>
          : <ol className="workspace-activity">{audit.map(a => <li key={a.id}><span className="workspace-activity-dot" aria-hidden="true" /><div><p>{a.action}</p><span>{a.entityType} · {String(a.entityId).slice(0, 8)}</span></div><time className="tnum" dateTime={new Date(a.createdAt).toISOString()}>{new Date(a.createdAt).toLocaleString("en-SG")}</time></li>)}</ol>}
      </section>
      <section className="workspace-data-card workspace-alert-card" aria-labelledby="alerts-heading">
        <div className="workspace-panel-heading"><div><p className="workspace-kicker">Notifications</p><h2 id="alerts-heading">Inbox summary</h2></div><span className="workspace-panel-icon"><Bell size={19} /></span></div>
        <strong className="workspace-alert-count tnum">{overview.unreadNotifications}</strong>
        <p className="workspace-queue-title">Unread alerts</p>
        <p className="workspace-panel-copy">{overview.unreadNotifications > 0 ? "New submission updates are ready for review." : "You’re all caught up. New submission alerts will appear here."}</p>
        <Link href="/admin/notifications?unread=1" className="workspace-text-link">Go to notifications <ArrowRight size={15} /></Link>
      </section>
    </div>
  </div>;
}
