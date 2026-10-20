import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import "./discovery-empty-state.css";

export function DiscoveryEmptyState({ title, description, href, action, variant = "search" }: {
  title: string;
  description: string;
  href: string;
  action: string;
  variant?: "search" | "application";
}) {
  return <Reveal className="discovery-empty" y={8} duration={.3}>
    <div data-reveal>
      <svg className="discovery-empty-graphic" width="112" height="88" viewBox="0 0 112 88" fill="none" aria-hidden="true">
        <rect x="22" y="12" width="52" height="64" rx="8" fill="#f5f7fc" stroke="#cbd5e8" strokeWidth="1.5" />
        <path d="M35 29H60M35 38H60M35 47H49" stroke="#8194bf" strokeWidth="1.5" strokeLinecap="round" />
        {variant === "search" ? <><circle cx="76" cy="56" r="15" fill="white" stroke="#8194bf" strokeWidth="1.5" /><path d="M87 67L97 77" stroke="#102568" strokeWidth="2" strokeLinecap="round" /></> : <><circle cx="76" cy="56" r="15" fill="white" stroke="#cbd5e8" strokeWidth="1.5" /><path d="M70 56H82M77 51L82 56L77 61" stroke="#102568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>}
      </svg>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link href={href} className="discovery-empty-action">{action}<ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
  </Reveal>;
}
