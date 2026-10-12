import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.2fr_1fr_1fr] md:px-8 md:py-14">
        <div>
          <p className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-white">J</span>
            Jalanin Internships
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
        © {new Date().getFullYear()} Jalanin. Launching in English only.
      </div>
    </footer>
  );
}
