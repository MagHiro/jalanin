"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BriefcaseBusiness, ChevronDown, Info, ListOrdered, Mail, Menu, X } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

const links = [
  { href: "/opportunities", label: "Internships", description: "Find your next opportunity", icon: BriefcaseBusiness },
  { href: "/#how-it-works", label: "How it works", description: "From application to placement", icon: ListOrdered },
  { href: "/#about", label: "About", description: "Get to know Jalanin", icon: Info },
  { href: "/#contact", label: "Contact", description: "Start a conversation", icon: Mail },
];

export function PublicNavigation({ signedIn, admin }: { signedIn: boolean; admin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [explore, setExplore] = useState(false);
  const [hash, setHash] = useState("");
  const toggle = useRef<HTMLButtonElement>(null);
  const exploreToggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const closeMenus = () => { setOpen(false); setExplore(false); };

  useEffect(() => {
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [pathname]);

  useEffect(() => {
    if (!open && !explore) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setExplore(false);
        (explore ? exploreToggle : toggle).current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) { setOpen(false); setExplore(false); }
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const resize = () => { setOpen(false); setExplore(false); };
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    desktop.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", outside);
      desktop.removeEventListener("change", resize);
    };
  }, [open, explore]);

  const active = (href: string) => href.includes("#")
    ? pathname === "/" && hash === href.slice(1)
    : pathname === href || pathname.startsWith(`${href}/`);

  const accountActions = (
    <>
      {signedIn ? (
        <>
          {admin && <Link href="/admin" className="public-account-link" onClick={closeMenus}>Admin</Link>}
          <SignOutButton />
          <Link href="/dashboard" className="btn btn-primary public-header-cta" onClick={closeMenus}>Dashboard <ArrowRight size={17} strokeWidth={1.6} aria-hidden="true" /></Link>
        </>
      ) : (
        <>
          <Link href="/auth/login" className="public-account-link" onClick={closeMenus}>Log in</Link>
          <Link href="/auth/sign-up" className="btn btn-primary public-header-cta" onClick={closeMenus}>Sign up <ArrowRight size={17} strokeWidth={1.6} aria-hidden="true" /></Link>
        </>
      )}
    </>
  );

  return (
    <header ref={header} className="public-header sticky z-40" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeMenus(); }}>
      <div className="public-header-inner mx-auto px-5 md:px-10">
        <Link href="/" aria-label="Jalanin Internships — home" className="public-brand" onClick={closeMenus}>
          <span className="chapters-wordmark"><span className="chapters-wordmark-symbol" aria-hidden="true">j.</span><span>jalanin<span className="chapters-wordmark-dot">.</span></span></span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 xl:gap-2 lg:flex">
          <button ref={exploreToggle} type="button" className="public-nav-link" aria-expanded={explore} aria-controls="public-explore-navigation" onClick={() => setExplore(!explore)}>
            Explore <ChevronDown size={16} strokeWidth={1.6} aria-hidden="true" className={explore ? "rotate-180" : ""} />
          </button>
          {links.filter(({label}) => label !== "Contact").map(({ href, label }) => (
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
      <div id="public-explore-navigation" hidden={!explore} className="public-mega-panel">
        <nav aria-label="Explore Jalanin" className="public-mega-links">
          <div>
            <p className="public-menu-label">Find your next step</p>
            {links.slice(0, 2).map(({ href, label, description, icon: Icon }) => (
              <Link key={href} href={href} className="public-mega-link" onClick={closeMenus}>
                <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                <span><span className="block font-medium">{label}</span><span className="block text-sm text-muted-foreground">{description}</span></span>
              </Link>
            ))}
          </div>
          <div>
            <p className="public-menu-label">Meet Jalanin</p>
            {links.slice(2).map(({ href, label, description, icon: Icon }) => (
              <Link key={href} href={href} className="public-mega-link" onClick={closeMenus}>
                <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                <span><span className="block font-medium">{label}</span><span className="block text-sm text-muted-foreground">{description}</span></span>
              </Link>
            ))}
          </div>
        </nav>
        <Link href="/opportunities" className="public-menu-feature" onClick={closeMenus}>
          <Image src="/images/singapore.jpg" alt="Singapore skyline overlooking Marina Bay" fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" />
          <div className="public-menu-feature-shade" />
          <span className="relative z-10 flex h-full flex-col justify-between p-6">
            <span className="self-start rounded-full border border-white/50 px-3 py-1 text-xs tracking-[.08em]">A new perspective</span>
            <span><span className="block text-[28px] font-medium leading-[1.1] tracking-[-.045em]">Your next chapter starts here.</span><span className="mt-4 flex items-center gap-3 text-sm">Browse internships <ArrowRight size={18} strokeWidth={1.6} aria-hidden="true" /></span></span>
          </span>
        </Link>
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
