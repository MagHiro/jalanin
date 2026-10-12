import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowRight, ArrowUpRight, Compass, FileCheck2, Globe2, Mail, Search, Send, Users } from "lucide-react";
import { listFeaturedInternships, COUNTRY_NAMES } from "@/features/internships/service";
import { ContactForm } from "@/components/contact/contact-form";
import { InternshipCard } from "@/components/ui/internship-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/motion/reveal";

export const revalidate = 120;

const steps = [
  { title: "Browse", body: "Find a role that fits your interests. Explore by country, location, and field.", icon: Search },
  { title: "Review", body: "Get to know the placement: dates, responsibilities, and what you’ll need.", icon: FileCheck2 },
  { title: "Apply", body: "Tell us about yourself and upload your CV. Save a draft and return anytime.", icon: Send },
  { title: "Quotation", body: "Our team reviews your application and emails a custom quotation. Reply to accept.", icon: Mail },
];

export default async function LandingPage() {
  const featured = await listFeaturedInternships(6);
  return (
    <div>
      <Reveal>
        <section aria-labelledby="hero-heading" className="grid gap-10 pb-16 pt-4 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-14 lg:pb-24">
          <div data-reveal>
            <p className="eyebrow flex items-center gap-2"><span className="size-2 rounded-full bg-primary" /> A new place. A new perspective.</p>
            <h1 id="hero-heading" className="editorial-title mt-6">Internships across <span className="text-primary">Southeast Asia,</span> with personal guidance.</h1>
            <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">Step beyond the classroom. Discover meaningful internship experiences, explore a different culture, and take your next step with a real person by your side.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/opportunities" className="btn btn-primary min-h-12 px-6">Browse internships <ArrowUpRight size={18} aria-hidden="true" /></Link>
              <Link href="/#how-it-works" className="btn btn-ghost">How it works <ArrowDown size={16} aria-hidden="true" /></Link>
            </div>
            <div className="mt-10 flex items-center gap-3 border-t border-border pt-5 text-sm text-muted-foreground"><Users size={20} aria-hidden="true" /><span>Every application reviewed by our team.<br /><span className="text-foreground">Personal from the very first step.</span></span></div>
          </div>
          <div data-reveal className="relative">
            <div className="hero-photo lg:min-h-[620px]">
              <Image src="/images/singapore.jpg" alt="Singapore’s waterfront and skyline at dusk" fill priority sizes="(min-width: 1024px) 550px, 100vw" className="object-cover" />
              <div className="absolute bottom-8 left-7 z-10 text-white"><p className="text-xs uppercase tracking-[.18em]">A world beyond your classroom</p><p className="mt-2 text-3xl font-medium tracking-tight">Go somewhere.<br />Grow everywhere.</p></div>
            </div>
            <div className="absolute -right-2 top-7 flex items-center gap-3 rounded-full border border-border bg-surface px-5 py-3 shadow-sm md:-right-4"><Globe2 size={22} className="text-primary" aria-hidden="true" /><span className="text-sm font-medium">Southeast Asia. Your next chapter.</span></div>
          </div>
        </section>
      </Reveal>

      <section aria-labelledby="featured-heading" className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><p className="eyebrow">Possibilities, handpicked</p><h2 id="featured-heading" className="section-title mt-3">Featured internships</h2><p className="mt-4 max-w-lg text-muted-foreground">Find your place in a new city. Make space for what comes next.</p></div>
          <Link href="/opportunities" className="btn btn-outline">Explore all opportunities <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
        {featured.length === 0 ? <div className="mt-8"><EmptyState title="No featured internships right now" body="Please check back soon or browse all openings." actionHref="/opportunities" actionLabel="Browse internships" /></div> : <Reveal><ul className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{featured.map(({ internship, categoryName }) => <InternshipCard key={internship.id} title={internship.title} city={internship.city} country={COUNTRY_NAMES[internship.countryCode] ?? internship.countryCode} categoryName={categoryName} startDate={internship.startDate} endDate={internship.endDate} href={`/opportunities/${internship.slug}`} />)}</ul></Reveal>}
      </section>

      <section id="how-it-works" aria-labelledby="hiw-heading" className="editorial-section scroll-mt-32">
        <div className="grid gap-5 md:grid-cols-2"><div><p className="eyebrow">A little clarity goes a long way</p><h2 id="hiw-heading" className="section-title mt-3">How It Works</h2></div><p className="max-w-md text-lg leading-8 text-muted-foreground md:justify-self-end">Big experiences start with simple steps. We’ll help you move from a possibility to a plan.</p></div>
        <Reveal><ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{steps.map(({ title, body, icon: Icon }, i) => <li data-reveal key={title} className="editorial-step"><div className="flex items-center justify-between"><span className="tnum text-sm text-muted-foreground">0{i + 1}</span><Icon size={22} strokeWidth={1.5} className="text-primary" aria-hidden="true" /></div><h3 className="mt-7 text-2xl font-medium tracking-tight">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p></li>)}</ol></Reveal>
      </section>

      <section id="about" aria-labelledby="about-heading" className="my-8 scroll-mt-32 overflow-hidden rounded-2xl bg-primary text-white">
        <div className="grid gap-12 p-8 md:p-14 lg:grid-cols-[1.1fr_.9fr] lg:p-16">
          <div><Compass size={40} strokeWidth={1.2} aria-hidden="true" /><p className="mt-10 text-xs font-medium uppercase tracking-[.15em] text-jalanin-200">About Jalanin</p><h2 id="about-heading" className="section-title mt-4">About Jalanin</h2><p className="mt-4 text-2xl font-medium leading-snug tracking-tight">Your journey is personal.<br />So is our approach.</p><p className="mt-6 max-w-md leading-7 text-jalanin-100">We connect students with internship experiences across Southeast Asia. Every application is reviewed by our team, and every placement receives a custom quotation — because the right experience is personal.</p><Link href="/#contact" className="mt-8 inline-flex min-h-11 items-center gap-3 font-medium text-white underline underline-offset-4">Let’s talk about your next step <ArrowRight size={18} aria-hidden="true" /></Link></div>
          <div className="flex flex-col justify-center">{[["01", "People, not an algorithm", "Our team reads your application and considers your next step with care."], ["02", "A quotation made for you", "Custom quotations explained by email after your application is reviewed."], ["03", "A different perspective", "Explore placements across the region and experience life beyond the familiar."]].map(([n, title, body]) => <div key={n} className="border-t border-white/20 py-7"><p className="text-xs text-jalanin-200">{n}</p><h3 className="mt-3 text-xl font-medium">{title}</h3><p className="mt-2 text-sm leading-7 text-jalanin-100">{body}</p></div>)}</div>
        </div>
      </section>

      <section id="contact" aria-labelledby="contact-heading" className="editorial-section mt-16 scroll-mt-32">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-20"><div><p className="eyebrow">Good questions. Real conversations.</p><h2 id="contact-heading" className="section-title mt-4">Contact us</h2><p className="mt-6 max-w-sm text-lg leading-8 text-muted-foreground">Wondering where to begin? Let’s figure out your next step together.</p><div className="mt-10 flex items-start gap-3 text-sm leading-7 text-muted-foreground"><Mail size={20} className="mt-1 shrink-0 text-primary" aria-hidden="true" /><p>Send us a message and our team will reply by email. See our <Link href="/privacy" className="text-primary underline underline-offset-4">privacy policy</Link>.</p></div></div><div className="surface-card p-6 md:p-8"><ContactForm /></div></div>
      </section>
    </div>
  );
}
