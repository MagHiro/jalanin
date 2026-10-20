"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function OverviewMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.timeline({ defaults: { ease: "power2.out", clearProps: "all" } })
        .from("[data-overview-intro]", { opacity: 0, y: 12, duration: .45, stagger: .065 })
        .from("[data-overview-support]", { opacity: 0, y: 8, duration: .35, stagger: .045 }, "-=.2");
    });
    return () => media.revert();
  }, { scope: root });

  return <div ref={root} className="next-overview">{children}</div>;
}
