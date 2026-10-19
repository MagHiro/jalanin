import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, MapPin, CalendarDays } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPublishedInternshipBySlug,
  COUNTRY_NAMES,
} from "@/features/internships/service";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const row = await getPublishedInternshipBySlug(params.slug);
  if (!row) return { title: "Internship not found" };
  return {
    title: row.internship.title,
    description: `${row.internship.title} in ${row.internship.city}, ${COUNTRY_NAMES[row.internship.countryCode] ?? row.internship.countryCode}. Apply with a custom quotation.`,
    alternates: { canonical: `/opportunities/${row.internship.slug}` },
  };
}

export default async function InternshipDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  // Unpublished/missing slugs return 404 without leaking private data (JOB-09).
  const row = await getPublishedInternshipBySlug(params.slug);
  if (!row) notFound();
  const { internship, categoryName } = row;
  const country = COUNTRY_NAMES[internship.countryCode] ?? internship.countryCode;
  const deadline = internship.applicationDeadline
    ? new Date(internship.applicationDeadline).toLocaleDateString("en-SG")
    : null;

  return (
    <div className="learn-detail pb-24 lg:pb-0">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <article className="min-w-0">
          <nav aria-label="Breadcrumb">
            <Link href="/opportunities" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              <ArrowLeft size={16} aria-hidden="true" /> All internships
            </Link>
          </nav>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {categoryName && (
              <span className="rounded-full bg-jalanin-100 px-3 py-1 font-semibold text-jalanin-800">{categoryName}</span>
            )}
            <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
              {internship.city}, {country}
            </span>
          </div>
          <p className="eyebrow mt-10">An opportunity to learn by doing</p>
          <h1 className="section-title mt-5 max-w-2xl text-balance">
            {internship.title}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span><time>{internship.startDate}</time> → <time>{internship.endDate}</time></span>
            {deadline && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                Apply by {deadline} (informational)
              </span>
            )}
          </p>

          <div className="internship-detail-facts"><div><MapPin size={20}/><span>Based in<strong>{internship.city}, {country}</strong></span></div><div><CalendarDays size={20}/><span>Internship dates<strong>{internship.startDate} — {internship.endDate}</strong></span></div></div>
          <nav className="internship-detail-index" aria-label="Internship sections"><a href="#about-placement">01 · Overview</a><a href="#responsibilities">02 · Responsibilities</a><a href="#requirements">03 · Requirements</a></nav>
          <div className="internship-detail-content mt-10 space-y-10 border-t border-border pt-10">
            <section aria-labelledby="about-placement" className="max-w-2xl">
              <h2 id="about-placement" className="text-xl font-semibold tracking-tight text-foreground">About this placement</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-7 text-muted-foreground">{internship.description}</p>
            </section>
            <section aria-labelledby="responsibilities" className="max-w-2xl">
              <h2 id="responsibilities" className="text-xl font-semibold tracking-tight text-foreground">Responsibilities</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-7 text-muted-foreground">{internship.responsibilities}</p>
            </section>
            <section aria-labelledby="requirements" className="max-w-2xl">
              <h2 id="requirements" className="text-xl font-semibold tracking-tight text-foreground">Requirements</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-7 text-muted-foreground">{internship.requirements}</p>
            </section>
          </div>
        </article>

        {/* Application panel (JOB-07/08) */}
        <aside aria-labelledby="apply-heading" className="h-fit rounded-2xl border border-border bg-surface p-7 lg:sticky lg:top-28">
          <Compass size={30} strokeWidth={1.4} className="mb-5 text-primary" aria-hidden="true" />
          <h2 id="apply-heading" className="text-base font-semibold tracking-tight text-foreground">Apply for this internship</h2>
          <dl className="mt-4 space-y-0 text-sm">
            {[
              ["Location", `${internship.city}, ${country}`],
              ["Start", internship.startDate],
              ["End", internship.endDate],
              ...(categoryName ? [["Category", categoryName]] as Array<[string, string]> : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-border py-2.5 last:border-0">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 rounded-xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
            Jalanin will review your application and prepare a custom quotation.
            You will receive the quotation by email — no fixed prices here.
          </p>
          <Link
            href={`/apply/${internship.id}`}
            className="btn btn-primary mt-4 hidden w-full lg:inline-flex"
          >
            Apply now <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <p className="mt-3 hidden text-xs leading-5 text-muted-foreground lg:block">
            You will be asked to log in or create an account first.
          </p>
        </aside>
      </div>

      {/* Mobile apply bar: fixed CTA with safe-area padding, content offset above. */}
      <div className="mobile-cta-bar fixed inset-x-0 bottom-0 z-30 p-4 backdrop-blur-sm lg:hidden" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <Link
          href={`/apply/${internship.id}`}
          className="btn btn-primary w-full"
        >
          Apply now
        </Link>
      </div>
    </div>
  );
}
