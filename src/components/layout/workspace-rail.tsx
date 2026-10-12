"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";
import { DomainIcon } from "@/components/ui/domain-icon";
import { ArrowLeftRight, Menu, MoveUpRight, X } from "lucide-react";

export interface RailItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
  exact?: boolean;
}

function isActive(pathname: string, item: RailItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Workspace sidebar (incident.io-informed): dark rail, icon + label rows,
 * active pill, unread badge, bottom workspace card, mobile drawer.
 */
export function WorkspaceRail({
  title,
  eyebrow,
  items,
  footer,
  switchLink,
  switchLabel,
  variant = "dark",
}: {
  title: string;
  eyebrow: string;
  items: RailItem[];
  footer?: React.ReactNode;
  switchLink?: string;
  switchLabel?: string;
  variant?: "dark" | "light";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const light = variant === "light";

  const nav = (
    <nav aria-label={`${title} navigation`} className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={
              light
                ? cn(
                    "inline-flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary",
                    active && "bg-secondary font-semibold text-primary",
                  )
                : "rail-btn"
            }
          >
            <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center text-base">
              <DomainIcon name={item.icon} size={18} />
            </span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {typeof item.badge === "number" && item.badge > 0 && (
              <span
                aria-label={`${item.badge} unread`}
                className={cn(
                  "tnum inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                  light ? "bg-primary text-white" : "bg-jalanin-300 text-jalanin-950",
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar for the workspace */}
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="workspace-rail-drawer"
          className="btn btn-outline btn-sm"
        >
          <Menu size={18} aria-hidden="true" /> {title} menu
        </button>
        {switchLink && (
          <Link href={switchLink} className="btn btn-ghost btn-sm">
            {switchLabel}
          </Link>
        )}
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={`${title} menu`}>
          <div
            aria-hidden="true"
            className="overlay-dim absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <div
            id="workspace-rail-drawer"
            className={cn(
              "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto p-4",
              light ? "bg-surface text-foreground" : "bg-rail text-rail-foreground",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold tracking-tight">
                <span className={cn("block text-[11px] font-semibold uppercase tracking-[0.16em]", light ? "text-muted-foreground" : "text-rail-muted")}>
                  {eyebrow}
                </span>
                {title}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className={cn(
                  "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg",
                  light ? "text-muted-foreground hover:bg-secondary hover:text-primary" : "text-rail-muted hover:bg-rail-raised hover:text-rail-foreground",
                )}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            {nav}
            {footer}
            {switchLink && (
              <Link
                href={switchLink}
                onClick={() => setOpen(false)}
                className={light ? "inline-flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-primary" : "rail-btn mt-auto"}
              >
                <ArrowLeftRight size={16} aria-hidden="true" /> {switchLabel}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Desktop rail */}
      <aside
        aria-label={`${title} navigation`}
        className={cn(
          "hidden h-fit flex-col gap-4 rounded-2xl border p-3 lg:sticky lg:top-24 lg:flex",
          light ? "border-border bg-surface" : "border-transparent bg-rail text-rail-foreground",
        )}
      >
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <span
            aria-hidden="true"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl text-base font-bold",
              light ? "bg-primary text-white" : "bg-jalanin-100 text-jalanin-900",
            )}
          >
            <MoveUpRight size={20} aria-hidden="true" />
          </span>
          <p className="min-w-0 text-sm font-bold leading-tight tracking-tight">
            <span className={cn("block text-[11px] font-semibold uppercase tracking-[0.16em]", light ? "text-muted-foreground" : "text-rail-muted")}>
              {eyebrow}
            </span>
            <span className="truncate">{title}</span>
          </p>
        </div>
        {nav}
        {footer}
        {switchLink && (
          <Link
            href={switchLink}
            className={cn(
              "mt-1 border-t pt-3",
              light
                ? "inline-flex min-h-10 w-full items-center gap-2.5 rounded-lg border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-primary"
                : "rail-btn border-white/10",
            )}
          >
            <ArrowLeftRight size={16} aria-hidden="true" /> {switchLabel}
          </Link>
        )}
      </aside>
    </>
  );
}
