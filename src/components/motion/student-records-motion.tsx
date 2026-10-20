"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function StudentRecordsMotion({ children, viewKey = "all", className = "" }: { children: React.ReactNode; viewKey?: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".page-heading, .crm-views, .crm-records, .student-placement-collection, .student-submission-header, .student-submission-grid > section, .student-submission-progress > section", {
        opacity: 0, y: 10, duration: .4, stagger: .06, ease: "power2.out", clearProps: "all",
      });
    });
    return () => media.revert();
  }, { scope: root, dependencies: [viewKey], revertOnUpdate: true });
  return <div ref={root} className={`crm-list-page student-records-page ${className}`}>{children}</div>;
}
