"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Public chrome belongs only to public routes, never authenticated workspaces. */
export function RouteFrame({ children, header, footer }: { children: ReactNode; header: ReactNode; footer: ReactNode }) {
  const pathname = usePathname();
  const workspace = /^\/(admin|dashboard)(\/|$)/.test(pathname);
  if (workspace) return <>{children}</>;
  return <>{header}<main id="main" className="mx-auto w-full max-w-[1280px] px-5 py-8 md:px-10 md:py-12">{children}</main>{footer}</>;
}
