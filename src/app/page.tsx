import Link from "next/link";
import {
  listFeaturedInternships,
  COUNTRY_NAMES,
} from "@/features/internships/service";
import { ContactForm } from "@/components/contact/contact-form";
import { InternshipCard } from "@/components/ui/internship-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/motion/reveal";

export const revalidate = 120;

// Copy contracts (tests/e2e/journeys.spec.ts + accessibility.spec.ts) pin
// these strings: "Internships across…", "How It Works", "Featured",
// "About Jalanin", "Contact us", link "Browse internships". Restyle freely,
// never rename.
export default async function LandingPage() {
  const featured = await listFeaturedInternships(6);
  return (
    <div className="space-y-20 md:space-y-28">
      {/* Hero (WEB-02) — incident.io-informed restraint, Jalanin indigo */}
      <Reveal>
        <section
          aria-labelledby="hero-heading"
          className="relative isolate grid items-center gap-10 overflow-hidden rounded-[1.5rem] border border-border bg-surface px-7 py-10 md:grid-cols-[1.08fr_.92fr] md:px-14 md:py-16"
        >
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-32 -z-10 size-[28rem] rounded-full bg-jalanin-100 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-40 -left-24 -z-10 size-80 rounded-full bg-jalanin-50 blur-3xl"
          />
          <div data-reveal>
            <p className="eyebrow">Jalanin Internships · Southeast Asia</p>
            <h1
              id="hero-heading"
              className="mt-4 max-w-xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-jalanin-950 md:text-6xl"
            >
              Internships across Southeast Asia, with personal guidance.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              Discover curated placements, apply with a real person reviewing
              every application, and receive a custom quotation by email — no
              fixed prices, no guesswork.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/opportunities" className="btn btn-primary min-h-12 px-6 text-base">
                Browse internships
              </Link>
              <Link href="/#how-it-works" className="btn btn-outline min-h-12 px-6 text-base">
                How it works
              </Link>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <dt className="sr-only">Review model</dt>
                <dd className="flex items-center gap-2">
                  <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-white">✓</span>
                  Every application reviewed by our team
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="sr-only">Pricing model</dt>
                <dd className="flex items-center gap-2">
                  <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-white">✓</span>
                  Custom quotation by email
                </dd>
              </div>
            </dl>
          </div>
          <div data-reveal className="surface-card rounded-3xl p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Your experience, supported</p>
                <p className="mt-1 text-xs text-muted-foreground">From first search to next steps</p>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-xl text-primary" aria-hidden="true">✳</span>
            </div>
            <ul className="divide-y divide-border text-sm leading-relaxed">
              <li className="flex gap-3 py-4">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">1</span>
                <span><b className="block text-foreground">Curated opportunities</b><span className="text-muted-foreground">Roles across hospitality, business, technology and creative fields.</span></span>
              </li>
              <li className="flex gap-3 py-4">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">2</span>
                <span><b className="block text-foreground">A real person reviews</b><span className="text-muted-foreground">Our team considers every application with care.</span></span>
              </li>
              <li className="flex gap-3 pt-4">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">3</span>
                <span><b className="block text-foreground">Clear next steps</b><span className="text-muted-foreground">A custom quotation arrives by email after review.</span></span>
              </li>
            </ul>
          </div>
        </section>
      </Reveal>

      {/* How It Works (WEB-03) */}
      <section id="how-it-works" aria-labelledby="hiw-heading" className="scroll-mt-24">
        <div className="max-w-2xl">
          <p className="eyebrow">A clear path forward</p>
          <h2 id="hiw-heading" className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Four steps from browsing to placement — browse, review, apply, and
            receive your quotation.
          </p>
        </div>
        <Reveal>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Browse", "Search internships by role, country, and category."],
              ["Review", "Open a placement to see dates, responsibilities, and requirements."],
              ["Apply", "Create an account, upload your CV, and submit — drafts save as you go."],
              ["Quotation", "We review your application and email a custom quotation. Reply to accept."],
            ].map(([title, body], i) => (
              <li data-reveal key={title} className="surface-card surface-card-hover relative p-6">
                <p aria-hidden="true" className="tnum text-4xl font-semibold tracking-tight text-jalanin-200">0{i + 1}</p>
                <p className="mt-2 text-base font-semibold text-foreground">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {/* Featured internships (WEB-04) */}
      <section aria-labelledby="featured-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <p className="eyebrow">Find your fit</p>
            <h2 id="featured-heading" className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Featured internships
            </h2>
          </div>
          <Link href="/opportunities" className="btn btn-ghost btn-sm">
            View all <span aria-hidden="true">→</span>
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No featured internships right now"
              body="Please check back soon or browse all openings."
              actionHref="/opportunities"
              actionLabel="Browse internships"
            />
          </div>
        ) : (
          <Reveal>
            <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featured.map(({ internship, categoryName }) => (
                <InternshipCard
                  key={internship.id}
                  title={internship.title}
                  city={internship.city}
                  country={COUNTRY_NAMES[internship.countryCode] ?? internship.countryCode}
                  categoryName={categoryName}
                  startDate={internship.startDate}
                  endDate={internship.endDate}
                  href={`/opportunities/${internship.slug}`}
                />
              ))}
            </ul>
          </Reveal>
        )}
      </section>

      {/* About (WEB-05) — deep indigo panel */}
      <section id="about" aria-labelledby="about-heading" className="scroll-mt-24 overflow-hidden rounded-[1.5rem] bg-jalanin-900 p-8 text-white md:p-14">
        <div className="grid gap-8 md:grid-cols-[1.1fr_.9fr] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-jalanin-200">About Jalanin</p>
            <h2 id="about-heading" className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              About Jalanin
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-jalanin-100">
              Jalanin connects students with internship experiences across
              Southeast Asia. Every application is reviewed by our team, and
              every placement receives a custom quotation — because the right
              experience is personal.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              ["Personal review", "No automated screening — our team reads your application."],
              ["Transparent quotations", "Custom pricing explained by email, never hidden fees."],
              ["Regional expertise", "Placements across Singapore, Malaysia, Thailand and beyond."],
            ].map(([t, b]) => (
              <li key={t} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="font-semibold text-white">{t}</p>
                <p className="mt-1 leading-6 text-jalanin-100">{b}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact (WEB-05 / COM-*) */}
      <section id="contact" aria-labelledby="contact-heading" className="scroll-mt-24">
        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow">We&apos;re here to help</p>
            <h2 id="contact-heading" className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Contact us
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Questions about a placement or your application? Send us a
              message and our team will reply by email. See our{" "}
              <Link href="/privacy" className="font-medium text-primary hover:underline">privacy policy</Link>.
            </p>
          </div>
          <div className="surface-card p-5 md:p-7">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
