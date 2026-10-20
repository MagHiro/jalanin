"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

gsap.registerPlugin(useGSAP);

export function ApplicationReviewMotion({ children, revision, status }: {
  children: React.ReactNode;
  revision: number;
  status: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".application-review-header, .application-review-highlights, .application-review-grid section", {
        opacity: 0, y: 8, duration: .35, stagger: .04, ease: "power2.out", clearProps: "all",
      });
    });
    return () => media.revert();
  }, { scope: root, dependencies: [revision, status], revertOnUpdate: true });
  return <div ref={root} className="application-review application-review-calm workspace-record-detail min-w-0">{children}</div>;
}
