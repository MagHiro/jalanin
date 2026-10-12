import Link from "next/link";
import { getSessionUser, isAdminUser } from "@/lib/auth/require";
import { SignOutButton } from "./sign-out-button";

const PUBLIC_LINKS = [
  { href: "/opportunities", label: "Internships" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export async function SiteHeader() {
  const user = await getSessionUser();
  const admin = user ? await isAdminUser(user.id) : false;
  return (
    <header className="glass-surface sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 md:px-8">
        <Link
          href="/"
          aria-label="Jalanin Internships — home"
          className="flex min-h-11 items-center gap-2.5 text-lg font-bold tracking-tight text-jalanin-900"
        >
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-primary text-base font-bold text-white shadow-sm">J</span>
          <span>Jalanin <span className="font-normal text-muted-foreground">Internships</span></span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 text-sm md:flex">
          {PUBLIC_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2.5 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              {admin && (
                <Link
                  href="/admin"
                  className="hidden min-h-10 items-center rounded-lg border border-primary px-3 py-2 font-semibold text-primary transition-colors hover:bg-secondary sm:inline-flex"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="btn btn-primary btn-sm"
              >
                Dashboard
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden min-h-10 items-center rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary sm:inline-flex">
                Log in
              </Link>
              <Link href="/auth/sign-up" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
      <nav aria-label="Mobile" className="mobile-nav flex gap-1 overflow-x-auto border-t border-border px-4 py-2 text-sm md:hidden">
        {PUBLIC_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="min-h-10 shrink-0 whitespace-nowrap rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary">
            {l.label}
          </Link>
        ))}
        {!user && (
          <Link href="/auth/login" className="min-h-10 shrink-0 whitespace-nowrap rounded-lg px-3 py-2 font-medium text-muted-foreground hover:bg-secondary hover:text-primary">
            Log in
          </Link>
        )}
        {admin && (
          <Link href="/admin" className="min-h-10 shrink-0 whitespace-nowrap rounded-lg px-3 py-2 font-semibold text-primary hover:bg-secondary">
            Admin
          </Link>
        )}
      </nav>
    </header>
  );
}
