"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

gsap.registerPlugin(useGSAP);

export function StudentProfileMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".workspace-student-record-heading, .workspace-record-section", {
        opacity: 0, y: 8, duration: .35, stagger: .04, ease: "power2.out", clearProps: "all",
      });
    });
    return () => media.revert();
  }, { scope: root });
  return <div ref={root} className="workspace-student-record student-profile-calm">{children}</div>;
}
