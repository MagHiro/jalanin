"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function DestinationMotion({ children, refreshKey }: { children: React.ReactNode; refreshKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from("[data-destination-reveal]", { y: 18, opacity: 0, duration: .65, stagger: .09, ease: "power2.out", clearProps: "all" });
      gsap.fromTo("[data-route-line]", { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.5, delay: .35, ease: "power2.inOut", clearProps: "all" });
    });
    return () => media.revert();
  }, { scope: ref, dependencies: [refreshKey], revertOnUpdate: true });
  return <div ref={ref}>{children}</div>;
}
