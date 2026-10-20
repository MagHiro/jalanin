import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin, CalendarDays, Layers } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublishedInternshipBySlug, COUNTRY_NAMES } from "@/features/internships/service";
import { InternshipDetailMotion } from "@/components/motion/internship-detail-motion";
import "./detail.css";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const row = await getPublishedInternshipBySlug(params.slug);
  if (!row) return { title: "Internship not found" };
  return {
    title: row.internship.title,
    description: `${row.internship.title} in ${row.internship.city}, ${COUNTRY_NAMES[row.internship.countryCode] ?? row.internship.countryCode}. Apply with a custom quotation.`,
    alternates: { canonical: `/opportunities/${row.internship.slug}` },
  };
}

export default async function InternshipDetailPage({ params }: {
  params: { slug: string };
}) {
  // Public detail pages never expose unpublished listings (JOB-09).
  const row = await getPublishedInternshipBySlug(params.slug);
  if (!row) notFound();
  const { internship, categoryName } = row;
  const country = COUNTRY_NAMES[internship.countryCode] ?? internship.countryCode;
  const deadline = internship.applicationDeadline ? new Date(internship.applicationDeadline).toLocaleDateString("en-SG") : null;
  const sections = [
    { id: "about-placement", label: "Overview", title: "About this placement", text: internship.description },
    { id: "responsibilities", label: "Responsibilities", title: "What you’ll do", text: internship.responsibilities },
    { id: "requirements", label: "Requirements", title: "What you’ll bring", text: internship.requirements },
  ];
  const facts = [
    { label: "Location", value: `${internship.city}, ${country}`, icon: MapPin },
    { label: "Start date", value: internship.startDate, icon: CalendarDays },
    { label: "End date", value: internship.endDate, icon: CalendarDays },
    ...(categoryName ? [{ label: "Category", value: categoryName, icon: Layers }] : []),
  ];

  return <InternshipDetailMotion>
    <div className="placement-detail">
      <nav className="placement-breadcrumb" aria-label="Breadcrumb">
        <Link href="/opportunities"><ArrowLeft size={16} aria-hidden="true" /> All internships</Link>
        <span>Internship details</span>
      </nav>

      <header className="placement-hero">
        <div className="placement-hero-copy">
          <p className="placement-kicker" data-detail-reveal><span />{categoryName ?? "Internship"} · {internship.city}, {country}</p>
          <h1 data-detail-reveal>{internship.title}</h1>
          <p className="placement-intro" data-detail-reveal>An opportunity to learn by doing.</p>
          {deadline && <p className="placement-deadline" data-detail-reveal>Apply by {deadline} (informational)</p>}
          <Link href={`/apply/${internship.id}`} className="placement-button placement-hero-apply" data-detail-reveal>Apply now <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        <svg className="placement-orbit" viewBox="0 0 240 160" fill="none" aria-hidden="true" focusable="false">
          <path d="M20 120H220M60 20V145M120 20V145M180 20V145" className="placement-graphic-grid" />
          <path d="M35 120C90 120 65 40 120 40S165 100 210 35" className="placement-graphic-path" pathLength="1" />
          <circle cx="35" cy="120" r="5" /><circle cx="120" cy="40" r="5" /><circle cx="210" cy="35" r="5" />
        </svg>
        <div className="placement-heading-rule" aria-hidden="true" />
      </header>

      <div className="placement-body">
        <nav className="placement-index" aria-label="Internship sections" data-detail-reveal>
          <p>In this internship</p>
          {sections.map((section, index) => <a key={section.id} href={`#${section.id}`}><span>0{index + 1}</span>{section.label}<ArrowRight size={14} aria-hidden="true" /></a>)}
        </nav>
        <article className="placement-content" aria-label="Internship information">
          {sections.map((section, index) => <section key={section.id} aria-labelledby={section.id} data-detail-reveal>
            <span className="placement-section-number" aria-hidden="true">0{index + 1}</span>
            <div><p className="placement-section-label">{section.label}</p><h2 id={section.id}>{section.title}</h2><p className="placement-section-copy">{section.text}</p></div>
          </section>)}
        </article>

        <aside className="placement-application" aria-labelledby="apply-heading" data-detail-reveal>
          <h2 id="apply-heading">At a glance</h2>
          <dl className="placement-facts">
            {facts.map(({ label, value, icon: Icon }) => <div key={label}><Icon size={18} strokeWidth={1.5} aria-hidden="true" /><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          <div className="placement-application-action">
            <Link href={`/apply/${internship.id}`} className="placement-button">Apply now <ArrowRight size={16} aria-hidden="true" /></Link>
            <p className="placement-login-note">You will be asked to log in or create an account first.</p>
          </div>
        </aside>
      </div>

      <div className="placement-mobile-apply">
        <Link href={`/apply/${internship.id}`} className="placement-button">Apply now <ArrowRight size={18} aria-hidden="true" /></Link>
      </div>
    </div>
  </InternshipDetailMotion>;
}
