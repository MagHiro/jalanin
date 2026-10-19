"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowUpRight, MoreHorizontal } from "lucide-react";

export function RecordActions({ primary, items }: { primary: { href: string; label: string }; items: Array<{ href: string; label: string; external?: boolean }> }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = "record-actions-" + primary.href.replace(/[^a-z0-9]/gi, "-");

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    function closeOutside(event: PointerEvent) {
      if (root.current?.contains(event.target as Node) || menu.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    }
    function closeOnScroll(event: Event) {
      if (menu.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", closeOnScroll);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", closeOnScroll);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [open]);

  function toggle() {
    if (!open && trigger.current) {
      const box = trigger.current.getBoundingClientRect();
      const menuHeight = Math.max(48, items.length * 40 + 10);
      setPosition({
        left: Math.max(8, Math.min(window.innerWidth - 198, box.right - 190)),
        top: box.bottom + menuHeight + 8 < window.innerHeight ? box.bottom + 6 : Math.max(8, box.top - menuHeight - 6),
      });
    }
    setOpen(value => !value);
  }

  return <div ref={root} className="workspace-row-actions">
    <Link href={primary.href} className="btn btn-outline btn-sm">{primary.label}</Link>
    <button ref={trigger} type="button" className="workspace-row-menu-button" aria-label="More record actions" aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} onClick={toggle}><MoreHorizontal size={18} /></button>
    {open && createPortal(<div ref={menu} id={menuId} role="menu" aria-label="Record options" className="workspace-row-menu" style={{ position: "fixed", top: position.top, left: position.left, right: "auto" }} onKeyDown={event => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const links = Array.from(menu.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []);
      const index = links.indexOf(document.activeElement as HTMLAnchorElement);
      links[(index + links.length + (event.key === "ArrowDown" ? 1 : -1)) % links.length]?.focus();
    }}>
      {items.map(item => <Link key={item.href} role="menuitem" className="workspace-row-menu-link" href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined} onClick={() => setOpen(false)}>{item.label}{item.external && <ArrowUpRight size={14} />}</Link>)}
    </div>, document.body)}
  </div>;
}
