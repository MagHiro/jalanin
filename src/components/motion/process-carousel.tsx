"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ProcessGraphic } from "./process-graphic";

gsap.registerPlugin(useGSAP);

const steps = [
  ["Discover", "Explore roles by country, destination, and professional interest."],
  ["Consider", "Understand dates, responsibilities, and the experience before you apply."],
  ["Apply", "Tell us about your goals. Save your progress and return when you're ready."],
  ["Move forward", "Our team reviews your application and prepares a quotation by email."],
] as const;

export function ProcessCarousel() {
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const description = useRef<HTMLParagraphElement>(null);
  const graphic = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnhanced(!media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useGSAP(() => {
    if (!enhanced || !viewport.current || !track.current) return;
    const windowNode = viewport.current;
    const trackNode = track.current;
    const item = trackNode.children[active] as HTMLElement;
    const position = (animate: boolean) => {
      const x = windowNode.clientWidth / 2 - item.offsetLeft - item.offsetWidth / 2;
      gsap.to(trackNode, { x, duration: animate ? .7 : 0, ease: "power3.out", overwrite: true });
    };
    position(true);
    gsap.fromTo(description.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .45, ease: "power2.out" });
    gsap.fromTo(graphic.current, { opacity: 0, y: 10, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .6, ease: "power3.out" });
    const observer = new ResizeObserver(() => position(false));
    observer.observe(windowNode);
    return () => observer.disconnect();
  }, { scope: root, dependencies: [active, enhanced], revertOnUpdate: true });

  return (
    <div ref={root} className="learn-process-panel" data-carousel={enhanced ? "true" : "false"}>
      <div ref={viewport} className="process-viewport">
        <ol ref={track} className="process-track" aria-label="Your internship journey">
          {steps.map(([title, body], index) => (
            <li key={title} className="learn-process-step" data-active={active === index}>
              <span className="learn-process-number tnum" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3><button type="button" disabled={!enhanced} aria-pressed={enhanced ? active === index : undefined} aria-controls={enhanced ? "process-description" : undefined} onClick={() => setActive(index)}>{title}</button></h3>
                <p className="process-static-description">{body}</p>
                {!enhanced && <ProcessGraphic step={index} />}
              </div>
            </li>
          ))}
        </ol>
      </div>
      {enhanced && <div className="process-detail">
        <div ref={graphic}><ProcessGraphic step={active} /></div>
        <p ref={description} id="process-description" aria-live="polite" aria-atomic="true"><span className="sr-only">{steps[active][0]}. </span>{steps[active][1]}</p>
        <div className="process-controls" role="group" aria-label="Process navigation">
          <button type="button" aria-label="Previous step" disabled={active === 0} onClick={() => setActive(active - 1)}><ArrowLeft size={18} aria-hidden="true" /></button>
          <span className="tnum" aria-hidden="true">{String(active + 1).padStart(2, "0")} / 04</span>
          <button type="button" aria-label="Next step" disabled={active === steps.length - 1} onClick={() => setActive(active + 1)}><ArrowRight size={18} aria-hidden="true" /></button>
        </div>
      </div>}
      <div className="learn-process-footer">
        <Link href="/opportunities" className="learn-process-action">Find your opportunity <ArrowRight size={17} aria-hidden="true" /></Link>
      </div>
    </div>
  );
}
