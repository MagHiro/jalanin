"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/** GSAP sequencing for form sections; reduced-motion users see static content. */
export function Reveal({ children, className, stagger = 0.06, y = 12, duration = 0.4 }: {
  children: React.ReactNode; className?: string; stagger?: number; y?: number; duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      gsap.fromTo(sections, { opacity: 0, y }, { opacity: 1, y: 0, duration, stagger, ease: "power2.out", clearProps: "all" });
    }, ref);
    return () => context.revert();
  }, [duration, stagger, y]);
  return <div ref={ref} className={className}>{children}</div>;
}
