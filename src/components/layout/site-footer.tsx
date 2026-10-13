import Link from "next/link";
import { MoveUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="learn-footer mt-12 border-t border-border bg-secondary">
      <div className="learn-footer-heading"><p>Find your next chapter.</p><Link href="/opportunities" className="btn btn-primary">Browse internships <MoveUpRight size={18} aria-hidden="true" /></Link></div>
      <div className="learn-footer-content mx-auto grid gap-10 px-5 py-16 md:grid-cols-[2fr_1fr_1fr] md:px-10">
        <div>
          <p className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
            <MoveUpRight aria-hidden="true" size={26} />
            <span className="text-3xl tracking-[-.06em]">jalanin.</span>
          </p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
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
                <Link className="inline-flex min-h-9 items-center rounded-md px-1 hover:text-primary hover:underline" href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="text-sm font-semibold text-foreground">Legal</p>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {[
              ["/privacy", "Privacy policy"],
              ["/terms", "Terms of service"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link className="inline-flex min-h-9 items-center rounded-md px-1 hover:text-primary hover:underline" href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Jalanin · Your next chapter starts here.
      </div>
    </footer>
  );
}
