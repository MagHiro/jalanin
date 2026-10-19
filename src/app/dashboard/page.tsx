import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, FilePenLine, MapPin, MoveUpRight } from "lucide-react";
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


  return <div className="workspace-overview">
    <section className="workspace-welcome" aria-labelledby="journey-title"><div><p className="workspace-kicker">A little progress, every day</p><h1 id="journey-title">Your journey,<br /><span>taking shape.</span></h1><p className="workspace-intro">From your first application to your next big opportunity.<br className="hidden md:block" /> Here’s where it all comes together.</p></div><Link href="/opportunities" className="btn btn-primary">Find internships <ArrowUpRight size={18} /></Link></section>

    <section aria-label="Your journey at a glance" className="workspace-stat-strip workspace-student-stats">{[
      { value: submitted.length, label: "Applications", href: "/dashboard/applications" },
      { value: drafts.length, label: "Saved drafts", href: "/dashboard/applications" },
      { value: studentPlacements.length, label: "Placements", href: "/dashboard/placements" },
    ].map(stat => <Link key={stat.label} href={stat.href} className="workspace-stat"><span className="workspace-stat-label">{stat.label}<ArrowUpRight size={16} /></span><strong className="tnum">{stat.value}</strong></Link>)}</section>

    {submitted.length > 0 && <section className="workspace-section workspace-progress" aria-labelledby="status-distribution-title">
      <div className="workspace-section-heading"><div><p className="workspace-kicker">At a glance / Progress</p><h2 id="status-distribution-title">Application status</h2></div><Link href="/dashboard/applications" className="workspace-text-link">All applications <ArrowRight size={16} /></Link></div>
      <div className="workspace-progress-grid">
        {Object.entries(statusCounts).map(([status, value]) => <Link href="/dashboard/applications" key={status} className="workspace-progress-item">
          <div className="workspace-progress-item-top"><StatusBadge status={status} /><strong className="tnum">{value}</strong></div>
          <div className="workspace-progress-track" aria-label={`${value} applications are ${status}`}><span style={{ width: `${(value / highestStatusCount) * 100}%` }} /></div>
        </Link>)}
      </div>
    </section>}

    <section className="workspace-priority" aria-labelledby="next-step-title"><div className="workspace-priority-icon"><MoveUpRight size={27} strokeWidth={1.5} /></div><div><p className="workspace-kicker">Your next step</p><h2 id="next-step-title">{drafts.length > 0 ? "Pick up where you left off." : submitted.length > 0 ? "Good things are in motion." : "Possibility starts with a first step."}</h2><p>{drafts.length > 0 ? "Your saved application is ready when you are. Take a moment to finish the details." : submitted.length > 0 ? "Follow your application updates below. Quotations arrive by email, and your status is shown here." : "Explore internships, find your fit, and start an application. You can save a draft along the way."}</p></div><Link href={drafts.length > 0 ? `/apply/${drafts[0].application.internshipId}` : submitted.length > 0 ? "/dashboard/applications" : "/opportunities"} className="btn btn-primary">{drafts.length > 0 ? "Resume draft" : submitted.length > 0 ? "View applications" : "Explore internships"}<ArrowRight size={17} /></Link></section>

    <section aria-labelledby="apps-h" className="workspace-section"><div className="workspace-section-heading"><div><p className="workspace-kicker">01 / In motion</p><h2 id="apps-h">Your applications <span className="workspace-heading-count tnum">{submitted.length}</span></h2></div><Link href="/dashboard/applications" className="workspace-text-link">View all <ArrowRight size={16} /></Link></div>
      {submitted.length === 0 ? <div className="workspace-quiet-empty"><FilePenLine size={28} strokeWidth={1.5} /><h3>{drafts.length > 0 ? "Your first submission is still ahead." : "A world of opportunity awaits."}</h3><p>{drafts.length > 0 ? "Finish a saved draft to send it for review. Submitted applications will appear here." : "When you apply, you’ll have a clear view of every update, right here."}</p><Link href={drafts.length > 0 ? `/apply/${drafts[0].application.internshipId}` : "/opportunities"} className="workspace-text-link">{drafts.length > 0 ? "Resume application" : "Find your opportunity"}<ArrowUpRight size={16} /></Link></div> : <ul className="workspace-application-list">{submitted.slice(0, 4).map(({ application, internshipTitle, internshipCity, internshipCountry }) => <li key={application.id}><div className="workspace-record-icon"><BriefcaseBusiness size={22} strokeWidth={1.5} /></div><div className="workspace-record-body"><h3><Link href={`/dashboard/applications/${application.id}`}>{internshipTitle}</Link></h3><p><MapPin size={14} />{internshipCity}, {internshipCountry}</p>{application.needsReReview && <span className="badge badge-rereview mt-2">Updated — re-review required</span>}</div><StatusBadge status={application.lifecycleStatus} /><Link href={`/dashboard/applications/${application.id}`} className="workspace-record-action" aria-label={`View details for ${internshipTitle}`}><ArrowUpRight size={19} /></Link></li>)}</ul>}
      {drafts.length > 0 && <div className="workspace-drafts"><h3><FilePenLine size={18} /> Saved for later <span className="tnum">{drafts.length}</span></h3><ul>{drafts.map(({ application, internshipTitle }) => <li key={application.id}><span>{internshipTitle}<span className="badge badge-draft ml-3">Draft</span></span><Link href={`/apply/${application.internshipId}`} className="workspace-text-link">Resume <ArrowRight size={16} /></Link></li>)}</ul></div>}
    </section>

    <div className="workspace-bottom-grid"><section aria-labelledby="placements-h" className="workspace-section"><div className="workspace-section-heading"><div><p className="workspace-kicker">02 / The next chapter</p><h2 id="placements-h">Your placements <span className="workspace-heading-count tnum">{studentPlacements.length}</span></h2></div><Link href="/dashboard/placements" className="workspace-text-link">View all <ArrowRight size={16} /></Link></div>{studentPlacements.length === 0 ? <div className="workspace-quiet-empty"><BriefcaseBusiness size={28} strokeWidth={1.5} /><h3>Something to look forward to.</h3><p>When our team arranges a placement for you, its details and progress will appear here.</p></div> : <ul className="workspace-placement-list">{studentPlacements.slice(0, 4).map(p => <li key={p.id}><StatusBadge status={p.placementStatus} /><h3>{p.role}</h3><p>{p.organization}</p>{(p.startDate || p.endDate) && <p className="tnum text-sm">{p.startDate ?? "Start date to be confirmed"} — {p.endDate ?? "End date to be confirmed"}</p>}</li>)}</ul>}</section><aside className="workspace-note"><MoveUpRight size={28} strokeWidth={1.5} /><p className="workspace-kicker">Made for your next move</p><h2>A new perspective.<br />A new possibility.</h2><p>Take a look at internships across Southeast Asia. Your next chapter might be closer than you think.</p><Link href="/opportunities" className="workspace-text-link">Browse internships <ArrowUpRight size={17} /></Link></aside></div>
  </div>;
}

export const dynamic = "force-dynamic";
