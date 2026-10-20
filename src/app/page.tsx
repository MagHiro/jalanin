import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mail, MapPin } from "lucide-react";
import { listFeaturedInternships, COUNTRY_NAMES } from "@/features/internships/service";
import { ContactForm } from "@/components/contact/contact-form";
import { InternshipCard } from "@/components/ui/internship-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicMotion } from "@/components/motion/public-motion";

export const revalidate = 120;

const steps = [
  ["Discover", "Explore roles by country, destination, and professional interest."],
  ["Consider", "Understand dates, responsibilities, and the experience before you apply."],
  ["Apply", "Tell us about your goals. Save your progress and return when you're ready."],
  ["Move forward", "Our team reviews your application and prepares a quotation by email."],
];

export default async function LandingPage() {
  const featured = await listFeaturedInternships(6);
  return (
    <PublicMotion>
      <section aria-labelledby="hero-heading" className="learn-hero origin-hero">
        <figure className="origin-hero-media" data-hero-visual>
          <Image src="/images/work-together.jpg" alt="People collaborating around a table with laptops in a shared workspace" fill priority sizes="(min-width: 1440px) 1280px, 100vw" className="object-cover" />
          <div className="origin-hero-shade" aria-hidden="true" />
        </figure>
        <div className="origin-hero-content">
          <p data-hero-copy className="origin-kicker">Internships across Southeast Asia</p>
          <h1 data-hero-copy id="hero-heading"><em>A little further.</em><br />A lot more possible.</h1>
          <p data-hero-copy className="origin-hero-description">
            New places. Real experience. Your next chapter.
          </p>
          <div data-hero-copy className="origin-hero-actions">
            <Link href="/opportunities" className="learn-hero-action origin-hero-action">
              Browse internships <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="featured-heading" className="learn-section">
        <div data-scroll-reveal className="learn-section-heading">
          <div><p className="eyebrow">01 / Opportunities</p><h2 id="featured-heading" className="section-title mt-4">The next move<br />is yours.</h2></div>
          <div><p className="mb-6 leading-7 text-muted-foreground">Explore published internships and choose the experience that feels right for your next chapter.</p>
            <Link href="/opportunities" className="learn-text-link">View all internships <ArrowRight size={17} aria-hidden="true" /></Link></div>
        </div>
        {featured.length === 0
          ? <EmptyState title="No featured internships right now" body="Please check back soon or browse all openings." actionHref="/opportunities" actionLabel="Browse internships" />
          : <ul className="learn-opportunity-grid">{featured.map(({ internship, categoryName }) =>
              <InternshipCard key={internship.id} title={internship.title} city={internship.city}
                country={COUNTRY_NAMES[internship.countryCode] ?? internship.countryCode}
                categoryName={categoryName} startDate={internship.startDate}
                endDate={internship.endDate} href={`/opportunities/${internship.slug}`} />
            )}</ul>}
      </section>

      <section id="how-it-works" aria-labelledby="hiw-heading" className="learn-section learn-process scroll-mt-28">
        <div data-scroll-reveal>
          <p className="eyebrow">02 / A clear way forward</p>
          <h2 id="hiw-heading" className="section-title mt-4">One step<br />at a time.</h2>
          <p className="learn-process-intro">From your first search to a personal quotation, know what to expect at each step.</p>
          <Link href="/opportunities" className="btn btn-primary mt-7">Find your opportunity <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <ol>{steps.map(([title, body], i) =>
          <li data-scroll-reveal key={title} className="learn-process-step">
            <span className="tnum" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <div><h3>{title}</h3><p>{body}</p></div>
          </li>)}
        </ol>
      </section>

      <section id="about" aria-labelledby="about-heading" className="learn-about scroll-mt-28">
        <div data-scroll-reveal className="learn-about-copy">
          <p className="learn-kicker">03 / A human way to grow</p>
          <h2 id="about-heading" className="section-title mt-6">Your journey is personal.<br />So is our approach.</h2>
          <p className="mt-6 leading-8 text-jalanin-100">We connect students with internship experiences across Southeast Asia. Our team reads every application and prepares a custom quotation because the right next step looks different for everyone.</p>
          <Link href="#contact" className="learn-hero-action mt-8">Let’s talk <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        <figure className="learn-about-photo">
          <Image src="/images/singapore.jpg" alt="Singapore’s waterfront and skyline at dusk" fill sizes="(min-width: 1024px) 760px, 100vw" className="object-cover" />
          <figcaption><MapPin size={15} aria-hidden="true" /> Singapore · Southeast Asia</figcaption>
        </figure>
      </section>

      <section id="contact" aria-labelledby="contact-heading" className="learn-section learn-contact scroll-mt-28">
        <div data-scroll-reveal className="learn-contact-note">
          <p className="eyebrow">04 / Contact</p>
          <h3 className="mt-7 flex items-center gap-3 text-base font-medium"><Mail size={20} strokeWidth={1.5} aria-hidden="true" /> A real conversation.</h3>
          <p className="mt-3 max-w-xs text-sm leading-7 text-muted-foreground">Our team replies by email. See our <Link href="/privacy" className="underline underline-offset-4">privacy policy</Link>.</p>
          <Link href="/opportunities" className="learn-text-link mt-8">Explore internships first <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <div className="learn-contact-form"><h2 id="contact-heading" className="section-title mb-10">Good things<br />start with a<br />conversation.</h2><ContactForm /></div>
      </section>
    </PublicMotion>
  );
}
