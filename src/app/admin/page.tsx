import Link from "next/link";
import type { Metadata } from "next";
import { Activity, ArrowRight, ArrowRightLeft, Bell, BriefcaseBusiness, CheckCircle2, ChevronRight, CircleDot, ClipboardList, Clock3, FileCheck2, FilePenLine, FileText, Plus, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { getAdminOverview, listAdminApplications, recentAudit } from "@/features/admin/service";
import { StatusBadge } from "@/components/ui/status-badge";
import { adminActivityHref, describeAdminActivity } from "@/lib/ui/admin-activity";

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
        <p className="ops-eyebrow">Operations</p>
        <h1 id="overview-title">Overview</h1>
        <p>Manage applications, opportunities and people.</p>
        <div className="ops-heading-actions">
          <Link href="/admin/applications" className="ops-button-light">Open applications <ArrowRight size={17} aria-hidden="true" /></Link>
          <Link href="/admin/internships/new" className="ops-button-outline"><Plus size={16} aria-hidden="true" /> New internship</Link>
        </div>
      </div>
      <div className="ops-priority">
        <div className="ops-priority-top"><span>Review queue</span></div>
        <strong className="ops-priority-number tnum">{newCount.toLocaleString("en-SG")}</strong>
        <h2>New {newCount === 1 ? "application" : "applications"}</h2>
        <p>{newCount > 0 ? "Fresh submissions are ready for your team's first review." : "No new submissions to review right now."}</p>
        <Link href="/admin/applications?status=New">Go to review queue <ArrowRight size={18} aria-hidden="true" /></Link>
        <div className="ops-priority-foot"><span>{inReviewCount.toLocaleString("en-SG")} in review</span><Link href="/admin/applications?rereview=1">Re-review requests <ChevronRight size={15} aria-hidden="true" /></Link></div>
      </div>
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
        <ul className="ops-mobile-records" aria-label="Recent application submissions">
          {recentApplications.rows.map(({ application, internshipTitle }) => <li key={application.id}>
            <Link href={`/admin/applications/${application.id}`} className="ops-mobile-record">
              <span className="ops-mobile-record-main">
                <strong>{application.firstName} {application.lastName}</strong>
                <span>{internshipTitle}</span>
                <small>{application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" }) : "Not submitted"}</small>
              </span>
              <span className="ops-mobile-record-end"><StatusBadge status={application.lifecycleStatus} /><ArrowRight size={17} aria-hidden="true" /></span>
            </Link>
          </li>)}
        </ul>
      </> : <div className="ops-records-empty"><FileText size={25} aria-hidden="true" /><div><h3>No submissions just yet</h3><p>As students apply, their newest submissions will land here for review.</p></div><Link href="/admin/internships">Manage internships <ArrowRight size={15} aria-hidden="true" /></Link></div>}
    </section>

    <div className="ops-bottom-grid">
      <section className="ops-panel ops-activity" aria-labelledby="ops-activity-title">
        <div className="ops-panel-head">
          <div><span className="ops-label">RECENT CHANGES</span><h2 id="ops-activity-title">Recent activity</h2></div>
          <span className="ops-activity-indicator"><Activity size={15} aria-hidden="true" /> Activity log</span>
        </div>
        <p className="ops-activity-intro">A clearer view of what has changed across your workspace.</p>
        {audit.length > 0
          ? <ol className="ops-activity-list">{audit.map(event => {
            const item = describeAdminActivity(event.entityType, event.action);
            const href = adminActivityHref(event.entityType, String(event.entityId));
            const date = new Date(event.createdAt);
            return <li key={event.id} className="ops-activity-entry">
              <span className={`ops-activity-symbol ops-activity-symbol--${item.tone}`} aria-hidden="true">
                {item.tone === "transition" ? <ArrowRightLeft size={18} /> : item.tone === "submitted" ? <FileCheck2 size={18} /> : item.tone === "created" ? <Plus size={18} /> : <FilePenLine size={18} />}
              </span>
              <div className="ops-activity-details">
                <div className="ops-activity-entry-title">
                  {href ? <Link href={href}>{item.title}</Link> : <strong>{item.title}</strong>}
                  <time className="tnum" dateTime={date.toISOString()} title={date.toISOString()}>{date.toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</time>
                </div>
                <p><span>{item.detail}</span><span aria-hidden="true" className="ops-activity-separator">·</span><span className="ops-activity-reference">{event.entityType} #{String(event.entityId).slice(0, 8)}</span></p>
              </div>
              {href && <Link href={href} className="ops-activity-open" aria-label={`View ${item.title.toLowerCase()} record`}><ArrowRight size={16} /></Link>}
            </li>;
          })}</ol>
          : <div className="ops-activity-empty"><span className="ops-activity-symbol"><Clock3 size={19} /></span><div><strong>Nothing to report yet</strong><p>New submissions and record changes will show here automatically.</p></div></div>}
        <div className="ops-activity-footer"><span><span className="ops-activity-footer-dot" /> Showing the {audit.length} most recent {audit.length === 1 ? "event" : "events"}</span><span>Recorded automatically</span></div>
      </section>

      <section className="ops-panel ops-placement-summary" aria-labelledby="ops-placements-title">
        <div className="ops-panel-head">
          <div><span className="ops-label">PLACEMENT DESK</span><h2 id="ops-placements-title">Placements</h2></div>
          <Link href="/admin/placements" className="ops-text-link">View all <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        {totalPlacements > 0 ? <>
          <div className="ops-placement-total"><strong className="tnum">{totalPlacements}</strong><span>recorded {totalPlacements === 1 ? "placement" : "placements"}</span></div>
          <ul className="ops-placement-statuses">{Object.entries(overview.placementCounts).map(([status, value]) => <li key={status}><StatusBadge status={status} /><strong className="tnum">{value}</strong></li>)}</ul>
          <Link href="/admin/placements/new" className="ops-placement-action"><Plus size={16} aria-hidden="true" /> New placement <ArrowRight size={16} aria-hidden="true" /></Link>
        </> : <div className="ops-placement-empty">
          <div className="ops-placement-empty-top"><span className="ops-placement-empty-icon"><BriefcaseBusiness size={24} strokeWidth={1.7} aria-hidden="true" /></span><span className="ops-placement-empty-count tnum">0 on record</span></div>
          <h3>Your first placement starts here.</h3>
          <p>Once a placement is arranged, record the student, host organization and role to keep its details in one place.</p>
          <Link href="/admin/placements/new" className="ops-placement-action"><Plus size={16} aria-hidden="true" /> Record a placement <ArrowRight size={16} aria-hidden="true" /></Link>
          <div className="ops-placement-empty-footer"><CircleDot size={14} aria-hidden="true" /> Placement records appear here as they are added</div>
        </div>}
      </section>
    </div>
  </div>;
}
