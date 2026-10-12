import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Semantic status colors (incident.io-informed, Jalanin indigo identity).
 * Always rendered via StatusBadge (dot + text) or paired with an explicit
 * text label — never color-only.
 */
export function statusBadgeClass(status: string): string {
  switch (status) {
    case "New":
    case "Preparing":
      return "bg-sky-100 text-sky-900 border-sky-200";
    case "In Review":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "Quotation Sent":
      return "bg-violet-100 text-violet-900 border-violet-200";
    case "Accepted":
    case "Confirmed":
    case "Active":
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    case "Rejected":
    case "Cancelled":
      return "bg-rose-100 text-rose-900 border-rose-200";
    case "Completed":
      return "bg-slate-200 text-slate-800 border-slate-300";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
