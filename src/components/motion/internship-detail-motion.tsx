"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function InternshipDetailMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from("[data-detail-reveal]", { y: 20, opacity: 0, duration: .65, stagger: .07, ease: "power2.out", clearProps: "all" });
      gsap.from(".placement-heading-rule", { scaleX: 0, transformOrigin: "left center", duration: .9, ease: "power2.inOut", clearProps: "all" });
      gsap.fromTo(".placement-graphic-path", { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, delay: .15, ease: "power2.inOut", clearProps: "all" });
      gsap.from(".placement-orbit circle", { opacity: 0, duration: .4, stagger: .15, delay: .5, clearProps: "all" });
    });
    return () => media.revert();
  }, { scope: root });
  return <div ref={root}>{children}</div>;
}
