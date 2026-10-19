"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Bell, ChevronRight, Command, Menu, MoveUpRight, Plus, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { gsap } from "gsap";
import { DomainIcon } from "@/components/ui/domain-icon";
import { SignOutButton } from "./sign-out-button";
import type { RailItem } from "./workspace-rail";

export function WorkspaceShell({ children, role, items, switchLink, switchLabel, email }: {
  children: React.ReactNode;
  role: "admin" | "student";
  items: RailItem[];
  switchLink: string;
  switchLabel: string;
  email?: string;
}) {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const mobile = useRef<HTMLDialogElement>(null);
  const palette = useRef<HTMLDialogElement>(null);
  const paletteInput = useRef<HTMLInputElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isAdmin = role === "admin";
  const current = [...items].reverse().find(item => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
  const filtered = items.filter(item => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  const quickHref = isAdmin ? "/admin/internships/new" : "/opportunities";
  const quickLabel = isAdmin ? "New internship" : "Find internships";

  useEffect(() => {
    if (mobile.current?.open) mobile.current.close();
    setSearchOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(open => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && !palette.current?.open) {
      palette.current?.showModal();
      paletteInput.current?.focus();
    } else if (!searchOpen && palette.current?.open) {
      palette.current.close();
    }
  }, [searchOpen]);

  useEffect(() => {
    const node = root.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      const elements = gsap.utils.toArray<HTMLElement>(".workspace-content .page-heading, .workspace-content .workspace-welcome, .workspace-content .workspace-stat, .workspace-content .workspace-priority, .workspace-content .workspace-section, .workspace-content .table-shell, .workspace-content .toolbar, .workspace-content .form-section");
      gsap.fromTo(elements.slice(0, 20), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.52, ease: "power2.out", stagger: 0.035, clearProps: "all", overwrite: "auto" });
    }, node);
    return () => context.revert();
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = palette.current?.querySelector(".workspace-command-inner");
    if (!node) return;
    gsap.fromTo(node, { opacity: 0, y: -12, scale: 0.985 }, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "power2.out" });
  }, [searchOpen]);

  const navigation = <nav aria-label={isAdmin ? "Admin navigation" : "Student navigation"} className="workspace-navigation">
    <p className="workspace-nav-label">{isAdmin ? "Operations" : "My workspace"}<span>MENU</span></p>
    {items.map(item => {
      const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
      return <Link key={item.href} href={item.href} className="workspace-nav-item" aria-current={active ? "page" : undefined} onClick={() => mobile.current?.close()}>
        <span className="workspace-nav-icon"><DomainIcon name={item.icon} size={18} /></span><span>{item.label}</span>
        {!!item.badge && <span className="workspace-nav-count tnum" aria-label={`${item.badge} unread`}>{item.badge}</span>}
        {active && !item.badge && <span className="workspace-nav-active-dot" aria-hidden="true" />}
      </Link>;
    })}
  </nav>;

  const brand = <Link href={isAdmin ? "/admin" : "/dashboard"} className="workspace-brand" aria-label="Jalanin workspace home"><span className="workspace-brand-mark"><MoveUpRight size={23} strokeWidth={2} /></span><span className="workspace-brand-name">jalanin<span className="workspace-brand-role">{isAdmin ? "Operations studio" : "Student portal"}</span></span></Link>;
  const bottom = <div className="workspace-rail-bottom">
    <div className="workspace-quick-card">
      <span className="workspace-quick-icon"><Sparkles size={16} /></span>
      <p className="workspace-quick-title">{isAdmin ? "Keep things moving" : "Your next opportunity"}</p>
      <p className="workspace-quick-copy">{isAdmin ? "Create a listing and give students another path forward." : "Discover your next step across Southeast Asia."}</p>
      <Link href={quickHref} className="workspace-quick-link">{quickLabel}<ArrowUpRight size={15} /></Link>
    </div>
    <p className="workspace-nav-label workspace-nav-label-secondary">Account</p>
    <Link href={switchLink} className="workspace-nav-item"><span className="workspace-nav-icon"><ArrowUpRight size={18} /></span><span>{switchLabel}</span></Link>
    <Link href="/" className="workspace-nav-item"><span className="workspace-nav-icon"><ArrowLeft size={18} /></span><span>Back to website</span></Link>
    <div className="workspace-identity"><span className="workspace-avatar" aria-hidden="true">{(email?.[0] ?? (isAdmin ? "A" : "S")).toUpperCase()}</span><div><p>{isAdmin ? "Administrator" : "Student account"}</p><span title={email}>{email ?? "Signed in"}</span></div><ShieldCheck size={16} aria-label="Authenticated session" /></div>
    <SignOutButton />
  </div>;

  return <div ref={root} className={`workspace-shell workspace-${role}`}>
    <a href="#main" className="workspace-skip-link">Skip to main content</a>
    <aside className="workspace-sidebar">{brand}{navigation}{bottom}</aside>
    <div className="workspace-body">
      <header className="workspace-topbar">
        <div className="workspace-topbar-start">
          <button type="button" className="workspace-menu-button" onClick={() => { if (!mobile.current?.open) mobile.current?.showModal(); }} aria-label="Open workspace navigation" aria-controls="workspace-mobile-navigation" aria-haspopup="dialog"><Menu size={20} /></button>
          <div className="workspace-breadcrumb"><span className="workspace-breadcrumb-root">{isAdmin ? "Operations" : "Workspace"}</span><ChevronRight size={14} aria-hidden="true" /><b>{current?.label ?? "Overview"}</b></div>
        </div>
        <div className="workspace-topbar-end">
          <button ref={searchTrigger} type="button" className="workspace-search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search workspace pages" aria-haspopup="dialog"><Search size={17} /><span>Quick navigation</span><kbd>⌘ K</kbd></button>
          <Link href={isAdmin ? "/admin/notifications" : "/dashboard/applications"} className="workspace-topbar-icon" aria-label={isAdmin ? "Notifications" : "My applications"}>{isAdmin ? <Bell size={18} /> : <DomainIcon name="☰" size={18} />}{isAdmin && items.some(item => item.badge && item.badge > 0) && <span className="workspace-topbar-notice" />}</Link>
          <Link href={quickHref} className="workspace-topbar-cta">{isAdmin ? <Plus size={16} /> : <ArrowUpRight size={16} />}<span>{quickLabel}</span></Link>
        </div>
      </header>
      <main id="main" className="workspace-content">{children}</main>
      <footer className="workspace-footer"><span>© {new Date().getFullYear()} Jalanin · {isAdmin ? "Operations" : "Student workspace"}</span><span>Made for meaningful next steps · <Link href="/privacy">Privacy</Link></span></footer>
    </div>
    <dialog ref={mobile} id="workspace-mobile-navigation" className="workspace-mobile-dialog" aria-label="Workspace navigation" onClick={event => { if (event.target === mobile.current) mobile.current.close(); }}>
      <div className="workspace-mobile-panel"><div className="flex items-center justify-between gap-3">{brand}<button type="button" className="workspace-close-button" aria-label="Close workspace navigation" onClick={() => mobile.current?.close()}><X size={20} /></button></div>{navigation}{bottom}</div>
    </dialog>
    <dialog ref={palette} className="workspace-command-dialog" aria-label="Quick navigation" onClose={() => { setSearchOpen(false); setQuery(""); searchTrigger.current?.focus(); }} onClick={event => { if (event.target === palette.current) setSearchOpen(false); }}>
      <div className="workspace-command-inner">
        <div className="workspace-command-search"><Search size={20} aria-hidden="true" /><input ref={paletteInput} aria-label="Search destinations" value={query} onChange={event => setQuery(event.target.value)} placeholder="Where would you like to go?" autoComplete="off" /><button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={18} /></button></div>
        <div className="workspace-command-results">
          <p className="workspace-command-label">Navigate to</p>
          {filtered.length ? filtered.map(item => <Link key={item.href} href={item.href} className="workspace-command-item" onClick={() => setSearchOpen(false)}><span className="workspace-command-icon"><DomainIcon name={item.icon} size={19} /></span><span>{item.label}</span><ArrowRight size={16} /></Link>) : <p className="workspace-command-empty">No matching pages. Try another search.</p>}
          {!query && <><p className="workspace-command-label">Quick action</p><Link href={quickHref} className="workspace-command-item" onClick={() => setSearchOpen(false)}><span className="workspace-command-icon"><Plus size={19} /></span><span>{quickLabel}</span><ArrowRight size={16} /></Link></>}
        </div>
        <div className="workspace-command-footer"><span><Command size={13} /> K to open</span><span>ESC to close</span></div>
      </div>
    </dialog>
  </div>;
}
