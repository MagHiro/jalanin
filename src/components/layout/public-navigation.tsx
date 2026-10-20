"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Info, ListOrdered, Mail, Menu, X } from "lucide-react";

const links = [
  { href: "/opportunities", label: "Internships", description: "Find your next opportunity", icon: BriefcaseBusiness },
  { href: "/#how-it-works", label: "How it works", description: "From application to placement", icon: ListOrdered },
  { href: "/#about", label: "About", description: "Get to know Jalanin", icon: Info },
  { href: "/#contact", label: "Contact", description: "Start a conversation", icon: Mail },
];

export function PublicNavigation({ signedIn }: { signedIn: boolean; admin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("");
  const toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const closeMenus = () => setOpen(false);

  useEffect(() => {
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const resize = () => setOpen(false);
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    desktop.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", outside);
      desktop.removeEventListener("change", resize);
    };
  }, [open ]);

  const active = (href: string) => href.includes("#")
    ? pathname === "/" && hash === href.slice(1)
    : pathname === href || pathname.startsWith(`${href}/`);

  const accountActions = (
    <>
      {signedIn ? (
        <>
          <Link href="/dashboard" className="btn btn-primary public-header-cta" onClick={closeMenus}>Dashboard <ArrowRight size={20} strokeWidth={1.7} aria-hidden="true" /></Link>
        </>
      ) : (
        <>
          <Link href="/auth/login" className="public-account-link" onClick={closeMenus}>Log in</Link>
          <Link href="/auth/sign-up" className="btn btn-primary public-header-cta" onClick={closeMenus}>Get started <ArrowRight size={20} strokeWidth={1.7} aria-hidden="true" /></Link>
        </>
      )}
    </>
  );

  return (
    <header ref={header} className={`public-header origin-nav sticky z-40${pathname === "/" ? " origin-nav-home" : ""}`} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeMenus(); }}>
      <div className="public-header-inner mx-auto px-5 md:px-10">
        <Link href="/" aria-label="Jalanin Internships — home" className="public-brand" onClick={closeMenus}>
          <Image src="/logo.png" alt="Jalanin Internship Program" width={2996} height={688} priority sizes="(max-width: 767px) 160px, 200px" className="public-nav-logo" />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-2 xl:gap-5 lg:flex">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={active(href) ? (href.includes("#") ? "location" : "page") : undefined} className="public-nav-link" onClick={() => { closeMenus(); setHash(href.includes("#") ? href.slice(1) : ""); }}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="public-account hidden items-center gap-3 lg:flex">{accountActions}</div>
        <button ref={toggle} type="button" className="public-menu-toggle lg:hidden" aria-expanded={open} aria-controls="public-mobile-navigation" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
          {open ? <X size={20} strokeWidth={1.6} aria-hidden="true" /> : <Menu size={20} strokeWidth={1.6} aria-hidden="true" />}
        </button>
      </div>
      <div id="public-mobile-navigation" hidden={!open} className="public-mobile-panel lg:hidden">
        <div className="mx-auto max-w-[1280px] px-5 pb-6 pt-3 md:px-10">
          <p className="mb-2 text-xs tracking-[.12em] text-muted-foreground uppercase">Explore Jalanin</p>
          <nav aria-label="Mobile">
            {links.map(({ href, label, description, icon: Icon }) => (
              <Link key={href} href={href} className="public-mobile-link" aria-current={active(href) ? (href.includes("#") ? "location" : "page") : undefined} onClick={() => { setOpen(false); setHash(href.includes("#") ? href.slice(1) : ""); }}>
                <Icon size={21} strokeWidth={1.6} aria-hidden="true" />
                <span className="flex-1"><span className="block text-lg font-medium tracking-[-.025em]">{label}</span><span className="block text-xs text-muted-foreground">{description}</span></span>
                <ArrowRight size={18} strokeWidth={1.6} aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">{accountActions}</div>
        </div>
      </div>
    </header>
  );
}
