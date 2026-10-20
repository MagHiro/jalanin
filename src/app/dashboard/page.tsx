import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, MapPin, MoveUpRight } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/require";
import { listStudentApplications } from "@/features/applications/service";
import { statusGuidanceFor, RE_REVIEW_GUIDANCE } from "@/lib/workflow/status-guidance";
import { db } from "@/lib/db/client";
import { placements } from "@/lib/db/schema";
import { StatusBadge } from "@/components/ui/status-badge";
import { OverviewMotion } from "@/components/motion/overview-motion";
import "./overview.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const [apps, studentPlacements] = await Promise.all([
    listStudentApplications(user.id),
    db.select().from(placements).where(eq(placements.studentUserId, user.id)).orderBy(desc(placements.updatedAt)),
  ]);
  const drafts = apps.filter(({ application }) => application.isDraft);
  const submitted = apps.filter(({ application }) => !application.isDraft);
  const revisions = submitted.filter(({ application }) => application.needsReReview);
  const leadDraft = drafts[0];
  const leadRevision = revisions[0];

  const nextMove = leadRevision
    ? { eyebrow: "A change to revisit", title: "An application needs another look.", description: "Review your updated application details and follow its latest status.", href: `/dashboard/applications/${leadRevision.application.id}`, label: "Review application" }
    : leadDraft
      ? { eyebrow: "Pick up where you left off", title: "Your application is waiting for you.", description: `Continue your application for ${leadDraft.internshipTitle}. Your saved draft has not been submitted.`, href: `/apply/${leadDraft.application.internshipId}`, label: "Continue draft" }
      : studentPlacements.length > 0
        ? { eyebrow: "Your next destination", title: "Keep your placement in view.", description: "Find your recorded placement details, dates and current status in one place.", href: "/dashboard/placements", label: "View placement" }
        : submitted.length > 0
          ? { eyebrow: "Stay in the loop", title: "Your applications are on their way.", description: "Follow each status as the team reviews your submissions. Quotation details arrive by email.", href: "/dashboard/applications", label: "Track applications" }
          : { eyebrow: "A good place to begin", title: "Find a role worth exploring.", description: "Discover internship opportunities across Southeast Asia and start your journey at your own pace.", href: "/opportunities", label: "Explore internships" };

  const latestPlacement = studentPlacements[0];

  return <OverviewMotion>
    <section className="next-focus" aria-labelledby="dashboard-title">
      <span className="next-eyebrow" data-overview-intro>Your next move</span>
      <h1 id="dashboard-title" data-overview-intro>{nextMove.title}</h1>
      <p data-overview-intro>{nextMove.description}</p>
      <div data-overview-intro><Link href={nextMove.href} className="next-primary">{nextMove.label}<ArrowRight size={18} aria-hidden="true" /></Link></div>
    </section>

    <nav className="next-metrics" aria-label="Your activity at a glance" data-overview-support>
      <Link href="/dashboard/applications?view=submitted"><strong>{submitted.length}</strong><span>Applications sent</span><ArrowRight size={16} aria-hidden="true" /></Link>
      <Link href="/dashboard/applications?view=drafts"><strong>{drafts.length}</strong><span>Saved drafts</span><ArrowRight size={16} aria-hidden="true" /></Link>
      <Link href="/dashboard/placements"><strong>{studentPlacements.length}</strong><span>Placements</span><ArrowRight size={16} aria-hidden="true" /></Link>
    </nav>

    <section className="next-applications" aria-labelledby="next-applications-title" data-overview-support>
        <div className="next-section-heading"><h2 id="next-applications-title">Applications in progress</h2><Link href="/dashboard/applications">View all <ArrowRight size={16} aria-hidden="true" /></Link></div>
        {apps.length > 0 ? <ul className="next-records">
          {apps.slice(0, 4).map(({ application, internshipTitle, internshipCity, internshipCountry }) => {
            const href = application.isDraft ? `/apply/${application.internshipId}` : `/dashboard/applications/${application.id}`;
            const guidance = application.isDraft
              ? statusGuidanceFor("Draft")
              : application.needsReReview
                ? RE_REVIEW_GUIDANCE
                : statusGuidanceFor(application.lifecycleStatus);
            return <li key={application.id}>
               <Link href={href} className="next-record">
                 <span className="next-record-main"><strong>{internshipTitle}</strong><span className="next-record-location"><MapPin size={14} aria-hidden="true" /> {internshipCity}, {internshipCountry}</span><span className="next-record-guidance">{guidance.actionRequired ? guidance.action : "No action required"}</span></span>
                 <span className="next-record-end"><StatusBadge status={application.isDraft ? "Draft" : application.lifecycleStatus} />{application.needsReReview && <span className="next-review-note">Re-review needed</span>}</span>
                 <ArrowRight className="next-record-arrow" size={18} aria-hidden="true" />
              </Link>
            </li>;
          })}
        </ul> : <div className="next-empty">
          <BriefcaseBusiness size={25} strokeWidth={1.4} aria-hidden="true" />
          <h3>A little space for what’s next.</h3>
          <p>No applications yet. Once you start, your drafts and submitted applications will appear here.</p>
          <Link href="/opportunities">Explore internships <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>}
    </section>

    <div className="next-bottom" data-overview-support>
      <section className="next-placement" aria-labelledby="next-placement-title">
        <div><h2 id="next-placement-title">Your placement</h2>
          {latestPlacement ? <div className="next-placement-record"><strong>{latestPlacement.role}</strong><span>{latestPlacement.organization}</span><StatusBadge status={latestPlacement.placementStatus} /></div> : <p>When the team records a placement for you, you’ll find the details here.</p>}
          <Link href="/dashboard/placements">View placements <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>
      <aside className="next-help"><span>Here when you need us.</span><Link href="/#contact">Get in touch <MoveUpRight size={16} aria-hidden="true" /></Link></aside>
    </div>
  </OverviewMotion>;
}
