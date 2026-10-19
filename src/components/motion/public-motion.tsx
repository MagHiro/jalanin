"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Motion is progressive enhancement: HTML is visible before hydration,
 * animations are scoped, and GSAP contexts clean up on unmount.
 */
export function PublicMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!root.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const heroCopy = gsap.utils.toArray<HTMLElement>("[data-hero-copy]");
    const illustration = root.current.querySelector<HTMLElement>("[data-hero-visual]");
    const items = gsap.utils.toArray<HTMLElement>("[data-scroll-reveal]");

    items.forEach(node => node.classList.add("public-revealed"));
    if (reduced) return;

    if (heroCopy.length) {
      gsap.fromTo(heroCopy, { opacity: 0, y: 22 },
        { opacity: 1, y: 0, stagger: 0.085, duration: 0.78, ease: "power3.out", clearProps: "all" });
    }
    if (illustration) {
      gsap.fromTo(illustration, { opacity: 0, x: 28 },
        { opacity: 1, x: 0, duration: 1.1, delay: .13, ease: "power3.out", clearProps: "all" });
    }
    items.forEach(node => {
      gsap.fromTo(node, { opacity: 0, y: 22 }, {
        opacity: 1, y: 0, duration: .7, ease: "power3.out",
        clearProps: "all",
        scrollTrigger: { trigger: node, start: "top 92%", once: true },
      });
    });
  }, { scope: root });

  return <div ref={root}>{children}</div>;
}
