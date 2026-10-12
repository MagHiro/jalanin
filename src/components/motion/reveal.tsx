"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/**
 * Selective entrance motion (see docs/design/interaction-motion.md).
 * Hero, card grids, and form sections only — never admin data tables.
 * Content is server-rendered visible; GSAP enhances from a slight offset
 * and always clears props. Reduced-motion users see no animation.
 */
export function Reveal({
  children,
  className,
  stagger = 0.06,
  y = 12,
  duration = 0.4,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const root = ref.current;
      if (!root) return;
      const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
      if (targets.length === 0) return;
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          ease: "power2.out",
          stagger,
          clearProps: "opacity,transform",
          overwrite: "auto",
        },
      );
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
