import Link from "next/link";
import {
  listFeaturedInternships,
  COUNTRY_NAMES,
} from "@/features/internships/service";
import { ContactForm } from "@/components/contact/contact-form";

export const revalidate = 120;

export default async function LandingPage() {
  const featured = await listFeaturedInternships(6);
  return (
    <div className="space-y-16">
      {/* Hero (WEB-02) */}
      <section className="grid items-center gap-8 rounded-2xl bg-emerald-800 p-8 text-white md:grid-cols-2 md:p-12">
        <div>
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">
            Internships across Southeast Asia
          </h1>
          <p className="mt-4 text-emerald-100">
            Browse curated placements, apply with personal guidance, and receive
            a custom quotation prepared for you — no fixed prices, no surprises.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/opportunities"
              className="rounded-lg bg-white px-5 py-3 font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              Browse internships
            </Link>
            <Link
              href="/#how-it-works"
              className="rounded-lg border border-emerald-200 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              How it works
            </Link>
          </div>
        </div>
        <div className="rounded-xl bg-emerald-700/60 p-6 text-sm leading-relaxed text-emerald-50">
          <p className="font-semibold text-white">Why Jalanin?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Curated hospitality, business, technology, and creative roles</li>
            <li>Human review of every application</li>
            <li>Custom quotation after review — you reply by email</li>
          </ul>
        </div>
      </section>

      {/* How It Works (WEB-03) */}
      <section id="how-it-works" aria-labelledby="hiw-heading">
        <h2 id="hiw-heading" className="text-2xl font-bold">How it works</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-4">
          {[
            ["1. Browse", "Search internships by role, country, and category."],
            ["2. Review", "Open a placement to see dates, responsibilities, and requirements."],
            ["3. Apply", "Create an account, upload your CV, and submit — drafts save automatically."],
            ["4. Quotation", "We review your application and email a custom quotation. Reply to accept."],
          ].map(([title, body]) => (
            <li key={title} className="rounded-xl border p-5">
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-sm text-slate-600">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Featured internships (WEB-04) */}
      <section aria-labelledby="featured-heading">
        <div className="flex items-baseline justify-between">
          <h2 id="featured-heading" className="text-2xl font-bold">Featured internships</h2>
          <Link href="/opportunities" className="text-sm font-medium text-emerald-700 hover:underline">
            View all
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed p-8 text-center text-slate-500">
            No featured internships right now — please check back soon or browse all openings.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            {featured.map(({ internship, categoryName }) => (
              <li key={internship.id} className="flex flex-col rounded-xl border p-5">
                <div className="flex flex-wrap gap-2 text-xs">
                  {categoryName && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">{categoryName}</span>
                  )}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                    {internship.city}, {COUNTRY_NAMES[internship.countryCode] ?? internship.countryCode}
                  </span>
                </div>
                <p className="mt-2 font-semibold">{internship.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {internship.startDate} → {internship.endDate}
                </p>
                <Link
                  href={`/opportunities/${internship.slug}`}
                  className="mt-3 text-sm font-medium text-emerald-700 hover:underline"
                >
                  View details
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* About (WEB-05) */}
      <section id="about" aria-labelledby="about-heading" className="rounded-2xl bg-slate-50 p-8">
        <h2 id="about-heading" className="text-2xl font-bold">About Jalanin</h2>
        <p className="mt-3 max-w-3xl text-slate-700">
          Jalanin connects students with internship experiences across Southeast
          Asia. Every application is reviewed by our team, and every placement
          receives a custom quotation — because the right experience is personal.
        </p>
      </section>

      {/* Contact (WEB-05 / COM-*) */}
      <section id="contact" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-2xl font-bold">Contact us</h2>
        <p className="mt-2 text-sm text-slate-600">
          Questions about a placement or your application? Send us a message. See our{" "}
          <Link href="/privacy" className="text-emerald-700 hover:underline">privacy policy</Link>.
        </p>
        <div className="mt-4 max-w-xl">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
