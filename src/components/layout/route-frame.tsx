"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";

/** Public chrome belongs only to public routes, never authenticated workspaces. */
export function RouteFrame({ children, header, footer }: { children: ReactNode; header: ReactNode; footer: ReactNode }) {
  const pathname = usePathname();
  const workspace = /^\/(admin|dashboard)(\/|$)/.test(pathname);
  if (workspace) return <>{children}</>;
  if (pathname.startsWith("/auth/")) return <>{children}</>;
  const legal = /^\/(privacy|terms)$/.test(pathname);
  return <div className="public-site">{header}<main id="main" className={`public-main${pathname === "/" ? " public-main-home" : ""}${legal ? " public-legal" : ""}${pathname.startsWith("/auth/") ? " public-auth" : ""}`}>{legal ? <div className="public-legal-layout"><nav aria-label="Legal documents"><p className="eyebrow mb-6">Legal documents</p>{[["/privacy", "Privacy policy"], ["/terms", "Terms of service"]].map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav>{children}</div> : children}</main>{footer}</div>;
}
