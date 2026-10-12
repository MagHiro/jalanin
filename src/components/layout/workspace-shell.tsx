"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, ArrowUpRight, Menu, MoveUpRight, X } from "lucide-react";
import { DomainIcon } from "@/components/ui/domain-icon";
import { SignOutButton } from "./sign-out-button";
import type { RailItem } from "./workspace-rail";

gsap.registerPlugin(useGSAP);

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
  const dialog = useRef<HTMLDialogElement>(null);
  const current = [...items].reverse().find(item => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
  useEffect(() => { dialog.current?.close(); }, [pathname]);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(".workspace-content > *", { y: 8, opacity: 0.75 }, { y: 0, opacity: 1, duration: 0.32, ease: "power2.out", clearProps: "all" });
    });
    return () => media.revert();
  }, { scope: root, dependencies: [pathname], revertOnUpdate: true });

  const navigation = <nav aria-label={`${role === "admin" ? "Admin" : "Student"} workspace`}>
    <p className="workspace-nav-label">{role === "admin" ? "Manage" : "Your workspace"}</p>
    {items.map(item => {
      const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
      return <Link key={item.href} href={item.href} className="workspace-nav-item" aria-current={active ? "page" : undefined} onClick={() => dialog.current?.close()}>
        <DomainIcon name={item.icon} size={19} /><span>{item.label}</span>
        {!!item.badge && <span className="workspace-nav-count tnum" aria-label={`${item.badge} unread`}>{item.badge}</span>}
      </Link>;
    })}
  </nav>;
  const brand = <Link href={role === "admin" ? "/admin" : "/dashboard"} className="workspace-brand" aria-label="Jalanin workspace home"><span className="workspace-brand-mark"><MoveUpRight size={22} strokeWidth={1.6} /></span><span>jalanin<span className="workspace-brand-role">{role === "admin" ? "Administration" : "Student workspace"}</span></span></Link>;
  const bottom = <div className="workspace-rail-bottom">
    <Link href={switchLink} className="workspace-nav-item"><ArrowUpRight size={18} /><span>{switchLabel}</span></Link>
    <Link href="/" className="workspace-nav-item"><ArrowLeft size={18} /><span>Back to Jalanin</span></Link>
    <div className="workspace-identity"><span className="workspace-avatar" aria-hidden="true">{(email?.[0] ?? (role === "admin" ? "A" : "S")).toUpperCase()}</span><div><p>{role === "admin" ? "Admin account" : "Your account"}</p><span title={email}>{email ?? "Signed in"}</span></div></div>
    <SignOutButton />
  </div>;

  return <div ref={root} className={`workspace-shell workspace-${role}`}>
    <aside className="workspace-sidebar">{brand}{navigation}{bottom}</aside>
    <div className="workspace-body">
      <header className="workspace-topbar">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" className="workspace-menu-button" onClick={() => dialog.current?.showModal()} aria-label="Open workspace navigation" aria-haspopup="dialog"><Menu size={20} /></button>
          <p className="workspace-breadcrumb"><span>{role === "admin" ? "Administration" : "My workspace"}</span><span aria-hidden="true">/</span><b>{current?.label ?? "Overview"}</b></p>
        </div>
        <Link href={role === "admin" ? "/admin/notifications" : "/opportunities"} className="workspace-topbar-link">{role === "admin" ? "Notifications" : "Explore internships"}<ArrowUpRight size={16} /></Link>
      </header>
      <main id="main" className="workspace-content">{children}</main>
      <footer className="workspace-footer"><span>Jalanin · {role === "admin" ? "A little clarity. A lot of possibility." : "Your next chapter starts here."}</span><Link href="/privacy">Privacy</Link></footer>
    </div>
    <dialog ref={dialog} className="workspace-mobile-dialog" aria-label="Workspace navigation" onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <div className="workspace-mobile-panel"><div className="flex items-center justify-between gap-3">{brand}<button type="button" className="workspace-close-button" aria-label="Close workspace navigation" onClick={() => dialog.current?.close()}><X size={20} /></button></div>{navigation}{bottom}</div>
    </dialog>
  </div>;
}
