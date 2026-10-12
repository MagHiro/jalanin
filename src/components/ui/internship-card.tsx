import Link from "next/link";
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
        "surface-card surface-card-hover flex flex-col p-6",
        className,
      )}
    >
      <div className="flex flex-wrap gap-2 text-xs">
        {categoryName && (
          <span className="rounded-full bg-jalanin-100 px-3 py-1 font-semibold text-jalanin-800">
            {categoryName}
          </span>
        )}
        <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
          {city}, {country}
        </span>
      </div>
      <p className="mt-4 text-lg font-semibold tracking-tight text-foreground">
        <Link href={href} className="transition-colors hover:text-primary">
          {title}
        </Link>
      </p>
      <p className="tnum mt-2 text-sm text-muted-foreground">
        <time>{startDate}</time> → <time>{endDate}</time>
      </p>
      <Link
        href={href}
        aria-label={`View details for ${title}`}
        className="mt-5 inline-flex min-h-11 w-fit items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        View details
        <span aria-hidden="true">→</span>
      </Link>
    </li>
  );
}
