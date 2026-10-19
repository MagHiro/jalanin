"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MoreHorizontal } from "lucide-react";
export function RecordActions({ primary, items }: { primary: { href: string; label: string }; items: Array<{ href: string; label: string; external?: boolean }> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div ref={ref} className="workspace-row-actions"><Link href={primary.href} className="btn btn-outline btn-sm">{primary.label}</Link><button type="button" className="workspace-row-menu-button" aria-label="More record actions" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(v => !v)}><MoreHorizontal size={18} /></button>
    {open && <div role="menu" className="workspace-row-menu">{items.map(item => <Link key={item.href} role="menuitem" className="workspace-row-menu-link" href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined} onClick={() => setOpen(false)}>{item.label}{item.external && <ArrowUpRight size={14} />}</Link>)}</div>}
  </div>;
}
