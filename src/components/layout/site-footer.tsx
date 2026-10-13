import Link from "next/link";
import { ArrowUpRight, MoveUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="learn-footer">
      <div className="learn-footer-heading">
        <div className="learn-footer-invitation">
          <p className="learn-footer-kicker">The next chapter is yours</p>
          <p>Make room for<br /><span>what&apos;s possible.</span></p>
        </div>
        <Link href="/opportunities" className="btn btn-primary">Browse internships <ArrowUpRight size={19} aria-hidden="true" /></Link>
      </div>
      <div className="learn-footer-content mx-auto grid gap-10 px-5 py-16 md:grid-cols-[2fr_1fr_1fr] md:px-10">
        <div className="learn-footer-brand">
          <p className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
            <MoveUpRight aria-hidden="true" size={26} />
            <span className="text-3xl tracking-[-.06em]">jalanin.</span>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
            Internship placements across Southeast Asia with personal guidance
            and custom quotations by email.
          </p>
          <p className="learn-footer-signoff">Go further. Learn by doing.</p>
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
                <Link className="learn-footer-link" href={href}>{label}<ArrowUpRight size={14} aria-hidden="true" /></Link>
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
                <Link className="learn-footer-link" href={href}>{label}<ArrowUpRight size={14} aria-hidden="true" /></Link>
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
