import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "New":
      return "bg-sky-100 text-sky-800";
    case "In Review":
      return "bg-amber-100 text-amber-900";
    case "Quotation Sent":
      return "bg-violet-100 text-violet-900";
    case "Accepted":
    case "Confirmed":
    case "Active":
      return "bg-emerald-100 text-emerald-900";
    case "Rejected":
    case "Cancelled":
      return "bg-rose-100 text-rose-900";
    case "Completed":
      return "bg-slate-200 text-slate-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
