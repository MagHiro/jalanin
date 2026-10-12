import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-emerald-800">Jalanin Internships</p>
          <p className="mt-2 text-sm text-slate-600">
            Internship placements across Southeast Asia with personal guidance
            and custom quotations.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">Explore</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link className="hover:underline" href="/opportunities">Browse internships</Link></li>
            <li><Link className="hover:underline" href="/#how-it-works">How it works</Link></li>
            <li><Link className="hover:underline" href="/#about">About Jalanin</Link></li>
            <li><Link className="hover:underline" href="/#contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800">Legal</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link className="hover:underline" href="/privacy">Privacy policy</Link></li>
            <li><Link className="hover:underline" href="/terms">Terms of service</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Jalanin. Launching in English only.
      </div>
    </footer>
  );
}
