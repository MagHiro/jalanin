import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="learn-footer refined-footer">
      <div className="learn-footer-heading">
        <div className="learn-footer-invitation">
           <p className="learn-footer-kicker">Your next chapter</p>
           <h2>Go further.<br />Learn by doing.</h2>
        </div>
        <Link href="/opportunities" className="btn btn-primary">Browse internships <ArrowRight size={19} aria-hidden="true" /></Link>
      </div>
      <div className="learn-footer-content mx-auto grid gap-10 px-5 py-16 md:grid-cols-[2fr_1fr_1fr] md:px-10">
        <div className="learn-footer-brand">
          <Link href="/" aria-label="Jalanin Internship Program — home" className="learn-footer-logo">
            <Image src="/logo.png" alt="Jalanin Internship Program" width={2996} height={688} sizes="220px" />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
            Internship placements across Southeast Asia with personal guidance
            and custom quotations by email.
          </p>
        </div>
        <nav aria-label="Explore">
          <p className="text-sm font-semibold text-foreground">Explore</p>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {[
              ["/opportunities", "Browse internships"],
              ["/#how-it-works", "How it works"],
              ["/#about", "About Jalanin"],
              ["/#contact", "Contact us"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link className="learn-footer-link" href={href}>{label}<ArrowRight size={14} aria-hidden="true" /></Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="text-sm font-semibold text-foreground">Information</p>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {[
              ["/privacy", "Privacy policy"],
              ["/terms", "Terms of service"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link className="learn-footer-link" href={href}>{label}<ArrowRight size={14} aria-hidden="true" /></Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="learn-footer-bottom">
        <span>© {new Date().getFullYear()} Jalanin</span>
        <span>Your next chapter starts here.</span>
      </div>
    </footer>
  );
}
