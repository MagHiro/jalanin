import Link from "next/link";
import type { Metadata } from "next";
import { Activity, ArrowRight, Bell, BriefcaseBusiness, CheckCircle2, ChevronRight, CircleDot, ClipboardList, Clock3, FileText, Plus, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { getAdminOverview, listAdminApplications, recentAudit } from "@/features/admin/service";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = { title: "Admin overview", robots: "noindex" };
export const dynamic = "force-dynamic";

const stages = [
  { label: "New", href: "/admin/applications?status=New", color: "new" },
  { label: "In Review", href: "/admin/applications?status=In+Review", color: "review" },
  { label: "Quotation Sent", href: "/admin/applications?status=Quotation+Sent", color: "quotation" },
  { label: "Accepted", href: "/admin/applications?status=Accepted", color: "accepted" },
  { label: "Rejected", href: "/admin/applications?status=Rejected", color: "rejected" },
  { label: "Completed", href: "/admin/applications?status=Completed", color: "completed" },
] as const;

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [overview, audit, recentApplications] = await Promise.all([
    getAdminOverview(),
    recentAudit(6),
    listAdminApplications({ page: 1, pageSize: 5, sort: "newest" }),
  ]);
  const totalApplications = Object.values(overview.statusCounts).reduce((sum, value) => sum + value, 0);
  const totalPlacements = Object.values(overview.placementCounts).reduce((sum, value) => sum + value, 0);
  const newCount = overview.statusCounts.New ?? 0;
  const inReviewCount = overview.statusCounts["In Review"] ?? 0;
  const maxStage = Math.max(1, ...stages.map(({ label }) => overview.statusCounts[label] ?? 0));
  const metrics = [
    { title: "Total applications", value: totalApplications, href: "/admin/applications", icon: FileText, detail: "Submitted records" },
    { title: "Live opportunities", value: overview.publishedInternships, href: "/admin/internships?status=Published", icon: BriefcaseBusiness, detail: "Published internships" },
    { title: "Student profiles", value: overview.totalStudents, href: "/admin/students", icon: Users, detail: "Registered students" },
    { title: "Placements", value: totalPlacements, href: "/admin/placements", icon: CheckCircle2, detail: "Recorded placements" },
  ];

  return <div className="ops-overview">
    <section className="ops-masthead" aria-labelledby="overview-title">
      <div className="ops-heading">
        <p className="ops-eyebrow"><span className="ops-live-dot" /> JALANIN / OPERATIONS</p>
        <h1 id="overview-title">Make every move<br /><em>count.</em></h1>
        <p>Your command center for applications, people, and the decisions that keep opportunities moving.</p>
        <div className="ops-heading-actions">
          <Link href="/admin/applications" className="ops-button-light">Open applications <ArrowRight size={17} aria-hidden="true" /></Link>
          <Link href="/admin/internships/new" className="ops-button-outline"><Plus size={16} aria-hidden="true" /> New internship</Link>
        </div>
      </div>
      <div className="ops-priority">
        <div className="ops-priority-top"><span><CircleDot size={15} aria-hidden="true" /> ACTION REQUIRED</span><span>01 / REVIEW QUEUE</span></div>
        <strong className="ops-priority-number tnum">{newCount.toLocaleString("en-SG")}</strong>
        <h2>New {newCount === 1 ? "application" : "applications"} waiting</h2>
        <p>{newCount > 0 ? "Fresh submissions are ready for your team's first review." : "No new submissions to review right now."}</p>
        <Link href="/admin/applications?status=New">Go to review queue <ArrowRight size={18} aria-hidden="true" /></Link>
        <div className="ops-priority-foot"><span>{inReviewCount.toLocaleString("en-SG")} in review</span><Link href="/admin/applications?rereview=1">Re-review requests <ChevronRight size={15} aria-hidden="true" /></Link></div>
      </div>
      <div className="ops-masthead-orbit" aria-hidden="true" />
    </section>

    <section className="ops-metrics-section" aria-labelledby="ops-pulse-heading">
      <div className="ops-section-line"><div><span className="ops-label">THE PLATFORM AT A GLANCE</span><h2 id="ops-pulse-heading">Platform pulse</h2></div><span className="ops-context">Live from your records</span></div>
      <div className="ops-metrics">
        {metrics.map(({ title, value, href, icon: Icon, detail }) => <Link href={href} key={title} className="ops-metric">
          <div className="ops-metric-head"><span>{title}</span><Icon size={18} strokeWidth={1.7} aria-hidden="true" /></div>
          <strong className="tnum">{value.toLocaleString("en-SG")}</strong>
          <div className="ops-metric-foot"><span>{detail}</span><ArrowRight size={15} aria-hidden="true" /></div>
        </Link>)}
      </div>
    </section>

    <div className="ops-main-grid">
      <section className="ops-panel ops-pipeline" aria-labelledby="ops-pipeline-title">
        <div className="ops-panel-head"><div><span className="ops-label">FROM SUBMISSION TO OUTCOME</span><h2 id="ops-pipeline-title">Application pipeline</h2></div><Link href="/admin/applications" className="ops-text-link">All records <ArrowRight size={16} aria-hidden="true" /></Link></div>
        <div className="ops-pipeline-total"><strong className="tnum">{totalApplications.toLocaleString("en-SG")}</strong><span>submitted applications across the six lifecycle stages</span></div>
        <div className="ops-stage-list">
          {stages.map(({ label, href, color }) => {
            const value = overview.statusCounts[label] ?? 0;
            return <Link key={label} href={href} className="ops-stage">
              <span className="ops-stage-name"><span className={`ops-stage-dot ops-stage-${color}`} />{label}</span>
              <span className="ops-stage-track" role="img" aria-label={`${value} applications in ${label}`}><span className={`ops-stage-fill ops-stage-${color}`} style={{ width: `${(value / maxStage) * 100}%` }} /></span>
              <strong className="tnum">{value}</strong><ChevronRight size={15} aria-hidden="true" />
            </Link>;
          })}
        </div>
        {totalApplications === 0 && <p className="ops-empty-note">The pipeline will populate as students submit applications.</p>}
      </section>

      <aside className="ops-side-stack">
        <section className="ops-briefing" aria-labelledby="ops-briefing-title">
          <div className="ops-briefing-icon"><Bell size={20} aria-hidden="true" /></div>
          <span className="ops-label">STAY IN THE KNOW</span>
          <h2 id="ops-briefing-title">Your briefing</h2>
          <div className="ops-briefing-count"><strong className="tnum">{overview.unreadNotifications}</strong><span>unread {overview.unreadNotifications === 1 ? "notification" : "notifications"}</span></div>
          <p>{overview.unreadNotifications > 0 ? "There are new updates in your notification inbox." : "All caught up. New updates will appear as they arrive."}</p>
          <Link href="/admin/notifications?unread=1">Open notifications <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
        <section className="ops-shortcuts" aria-label="Common tasks">
          <div className="ops-shortcuts-heading"><ClipboardList size={18} aria-hidden="true" /><span>QUICK PATHS</span></div>
          <Link href="/admin/applications?rereview=1">Applications needing re-review <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link href="/admin/placements/new">Record a placement <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link href="/admin/contacts">Open contact inbox <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      </aside>
    </div>

    <section className="ops-panel ops-submissions" aria-labelledby="ops-submissions-title">
      <div className="ops-panel-head"><div><span className="ops-label">THE LATEST ARRIVALS</span><h2 id="ops-submissions-title">Recent submissions</h2></div><Link href="/admin/applications" className="ops-text-link">View applications <ArrowRight size={16} aria-hidden="true" /></Link></div>
      {recentApplications.rows.length > 0 ? <>
        <div className="ops-table-scroll">
          <table className="ops-table" aria-label="Recent application submissions">
            <thead><tr><th scope="col">Applicant</th><th scope="col">Opportunity</th><th scope="col">Current stage</th><th scope="col">Submitted</th><th scope="col"><span className="sr-only">Open</span></th></tr></thead>
            <tbody>{recentApplications.rows.map(({ application, internshipTitle }) => <tr key={application.id}>
              <td><div className="ops-applicant"><span className="ops-applicant-avatar" aria-hidden="true">{application.firstName.slice(0, 1)}{application.lastName.slice(0, 1)}</span><span><Link href={`/admin/applications/${application.id}`}>{application.firstName} {application.lastName}</Link><small>{application.email}</small></span></div></td>
              <td className="ops-table-opportunity">{internshipTitle}</td>
              <td><StatusBadge status={application.lifecycleStatus} /></td>
              <td className="ops-table-date tnum">{application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
              <td><Link href={`/admin/applications/${application.id}`} className="ops-table-action" aria-label={`Open ${application.firstName} ${application.lastName}'s application`}><ArrowRight size={17} /></Link></td>
            </tr>)}</tbody>
          </table>
        </div>
      </> : <div className="ops-records-empty"><FileText size={25} aria-hidden="true" /><div><h3>No submissions just yet</h3><p>As students apply, their newest submissions will land here for review.</p></div><Link href="/admin/internships">Manage internships <ArrowRight size={15} aria-hidden="true" /></Link></div>}
    </section>

    <div className="ops-bottom-grid">
      <section className="ops-panel ops-activity" aria-labelledby="ops-activity-title">
        <div className="ops-panel-head"><div><span className="ops-label">THE OPERATIONS TRAIL</span><h2 id="ops-activity-title">Recent activity</h2></div><Activity size={18} aria-hidden="true" /></div>
        {audit.length > 0 ? <ol className="ops-activity-list">{audit.map(event => <li key={event.id}><span className="ops-activity-dot" aria-hidden="true" /><div><strong>{event.action}</strong><span>{event.entityType} · {String(event.entityId).slice(0, 8)}</span></div><time dateTime={new Date(event.createdAt).toISOString()} className="tnum">{new Date(event.createdAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short" })}</time></li>)}</ol> : <div className="ops-activity-empty"><Clock3 size={21} aria-hidden="true" /><p>Changes to applications and records will show up here.</p></div>}
      </section>
      <section className="ops-panel ops-placement-summary" aria-labelledby="ops-placements-title">
        <div className="ops-panel-head"><div><span className="ops-label">BEYOND THE APPLICATION</span><h2 id="ops-placements-title">Placements</h2></div><Link href="/admin/placements" className="ops-text-link">Manage <ArrowRight size={16} aria-hidden="true" /></Link></div>
        <div className="ops-placement-total"><strong className="tnum">{totalPlacements}</strong><span>recorded placements</span></div>
        {Object.keys(overview.placementCounts).length > 0 ? <ul className="ops-placement-statuses">{Object.entries(overview.placementCounts).map(([status, value]) => <li key={status}><StatusBadge status={status} /><strong className="tnum">{value}</strong></li>)}</ul> : <p className="ops-empty-note">Placement status details will appear as records are added.</p>}
        <Link href="/admin/placements/new" className="ops-placement-action"><Plus size={16} aria-hidden="true" /> New placement <ArrowRight size={16} aria-hidden="true" /></Link>
      </section>
    </div>
  </div>;
}
