"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight progressive reveal for public sections. Content is visible
 * without JS and animations are browser-native; no GSAP runtime is shipped
 * on landing and directory routes.
 */
export function PublicMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !root.current ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("public-revealed");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12 });
    root.current.querySelectorAll("[data-scroll-reveal]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return <div ref={root}>{children}</div>;
}
