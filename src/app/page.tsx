import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BriefcaseBusiness, MapPin } from "lucide-react";
import { listFeaturedInternships, COUNTRY_NAMES } from "@/features/internships/service";
import { ContactForm } from "@/components/contact/contact-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicMotion } from "@/components/motion/public-motion";
import { ProcessCarousel } from "@/components/motion/process-carousel";
import { FaqSection } from "@/components/faq/faq-section";

export const revalidate = 120;

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

      <section aria-labelledby="featured-heading" className="learn-section featured-internships">
        <div data-scroll-reveal className="featured-internships-heading">
          <h2 id="featured-heading">Featured internships</h2>
          <p>Discover your next opportunity across Southeast Asia.</p>
          <Link href="/opportunities" className="featured-internships-browse">View all internships</Link>
        </div>
        {featured.length === 0
          ? <EmptyState title="No featured internships right now" body="Please check back soon or browse all openings." actionHref="/opportunities" actionLabel="Browse internships" />
          : <ul className="learn-opportunity-grid">{featured.map(({ internship, categoryName }) =>
              <li key={internship.id} data-reveal className="featured-role-row">
                <h3><span className="featured-role-icon" aria-hidden="true"><BriefcaseBusiness size={19} strokeWidth={1.5} /></span><Link href={`/opportunities/${internship.slug}`}>{internship.title}</Link></h3>
                <p className="featured-role-category">{categoryName ?? "Internship"}</p>
                <p className="featured-role-location"><MapPin size={15} strokeWidth={1.5} aria-hidden="true" /><span>{internship.city}, {COUNTRY_NAMES[internship.countryCode] ?? internship.countryCode}</span></p>
                <Link href={`/opportunities/${internship.slug}`} aria-label={`View details for ${internship.title}`} className="featured-role-action">View details <span aria-hidden="true">›</span></Link>
              </li>
            )}</ul>}
      </section>

      <section id="how-it-works" aria-labelledby="hiw-heading" className="learn-section learn-process scroll-mt-28">
        <div data-scroll-reveal className="learn-process-heading">
          <h2 id="hiw-heading">One step at a time.</h2>
          <p className="learn-process-intro">From your first search to a personal quotation, know what to expect at each step.</p>
        </div>
        <ProcessCarousel />
      </section>

      <FaqSection />

      <section id="about" aria-labelledby="about-heading" className="personal-contact scroll-mt-28">
        <header data-scroll-reveal className="personal-contact-heading">
          <p>A human way to grow</p>
          <h2 id="about-heading">Your journey is personal. So is our approach.</h2>
        </header>
        <figure className="personal-contact-photo">
          <Image src="/images/singapore.jpg" alt="Singapore’s waterfront and skyline at dusk" fill sizes="(min-width: 1536px) 1440px, 100vw" className="object-cover" />
          <figcaption><MapPin size={15} aria-hidden="true" /> Singapore · Southeast Asia</figcaption>
        </figure>
        <div id="contact" className="personal-contact-panel scroll-mt-28" role="region" aria-labelledby="contact-heading">
          <div className="personal-contact-intro">
            <h3 id="contact-heading">Good things start with a conversation.</h3>
            <p>We connect students with internship experiences across Southeast Asia. Our team reads every application and prepares a custom quotation because the right next step looks different for everyone.</p>
          </div>
          <ContactForm />
          <p className="personal-contact-privacy">Our team replies by email. See our <Link href="/privacy">privacy policy</Link>.</p>
          <Link href="/opportunities" className="personal-contact-explore">Explore internships first <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>
    </PublicMotion>
  );
}
