import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Compass, FilePenLine, MapPin } from "lucide-react";
import { getSessionUser } from "@/lib/auth/require";
import { listStudentApplications } from "@/features/applications/service";
import { db } from "@/lib/db/client";
import { placements } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard");
  const apps = await listStudentApplications(user.id);
  const studentPlacements = await db.select().from(placements).where(eq(placements.studentUserId, user.id)).orderBy(desc(placements.updatedAt));
  const drafts = apps.filter(a => a.application.isDraft);
  const submitted = apps.filter(a => !a.application.isDraft);
  const statusCounts = submitted.reduce<Record<string, number>>((counts, { application }) => {
    counts[application.lifecycleStatus] = (counts[application.lifecycleStatus] ?? 0) + 1;
    return counts;
  }, {});
  const highestStatusCount = Math.max(1, ...Object.values(statusCounts));
  const statistics = [
    { label: "Applications", value: submitted.length, caption: "Submitted for review", href: "/dashboard/applications", icon: BriefcaseBusiness },
    { label: "Saved drafts", value: drafts.length, caption: "Continue when ready", href: "/dashboard/applications", icon: FilePenLine },
    { label: "Placements", value: studentPlacements.length, caption: "Your recorded placements", href: "/dashboard/placements", icon: CheckCircle2 },
  ];
  const nextHref = drafts.length > 0 ? `/apply/${drafts[0].application.internshipId}` : submitted.length > 0 ? "/dashboard/applications" : "/opportunities";
  const nextLabel = drafts.length > 0 ? "Resume application" : submitted.length > 0 ? "View applications" : "Explore internships";

  return <div className="workspace-overview">
    <section className="workspace-page-heading workspace-hero workspace-student-hero" aria-labelledby="dashboard-title">
      <div><p className="workspace-kicker">My workspace / Overview</p><h1 id="dashboard-title">My dashboard</h1><p className="workspace-intro">One place for the opportunities you’ve found, the applications you’ve sent, and the steps ahead.</p></div>
      <div className="workspace-hero-aside"><span>YOUR JOURNEY SO FAR</span><strong className="tnum">{apps.length} {apps.length === 1 ? "application" : "applications"} on file</strong><Link href="/opportunities" className="btn btn-primary"><Compass size={17} /> Browse internships</Link></div>
    </section>

    <section aria-label="Your journey at a glance" className="workspace-stat-strip workspace-student-stats">
      {statistics.map(({ label, value, caption, href, icon: Icon }) => <Link key={label} href={href} className="workspace-stat">
        <div className="workspace-stat-label"><span>{label}</span><span className="workspace-stat-icon"><Icon size={18} strokeWidth={1.8} /></span></div>
        <strong className="tnum">{value}</strong>
        <span className="workspace-stat-caption">{caption}</span>
      </Link>)}
    </section>

    <div className="workspace-main-grid">
      <section className="workspace-data-card workspace-recent-applications" aria-labelledby="apps-heading">
        <div className="workspace-panel-heading"><div><p className="workspace-kicker">Applications</p><h2 id="apps-heading">Recent applications</h2></div><Link href="/dashboard/applications" className="workspace-text-link">View all <ArrowRight size={15} /></Link></div>
        {submitted.length > 0 ? <ul className="workspace-application-list">
          {submitted.slice(0, 4).map(({ application, internshipTitle, internshipCity, internshipCountry }) => <li key={application.id}>
            <span className="workspace-record-icon"><BriefcaseBusiness size={19} /></span>
            <div className="workspace-record-body"><h3><Link href={`/dashboard/applications/${application.id}`}>{internshipTitle}</Link></h3><p><MapPin size={13} /> {internshipCity}, {internshipCountry}</p>{application.needsReReview && <span className="badge badge-rereview mt-1">Updated — re-review required</span>}</div>
            <div className="workspace-record-status"><StatusBadge status={application.lifecycleStatus} /><Link href={`/dashboard/applications/${application.id}`} className="workspace-text-link">Details</Link></div>
          </li>)}
        </ul> : <div className="workspace-inline-empty"><FilePenLine size={22} /><strong>{drafts.length ? "Your applications are in progress" : "Ready to get started?"}</strong><p>{drafts.length ? "Complete a saved draft to submit it for review." : "Find an internship that feels right, then track every step here."}</p><Link href={nextHref} className="workspace-text-link">{nextLabel} <ArrowRight size={14} /></Link></div>}
        {drafts.length > 0 && <div className="workspace-drafts"><p><FilePenLine size={16} /> {drafts.length} saved draft{drafts.length === 1 ? "" : "s"}</p><Link className="workspace-text-link" href={`/apply/${drafts[0].application.internshipId}`}>Continue <ArrowRight size={14} /></Link></div>}
      </section>

      <section className="workspace-data-card workspace-queue-card" aria-labelledby="next-heading">
        <div className="workspace-panel-heading"><div><p className="workspace-kicker">Next steps</p><h2 id="next-heading">What’s next?</h2></div><span className="workspace-panel-icon"><Compass size={20} /></span></div>
        <p className="workspace-queue-title">{drafts.length > 0 ? "You have a draft to finish" : submitted.length > 0 ? "Keep track of your progress" : "Start your internship journey"}</p>
        <p className="workspace-panel-copy">{drafts.length > 0 ? "Your saved application is ready. Finish the details and submit when you’re comfortable." : submitted.length > 0 ? "Check application statuses here. Quotations are sent by email when prepared." : "Explore available opportunities across Southeast Asia and apply to a role that fits your goals."}</p>
        <div className="workspace-queue-actions"><Link href={nextHref} className="btn btn-primary">{nextLabel} <ArrowRight size={15} /></Link></div>
      </section>
    </div>

    {submitted.length > 0 && <section className="workspace-data-card workspace-progress-card" aria-labelledby="status-heading">
      <div className="workspace-panel-heading"><div><p className="workspace-kicker">Your progress</p><h2 id="status-heading">Application status</h2></div><Link href="/dashboard/applications" className="workspace-text-link">All applications <ArrowRight size={15} /></Link></div>
      <div className="workspace-progress-grid">
        {Object.entries(statusCounts).map(([status, value]) => <div key={status} className="workspace-progress-item">
          <div className="workspace-progress-item-top"><StatusBadge status={status} /><strong className="tnum">{value}</strong></div>
          <div className="workspace-progress-track" role="img" aria-label={`${value} applications are ${status}`}><span style={{ width: `${(value / highestStatusCount) * 100}%` }} /></div>
        </div>)}
      </div>
    </section>}

    <section className="workspace-data-card workspace-placements-card" aria-labelledby="placements-heading">
      <div className="workspace-panel-heading"><div><p className="workspace-kicker">Placements</p><h2 id="placements-heading">Placement updates</h2></div><Link href="/dashboard/placements" className="workspace-text-link">View all <ArrowRight size={15} /></Link></div>
      {studentPlacements.length > 0 ? <ul className="workspace-placement-list">
        {studentPlacements.slice(0, 4).map(p => <li key={p.id}><div><h3>{p.role}</h3><p>{p.organization}{p.startDate && ` · ${p.startDate}`}</p></div><StatusBadge status={p.placementStatus} /></li>)}
      </ul> : <div className="workspace-inline-empty workspace-inline-empty-horizontal"><BriefcaseBusiness size={21} /><div><strong>Placements will appear here</strong><p>Your team-managed placement details will be available as soon as a placement is arranged.</p></div><Link href="/dashboard/applications" className="workspace-text-link">View applications <ArrowRight size={14} /></Link></div>}
    </section>
  </div>;
}

export const dynamic = "force-dynamic";
