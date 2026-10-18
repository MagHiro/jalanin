"use client";

import { useEffect, useRef } from "react";

/**
 * Optional browser-native entrance transitions for grouped form sections.
 * No motion is required to read or use the form; unsupported browsers and
 * reduced-motion preferences render the content immediately.
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

  useEffect(() => {
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nodes = ref.current.querySelectorAll<HTMLElement>("[data-reveal]");
    const animations = Array.from(nodes).flatMap((node, index) => {
      if (typeof node.animate !== "function") return [];
      return [node.animate(
        [
          { opacity: 0.82, transform: `translateY(${y}px)` },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: duration * 1000,
          delay: index * stagger * 1000,
          easing: "ease-out",
        },
      )];
    });
    return () => animations.forEach((animation) => animation.cancel());
  }, [duration, stagger, y]);

  return <div ref={ref} className={className}>{children}</div>;
}
