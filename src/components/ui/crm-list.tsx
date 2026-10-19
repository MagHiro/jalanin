import Link from "next/link";
import { ArrowRight, LayoutList, X } from "lucide-react";

/** URL-backed record views preserve pagination, browser history and shareable filters. */
export function listHref(pathname: string, params: Record<string, string | undefined>, changes: Record<string, string | null>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) next.set(key, value);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  if (!Object.prototype.hasOwnProperty.call(changes, "page")) next.delete("page");
  return pathname + (next.size ? "?" + next.toString() : "");
}

export function CrmViews({ items, label = "Record views" }: {
  items: Array<{ label: string; href: string; active: boolean; count?: number }>;
  label?: string;
}) {
  return <nav className="crm-views" aria-label={label}>
    <span className="crm-view-type" aria-hidden="true"><LayoutList size={17} /></span>
    {items.map(item => <Link key={item.href} href={item.href} aria-label={item.label} aria-current={item.active ? "page" : undefined} className="crm-view">
      <span>{item.label}</span>{item.count !== undefined && <span className="crm-view-count tnum">{item.count}</span>}
    </Link>)}
  </nav>;
}

export function CrmFilterChips({ filters, clearHref }: {
  filters: Array<{ label: string; href: string }>; clearHref: string;
}) {
  if (!filters.length) return null;
  return <div className="crm-filters-active" aria-label="Active filters">
    <span>Active filters</span>
    {filters.map(filter => <Link href={filter.href} key={filter.label} aria-label={`Remove ${filter.label} filter`} className="crm-filter-chip">{filter.label}<X size={13} aria-hidden="true" /></Link>)}
    <Link href={clearHref} className="crm-filter-reset">Reset all <X size={13} /></Link>
  </div>;
}

export function CrmTableMeta({ total, page, pageSize, noun, note }: {
  total: number; page: number; pageSize: number; noun: string; note?: string;
}) {
  const first = total ? Math.min((page - 1) * pageSize + 1, total) : 0;
  const last = Math.min(page * pageSize, total);
  return <div className="crm-table-meta" role="status">
    <span className="crm-table-meta-count tnum">{total === 0 ? `0 ${noun}` : `${first}–${last} of ${total} ${noun}`}</span>
    {note && <span className="crm-table-meta-note">{note} <ArrowRight size={13} aria-hidden="true" /></span>}
  </div>;
}
