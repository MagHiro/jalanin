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
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-emerald-800">
          Jalanin <span className="font-normal text-emerald-600">Internships</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-5 text-sm md:flex">
          {PUBLIC_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-slate-700 hover:text-emerald-700">
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
                  className="rounded border border-emerald-700 px-3 py-1.5 font-medium text-emerald-800 hover:bg-emerald-50"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="rounded bg-emerald-700 px-3 py-1.5 font-medium text-white hover:bg-emerald-800"
              >
                Dashboard
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/auth/login" className="px-2 py-1.5 text-slate-700 hover:text-emerald-700">
                Log in
              </Link>
              <Link
                href="/auth/sign-up"
                className="rounded bg-emerald-700 px-3 py-1.5 font-medium text-white hover:bg-emerald-800"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
      <nav aria-label="Mobile" className="flex gap-4 overflow-x-auto border-t px-4 py-2 text-sm md:hidden">
        {PUBLIC_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap text-slate-700">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
