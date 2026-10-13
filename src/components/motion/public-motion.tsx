"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** Public-only enhancement: content remains visible without JavaScript. */
export function PublicMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    let observer: IntersectionObserver | undefined;
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo("[data-hero-image]", { scale: 1.035 }, { scale: 1, duration: 1.2, ease: "power2.out", clearProps: "transform" });
      gsap.fromTo("[data-hero-copy]", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.09, clearProps: "opacity,transform" });
      const context = gsap.context(() => {}, root);
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          context.add(() => gsap.fromTo(entry.target, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power2.out", clearProps: "opacity,transform" }));
          observer?.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      root.current?.querySelectorAll("[data-scroll-reveal]").forEach((el) => observer?.observe(el));
      return () => { observer?.disconnect(); context.revert(); };
    });
    return () => { observer?.disconnect(); media.revert(); };
  }, { scope: root });
  return <div ref={root}>{children}</div>;
}
