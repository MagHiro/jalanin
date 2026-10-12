import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, MapPin } from "lucide-react";
import { cn } from "./cn";

/**
 * InternshipCard — one consistent card for landing + directory.
 * Shows category pill, location, title, dates; single primary action.
 * Never shows salaries or fixed prices (PRD JOB-06/08).
 */
export function InternshipCard({
  title,
  city,
  country,
  categoryName,
  startDate,
  endDate,
  href,
  className,
}: {
  title: string;
  city: string;
  country: string;
  categoryName?: string | null;
  startDate: string;
  endDate: string;
  href: string;
  className?: string;
}) {
  return (
    <li
      data-reveal
      className={cn(
        "surface-card opportunity-card flex flex-col p-6",
        className,
      )}
    >
      <div className="mb-7 flex items-center justify-between"><span className="grid size-12 place-items-center rounded-xl bg-secondary text-primary"><BriefcaseBusiness size={23} strokeWidth={1.5} aria-hidden="true" /></span><ArrowUpRight size={20} className="text-muted-foreground" aria-hidden="true" /></div>
      <div className="flex flex-wrap gap-2 text-xs">
        {categoryName && (
          <span className="rounded-full bg-secondary px-3 py-1 font-medium text-primary">
            {categoryName}
          </span>
        )}
      </div>
      <p className="mt-4 text-xl font-medium leading-snug tracking-tight text-foreground">
        <Link href={href} className="transition-colors hover:text-primary">
          {title}
        </Link>
      </p>
      <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><MapPin size={15} aria-hidden="true" />{city}, {country}</p>
      <p className="tnum mt-2 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays size={15} aria-hidden="true" />
        <time>{startDate}</time> → <time>{endDate}</time>
      </p>
      <Link
        href={href}
        aria-label={`View details for ${title}`}
        className="mt-auto inline-flex min-h-11 w-full items-center justify-between gap-1 border-t border-border pt-5 text-sm font-medium text-primary hover:underline"
      >
        View details
        <ArrowUpRight aria-hidden="true" size={17} />
      </Link>
    </li>
  );
}
