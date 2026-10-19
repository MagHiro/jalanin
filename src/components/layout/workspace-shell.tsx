"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Bell, BriefcaseBusiness, ChevronRight, Command, Compass, LayoutGrid, Menu, PanelLeftClose, PanelLeftOpen, Plus, Search, ShieldCheck, X } from "lucide-react";
import { gsap } from "gsap";
import { DomainIcon } from "@/components/ui/domain-icon";
import { SignOutButton } from "./sign-out-button";
import type { RailItem } from "./workspace-rail";

type NavGroup = { label: string; items: RailItem[] };

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
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const isAdmin = role === "admin";
  const home = isAdmin ? "/admin" : "/dashboard";
  const placementContext = pathname.startsWith("/admin/placements");
  const quickHref = isAdmin ? (placementContext ? "/admin/placements/new" : "/admin/internships/new") : "/opportunities";
  const quickLabel = isAdmin ? (placementContext ? "New placement" : "New internship") : "Explore internships";
  const current = [...items].reverse().find(item => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
  const filtered = items.filter(item => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  const unread = items.find(item => item.href.endsWith("/notifications"))?.badge ?? 0;
  const groups: NavGroup[] = isAdmin
    ? [
        { label: "Home", items: items.filter(item => item.href === home) },
        { label: "Management", items: items.filter(item => ["/admin/internships", "/admin/applications", "/admin/students", "/admin/placements"].includes(item.href)) },
        { label: "Communication", items: items.filter(item => ["/admin/contacts", "/admin/notifications"].includes(item.href)) },
      ]
    : [
        { label: "Home", items: items.filter(item => item.href === home) },
        { label: "My journey", items: items.filter(item => item.href.startsWith("/dashboard/")) },
        { label: "More", items: items.filter(item => item.href === "/admin") },
      ];

  useEffect(() => {
    try { setCollapsed(window.localStorage.getItem("jalanin:rail-collapsed") === "1"); } catch { /* optional preference */ }
  }, []);

  function toggleRail() {
    setCollapsed(previous => {
      const next = !previous;
      try { window.localStorage.setItem("jalanin:rail-collapsed", next ? "1" : "0"); } catch { /* storage disabled */ }
      return next;
    });
  }

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
      const sections = gsap.utils.toArray<HTMLElement>(".workspace-content .workspace-page-heading, .workspace-content .workspace-welcome, .workspace-content .workspace-stat, .workspace-content .workspace-data-card, .workspace-content .page-heading, .workspace-content .table-shell, .workspace-content .crm-records, .workspace-content .workspace-record-section, .workspace-content .toolbar, .workspace-content .form-section");
      gsap.fromTo(sections.slice(0, 18), { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: 0.36, ease: "power2.out", stagger: 0.027, clearProps: "all", overwrite: "auto" });
    }, node);
    return () => context.revert();
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = palette.current?.querySelector(".workspace-command-inner");
    if (!node) return;
    const tween = gsap.fromTo(node, { opacity: 0, y: -9 }, { opacity: 1, y: 0, duration: 0.18, ease: "power2.out", clearProps: "all" });
    return () => { tween.kill(); };
  }, [searchOpen]);

  const brand = <Link href={home} className="workspace-brand" aria-label="Jalanin workspace home">
    <span className="workspace-brand-mark" aria-hidden="true">j<span>.</span></span>
    <span className="workspace-brand-name">jalanin<span className="workspace-brand-role">{isAdmin ? "Admin workspace" : "Student workspace"}</span></span>
  </Link>;

  const navigation = <nav aria-label={isAdmin ? "Admin navigation" : "Student navigation"} className="workspace-navigation">
    {groups.filter(group => group.items.length > 0).map(group => <div className="workspace-nav-group" key={group.label}>
      <p className="workspace-nav-label">{group.label}</p>
      {group.items.map(item => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return <Link key={item.href} href={item.href} className="workspace-nav-item" title={item.label} aria-label={item.label} aria-current={active ? "page" : undefined} onClick={() => mobile.current?.close()}>
          <span className="workspace-nav-icon"><DomainIcon name={item.icon} size={18} /></span>
          <span className="workspace-nav-text">{item.label}</span>
          {!!item.badge && <span className="workspace-nav-count tnum" aria-label={`${item.badge} unread`}>{item.badge}</span>}
        </Link>;
      })}
    </div>)}
  </nav>;

  const bottom = <div className="workspace-rail-bottom">
    <div className="workspace-sidebar-shortcuts">
      <Link href={switchLink} className="workspace-sidebar-shortcut">{isAdmin ? <LayoutGrid size={17} /> : <Compass size={17} />}<span>{switchLabel}</span></Link>
      <Link href="/" className="workspace-sidebar-shortcut"><ArrowLeft size={17} /><span>Back to website</span></Link>
    </div>
    <div className="workspace-account">
      <span className="workspace-avatar" aria-hidden="true">{(email?.[0] ?? (isAdmin ? "A" : "S")).toUpperCase()}</span>
      <div className="workspace-account-meta"><p>{isAdmin ? "Administrator" : "Student account"}</p><span title={email}>{email ?? "Signed in"}</span></div>
      <ShieldCheck size={16} className="workspace-account-verified" aria-label="Authenticated" />
    </div>
    <div className="workspace-account-actions"><SignOutButton /></div>
  </div>;

  return <div ref={root} className={`workspace-shell workspace-${role}${collapsed ? " workspace-collapsed" : ""}`}>
    <a href="#main" className="workspace-skip-link">Skip to main content</a>
    <aside className="workspace-sidebar">{brand}<button type="button" className="workspace-rail-toggle" onClick={toggleRail} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>{navigation}{bottom}</aside>
    <div className="workspace-body">
      <header className="workspace-topbar">
        <div className="workspace-topbar-start">
          <button type="button" className="workspace-menu-button" onClick={() => { if (!mobile.current?.open) mobile.current?.showModal(); }} aria-label="Open workspace navigation" aria-controls="workspace-mobile-navigation" aria-haspopup="dialog"><Menu size={20} /></button>
          <div className="workspace-breadcrumb"><span className="workspace-breadcrumb-root">{isAdmin ? "Workspace / Admin" : "Workspace / Student"}</span><ChevronRight size={15} aria-hidden="true" /><b>{current?.label ?? "Overview"}</b></div>
        </div>
        <div className="workspace-topbar-end">
          <button ref={searchTrigger} type="button" className="workspace-search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search workspace pages" aria-haspopup="dialog"><Search size={17} /><span>Search pages</span><kbd>⌘ K</kbd></button>
          <Link href={isAdmin ? "/admin/notifications" : "/dashboard/applications"} className="workspace-topbar-icon" aria-label={isAdmin ? "Notifications" : "My applications"}>{isAdmin ? <Bell size={18} /> : <BriefcaseBusiness size={18} />}{isAdmin && unread > 0 && <span className="workspace-topbar-notice" />}</Link>
          <Link href={quickHref} className="workspace-topbar-cta">{isAdmin ? <Plus size={17} /> : <Compass size={17} />}<span>{quickLabel}</span></Link>
        </div>
      </header>
      <main id="main" className="workspace-content">{children}</main>
      <nav className="workspace-mobile-bottom-nav" aria-label="Quick workspace navigation">{items.filter(item => isAdmin ? ["/admin", "/admin/applications", "/admin/internships", "/admin/notifications"].includes(item.href) : ["/dashboard", "/dashboard/applications", "/dashboard/placements"].includes(item.href)).map(item => { const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"); return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}><DomainIcon name={item.icon} size={19} /><span>{item.label}</span>{!!item.badge && <i aria-label={item.badge + " unread"} />}</Link>; })}</nav>
      <footer className="workspace-footer"><span>© {new Date().getFullYear()} Jalanin</span><span>Built for the next step · <Link href="/privacy">Privacy</Link></span></footer>
    </div>
    <dialog ref={mobile} id="workspace-mobile-navigation" className="workspace-mobile-dialog" aria-label="Workspace navigation" onClick={event => { if (event.target === mobile.current) mobile.current.close(); }}>
      <div className="workspace-mobile-panel"><div className="flex items-center justify-between gap-2">{brand}<button type="button" className="workspace-close-button" aria-label="Close workspace navigation" onClick={() => mobile.current?.close()}><X size={20} /></button></div>{navigation}{bottom}</div>
    </dialog>
    <dialog ref={palette} className="workspace-command-dialog" aria-label="Quick navigation" onClose={() => { setSearchOpen(false); setQuery(""); searchTrigger.current?.focus(); }} onClick={event => { if (event.target === palette.current) setSearchOpen(false); }}>
      <div className="workspace-command-inner">
        <div className="workspace-command-search"><Search size={20} aria-hidden="true" /><input ref={paletteInput} aria-label="Search destinations" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search workspace pages…" autoComplete="off" /><button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={18} /></button></div>
        <div className="workspace-command-results">
          <p className="workspace-command-label">Pages</p>
          {filtered.length ? filtered.map(item => <Link key={item.href} href={item.href} className="workspace-command-item" onClick={() => setSearchOpen(false)}><span className="workspace-command-icon"><DomainIcon name={item.icon} size={18} /></span><span>{item.label}</span><ArrowRight size={15} /></Link>) : <p className="workspace-command-empty">No matching pages. Try another search.</p>}
          {!query && <><p className="workspace-command-label">Quick action</p><Link href={quickHref} className="workspace-command-item" onClick={() => setSearchOpen(false)}><span className="workspace-command-icon"><Plus size={18} /></span><span>{quickLabel}</span><ArrowRight size={15} /></Link></>}
        </div>
        <div className="workspace-command-footer"><span><Command size={13} /> K to open</span><span>Esc to close</span></div>
      </div>
    </dialog>
  </div>;
}
