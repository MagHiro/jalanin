import Link from "next/link";
import { cn } from "./cn";

/**
 * MetricCard — one real DB-derived operational count linking to its
 * filtered list (D06). Never decorative, never a forecast.
 */
export function MetricCard({
  value,
  label,
  href,
  hint,
  tone = "default",
  className,
}: {
  value: number | string;
  label: string;
  href: string;
  hint?: string;
  tone?: "default" | "alert";
  className?: string;
}) {
  return (
    <li
      className={cn(
        "surface-card surface-card-hover p-5",
        tone === "alert" && "metric-card-alert",
        className,
      )}
    >
      <p
        className="tnum text-3xl font-semibold tracking-tight text-foreground"
        aria-label={`${value} ${label}`}
      >
        {value}
      </p>
      <Link
        href={href}
        className="mt-1 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        {label} <span aria-hidden="true">→</span>
      </Link>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </li>
  );
}
