"use client";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { motion } from "./tokens";

gsap.registerPlugin(useGSAP);

/** GSAP sequencing for form sections; reduced-motion users see static content. */
export function Reveal({ children, className, stagger = 0.06, y = 12, duration = 0.4 }: {
  children: React.ReactNode; className?: string; stagger?: number; y?: number; duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      gsap.fromTo(sections, { opacity: 0, y }, { opacity: 1, y: 0, duration, stagger, ease: motion.ease, clearProps: "all" });
    }, ref);
    return () => context.revert();
  }, { scope: ref, dependencies: [duration, stagger, y], revertOnUpdate: true });
  return <div ref={ref} className={className}>{children}</div>;
}
