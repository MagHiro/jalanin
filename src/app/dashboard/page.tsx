import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, Check, Compass, FilePenLine, MapPin, MoveUpRight, Sparkles } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/require";
import { listStudentApplications } from "@/features/applications/service";
import { statusGuidanceFor, RE_REVIEW_GUIDANCE } from "@/lib/workflow/status-guidance";
import { db } from "@/lib/db/client";
import { placements } from "@/lib/db/schema";
import { StatusBadge } from "@/components/ui/status-badge";

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

  const milestones = [
    { number: "01", title: "Explore", detail: "Find your direction", achieved: apps.length > 0, href: "/opportunities" },
    { number: "02", title: "Apply", detail: "Put yourself forward", achieved: submitted.length > 0, href: "/dashboard/applications" },
    { number: "03", title: "Placement", detail: "See what comes next", achieved: studentPlacements.length > 0, href: "/dashboard/placements" },
  ];

  return <div className="journey-overview">
    <section className="journey-masthead" aria-labelledby="dashboard-title">
      <div className="journey-introduction">
        <div className="journey-eyebrow"><span className="journey-eyebrow-line" /> YOUR JALANIN JOURNEY</div>
        <h1 id="dashboard-title">The next chapter<br /><em>starts here.</em></h1>
        <p>From the first opportunity to your placement, everything you need to keep moving is right here.</p>
        <Link href="/opportunities" className="journey-quiet-link">Discover opportunities <MoveUpRight size={17} aria-hidden="true" /></Link>
      </div>
      <div className="journey-focus">
        <div className="journey-focus-top"><span className="journey-focus-marker"><Sparkles size={17} aria-hidden="true" /></span><span>YOUR NEXT MOVE</span><span className="journey-focus-index">01 / 03</span></div>
        <span className="journey-focus-eyebrow">{nextMove.eyebrow}</span>
        <h2>{nextMove.title}</h2>
        <p>{nextMove.description}</p>
        <Link href={nextMove.href} className="journey-primary-link">{nextMove.label}<ArrowRight size={18} aria-hidden="true" /></Link>
        <div className="journey-focus-decoration" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </section>

    <section className="journey-path-panel" aria-labelledby="journey-path-title">
      <div className="journey-section-top">
        <div><span className="journey-label">THE BIG PICTURE</span><h2 id="journey-path-title">Your journey, in motion.</h2></div>
        <span className="journey-caption">Every step counts.</span>
      </div>
      <ol className="journey-path">
        {milestones.map((step, index) => <li key={step.number} className={step.achieved ? "is-reached" : ""}>
          <Link href={step.href} className="journey-path-step">
            <span className="journey-path-marker" aria-hidden="true">{step.achieved ? <Check size={18} strokeWidth={2.5} /> : step.number}</span>
            <span className="journey-path-text"><strong>{step.title}</strong><small>{step.detail}</small></span>
            <span className="journey-path-state">{step.achieved ? "On record" : index === 0 && apps.length === 0 ? "Start here" : "Ahead"}</span>
          </Link>
        </li>)}
      </ol>
      <div className="journey-metrics" aria-label="Your activity at a glance">
        <Link href="/dashboard/applications?view=submitted" className="journey-metric"><strong className="tnum">{submitted.length}</strong><span>Applications sent</span><ArrowRight size={15} aria-hidden="true" /></Link>
        <Link href="/dashboard/applications?view=drafts" className="journey-metric"><strong className="tnum">{drafts.length}</strong><span>Saved drafts</span><ArrowRight size={15} aria-hidden="true" /></Link>
        <Link href="/dashboard/placements" className="journey-metric"><strong className="tnum">{studentPlacements.length}</strong><span>Placements</span><ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
    </section>

    <div className="journey-content-grid">
      <section className="journey-paper-card journey-applications" aria-labelledby="journey-applications-title">
        <div className="journey-section-top"><div><span className="journey-label">IN YOUR CORNER</span><h2 id="journey-applications-title">Applications in progress</h2></div><Link href="/dashboard/applications" className="journey-view-all">View all <ArrowRight size={16} aria-hidden="true" /></Link></div>
        {apps.length > 0 ? <ul className="journey-records">
          {apps.slice(0, 4).map(({ application, internshipTitle, internshipCity, internshipCountry }) => {
            const href = application.isDraft ? `/apply/${application.internshipId}` : `/dashboard/applications/${application.id}`;
            const guidance = application.isDraft
              ? statusGuidanceFor("Draft")
              : application.needsReReview
                ? RE_REVIEW_GUIDANCE
                : statusGuidanceFor(application.lifecycleStatus);
            return <li key={application.id}>
              <Link href={href} className="journey-record">
                <span className="journey-record-symbol" aria-hidden="true">{application.isDraft ? <FilePenLine size={19} /> : <BriefcaseBusiness size={19} />}</span>
                <span className="journey-record-main"><strong>{internshipTitle}</strong><small><MapPin size={13} aria-hidden="true" /> {internshipCity}, {internshipCountry}</small><small className="journey-record-guidance">{guidance.actionRequired ? guidance.action : "No action required"}</small></span>
                <span className="journey-record-end"><StatusBadge status={application.isDraft ? "Draft" : application.lifecycleStatus} />{application.needsReReview && <small className="journey-review-note">Re-review needed</small>}</span>
                <ArrowRight className="journey-record-arrow" size={17} aria-hidden="true" />
              </Link>
            </li>;
          })}
        </ul> : <div className="journey-empty">
          <span className="journey-empty-icon"><Compass size={24} /></span>
          <h3>No applications yet. That’s okay.</h3>
          <p>Your first opportunity is out there. When you apply, you’ll be able to follow it here.</p>
          <Link href="/opportunities">Browse internships <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>}
      </section>

      <aside className="journey-side-column">
        <section className="journey-destination-card" aria-labelledby="journey-destination-title">
          <div className="journey-destination-art" aria-hidden="true"><span className="journey-art-orbit journey-art-orbit-one" /><span className="journey-art-orbit journey-art-orbit-two" /><span className="journey-art-pin"><MapPin size={23} /></span><span className="journey-art-star">✳</span></div>
          <span className="journey-label">WHERE YOU&apos;RE HEADED</span>
          <h2 id="journey-destination-title">{studentPlacements.length > 0 ? "Your placement story." : "Good things take shape."}</h2>
          {studentPlacements.length > 0 ? <><p>Here’s the latest placement recorded for you.</p><div className="journey-destination-record"><strong>{studentPlacements[0].role}</strong><span>{studentPlacements[0].organization}</span><StatusBadge status={studentPlacements[0].placementStatus} /></div></> : <p>When your team arranges a placement, the details and next steps will appear here.</p>}
          <Link href="/dashboard/placements">View placements <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
        <div className="journey-help"><span>NEED A HAND?</span><p>Questions along the way? We’re here to help you figure out your next step.</p><Link href="/#contact">Get in touch <MoveUpRight size={16} aria-hidden="true" /></Link></div>
      </aside>
    </div>
  </div>;
}
