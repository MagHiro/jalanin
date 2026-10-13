import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "./cn";

/** Vanta-informed role row; published data only, no prices or partner claims. */
export function InternshipCard({ title, city, country, categoryName, startDate, endDate, href, className }: {
  title: string; city: string; country: string; categoryName?: string | null;
  startDate: string; endDate: string; href: string; className?: string;
}) {
  return <li data-reveal className={cn("opportunity-card", className)}>
    <div className="opportunity-role"><p className="opportunity-label">{categoryName ?? "Internship"}</p><h3><Link href={href}>{title}</Link></h3></div>
    <div className="opportunity-location"><p className="opportunity-label">Location</p><p>{city}, {country}</p></div>
    <div className="opportunity-dates"><p className="opportunity-label">Placement dates</p><p className="tnum"><time>{startDate}</time> – <time>{endDate}</time></p></div>
    <Link href={href} aria-label={`View details for ${title}`} className="opportunity-action">View details <ArrowUpRight size={18} aria-hidden="true" /></Link>
  </li>;
}
