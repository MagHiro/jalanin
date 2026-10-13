import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowRight, ArrowUpRight, Mail, MapPin } from "lucide-react";
import { listFeaturedInternships, COUNTRY_NAMES } from "@/features/internships/service";
import { ContactForm } from "@/components/contact/contact-form";
import { InternshipCard } from "@/components/ui/internship-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicMotion } from "@/components/motion/public-motion";

export const revalidate = 120;

const steps = [
  ["Browse", "Find a role that fits your interests. Explore by country, location, and field."],
  ["Review", "Get to know the placement: dates, responsibilities, and what you’ll need."],
  ["Apply", "Tell us about yourself and upload your CV. Save a draft and return anytime."],
  ["Quotation", "Our team reviews your application and emails a custom quotation. Reply to accept."],
];

export default async function LandingPage() {
  const featured = await listFeaturedInternships(6);
  return (
    <PublicMotion>
      <section aria-labelledby="hero-heading" className="learn-hero">
        <Image data-hero-image src="/images/learning-together.jpg" alt="Young professionals sharing a table and working together on laptops" fill priority sizes="(min-width: 1440px) 1360px, (min-width: 1024px) calc(100vw - 80px), 100vw" className="object-cover" />
        <div className="learn-hero-shade" />
        <div className="learn-hero-content">
          <p data-hero-copy className="learn-kicker">Real experience. A new perspective.</p>
          <h1 data-hero-copy id="hero-heading">You have a world ahead.<br /><span>Make it your classroom.</span></h1>
          <p data-hero-copy className="learn-hero-description">Internships across Southeast Asia.<br />Personal guidance for your next step.</p>
          <Link data-hero-copy href="/opportunities" className="learn-hero-action">Browse internships <ArrowUpRight size={19} aria-hidden="true" /></Link>
        </div>
        <div className="learn-hero-bottom"><span>Go further. Learn by doing.</span><Link href="#how-it-works" aria-label="Discover how it works"><ArrowDown size={20} aria-hidden="true" /></Link></div>
      </section>

      <div className="learn-intro-strip"><p>We believe in<br /><span>learning by doing.</span></p><div><p>Step beyond the classroom, discover a different culture, and build your experience with a real person by your side.</p><Link href="#about" className="learn-text-link mt-5">Get to know Jalanin <ArrowUpRight size={17} aria-hidden="true" /></Link></div></div>

      <section aria-labelledby="featured-heading" className="learn-section">
        <div data-scroll-reveal className="learn-section-heading"><div><p className="eyebrow">01 / Find your next step</p><h2 id="featured-heading" className="section-title mt-4">Big possibilities.<br />Real-world experience.</h2></div><div><p className="mb-5 max-w-xs leading-7 text-muted-foreground">A new city. A different perspective. Find a placement that feels right for you.</p><Link href="/opportunities" className="learn-text-link">Explore all opportunities <ArrowUpRight size={18} aria-hidden="true" /></Link></div></div>
        <h3 className="mt-10 mb-5 text-sm font-medium">Featured internships</h3>
        {featured.length === 0 ? <EmptyState title="No featured internships right now" body="Please check back soon or browse all openings." actionHref="/opportunities" actionLabel="Browse internships" /> : <ul className="learn-opportunity-grid">{featured.map(({ internship, categoryName }) => <InternshipCard key={internship.id} title={internship.title} city={internship.city} country={COUNTRY_NAMES[internship.countryCode] ?? internship.countryCode} categoryName={categoryName} startDate={internship.startDate} endDate={internship.endDate} href={`/opportunities/${internship.slug}`} />)}</ul>}
      </section>

      <section id="how-it-works" aria-labelledby="hiw-heading" className="learn-section learn-process scroll-mt-28">
        <div data-scroll-reveal><p className="eyebrow">02 / From curious to ready</p><h2 id="hiw-heading" className="section-title mt-4">How It Works</h2><Link href="/opportunities" className="btn btn-primary mt-6">Get started <ArrowRight size={17} aria-hidden="true" /></Link></div>
        <ol>{steps.map(([title, body], i) => <li data-scroll-reveal key={title} className="learn-process-step"><span className="tnum">[{i + 1}]</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol>
      </section>

      <section id="about" aria-labelledby="about-heading" className="learn-about scroll-mt-28">
        <div data-scroll-reveal className="learn-about-copy"><p className="learn-kicker">03 / About Jalanin</p><h2 id="about-heading" className="section-title mt-6">Your journey is personal.<br />So is our approach.</h2><p className="mt-6 leading-8 text-jalanin-100">We connect students with internship experiences across Southeast Asia. Our team reads every application and prepares a custom quotation, because the right next step looks different for everyone.</p><Link href="#contact" className="learn-hero-action mt-8">Let’s talk <ArrowRight size={18} aria-hidden="true" /></Link></div>
        <figure className="learn-about-photo"><Image src="/images/singapore.jpg" alt="Singapore’s waterfront and skyline at dusk" fill sizes="(min-width: 1024px) 880px, 100vw" className="object-cover" /><figcaption><MapPin size={15} aria-hidden="true" /> Singapore, Southeast Asia · A new perspective.</figcaption></figure>
      </section>

      <section id="contact" aria-labelledby="contact-heading" className="learn-section learn-contact scroll-mt-28">
        <div data-scroll-reveal className="learn-contact-note"><p className="eyebrow">04 / Contact us</p><h3 className="mt-6 flex items-center gap-3 text-base font-medium"><Mail size={20} strokeWidth={1.5} aria-hidden="true" /> A real conversation.</h3><p className="mt-3 max-w-xs text-sm leading-7 text-muted-foreground">Our team will reply by email. See our <Link href="/privacy" className="underline underline-offset-4">privacy policy</Link>.</p></div><div className="learn-contact-form"><h2 id="contact-heading" className="section-title mb-10">A question, an idea,<br />a next step.<br />We’d love to hear from you.</h2><ContactForm /></div>
      </section>
    </PublicMotion>
  );
}
