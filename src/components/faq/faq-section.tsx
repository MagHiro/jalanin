"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Verbatim copy from https://internship.jalanin.com/faq.
export const faqItems = [
  ["1. Who is eligible to apply?", "Singaporean university students who meet their institution's internship requirements and demonstrate strong interest in Southeast Asian business and culture."],
  ["2. What types of companies will I be placed in?", "Leading corporations and dynamic startup companies across various industries in Indonesia."],
  ["3. How are placements decided?", "Placements are aligned with students' field of study and career interests through a comprehensive matching process."],
  ["4. Is this internship paid?", "Compensation varies by company, but all placements provide valuable professional experience."],
  ["5. What support will Jalanin provide during the internship?", "Jalanin provides comprehensive support including cultural orientation, mentorship, and ongoing assistance throughout the program."],
  ["6. Will accommodation be provided?", "Accommodation arrangements are provided to ensure a smooth transition for international students."],
  ["7. Do I need to speak Bahasa Indonesia?", "Basic Bahasa Indonesia is helpful but not required. English is widely used in business settings."],
  ["8. What are the working hours and environment like?", "Standard business hours with a collaborative and inclusive work environment."],
  ["9. How will my performance be evaluated?", "Through pre-, mid-, and post-program assessments, company feedback, and Jalanin evaluations."],
  ["10. Will this internship count toward my university’s academic requirements?", "Yes, the program is structured to fulfill academic internship requirements."],
  ["11. What kind of visa will I need?", "Student visa or appropriate work visa as required by Indonesian immigration."],
  ["12. What safety measures are in place?", "Comprehensive safety protocols, emergency support, and regular check-ins ensure student wellbeing."],
  ["13. Are there networking or cultural activities?", "Yes, including networking events, hackathons, and cultural immersion programs."],
  ["14. What happens after the program ends?", "Alumni network access, career support, and opportunities for continued engagement with Indonesia."],
] as const;

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const root = useRef<HTMLDetailsElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const expanded = useRef(false);
  const { contextSafe } = useGSAP({ scope: root });

  const toggle = contextSafe((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const details = root.current;
    const content = panel.current;
    if (!details || !content) return;
    expanded.current = !expanded.current;
    const opening = expanded.current;
    gsap.killTweensOf(content);
    const height = details.open ? content.getBoundingClientRect().height : 0;
    details.open = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.fromTo(content, { height }, {
      height: opening ? content.scrollHeight : 0,
      duration: reduced ? 0 : 0.32,
      ease: "power2.inOut",
      onComplete: () => {
        details.open = opening;
        gsap.set(content, { clearProps: "height" });
        ScrollTrigger.refresh();
      },
    });
    gsap.to(details.querySelector("svg"), {
      rotation: opening ? 180 : 0, duration: reduced ? 0 : 0.25, overwrite: true,
    });
  });

  return (
    <details ref={root} className="faq-item">
      <summary onClick={toggle}>{question}<ChevronDown size={18} aria-hidden="true" /></summary>
      <div ref={panel} className="faq-answer"><p>{answer}</p></div>
    </details>
  );
}

export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="learn-section jalanin-faq scroll-mt-28">
      <header data-scroll-reveal className="faq-heading">
        <svg className="faq-graphic" viewBox="0 0 120 88" fill="none" aria-hidden="true" focusable="false">
          <circle cx="60" cy="44" r="40" fill="currentColor" opacity=".04" />
          <path d="M66 36h27a8 8 0 0 1 8 8v17a8 8 0 0 1-8 8h-5v11L75 69H64a8 8 0 0 1-8-8v-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M27 13h43a9 9 0 0 1 9 9v24a9 9 0 0 1-9 9H44L29 67V55h-2a9 9 0 0 1-9-9V22a9 9 0 0 1 9-9Z" fill="var(--background)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M34 29h29M34 39h19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M95 14v8m-4-4h8M10 72v6m-3-3h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".4" />
        </svg>
        <h2 id="faq-heading">Frequently asked questions</h2>
        <p>Everything you need to know about the internship program</p>
      </header>
      <div className="faq-list">
        {faqItems.map(([question, answer]) => <FaqItem key={question} question={question} answer={answer} />)}
      </div>
      <p className="faq-contact">Have other questions?<br /><Link href="#contact">Contact us</Link></p>
    </section>
  );
}
