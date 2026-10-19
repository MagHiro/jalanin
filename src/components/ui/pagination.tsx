import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Shareable URL-based pagination with a visible page window and jump points. */
export function Pagination({
  page, totalPages, pathname, searchParams, total, pageSize = 20,
}: {
  page: number;
  totalPages: number;
  pathname: string;
  searchParams: Record<string, string | undefined>;
  total?: number;
  pageSize?: number;
}) {
  if (totalPages <= 1 && page <= 1) return null;
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    params.set("page", String(target));
    return `${pathname}?${params}`;
  };
  const current = Math.max(1, Math.min(page, totalPages));
  const first = Math.max(1, Math.min(current - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => first + index);
  const range = total === undefined
    ? `Page ${current} of ${totalPages}`
    : `${total === 0 ? 0 : Math.min((current - 1) * pageSize + 1, total)}–${Math.min(current * pageSize, total)} of ${total}`;

  return <nav aria-label="Pagination" className="crm-pagination workspace-pagination">
    <span className="workspace-pagination-range tnum" role="status">{range}</span>
    <div className="workspace-pagination-pages">
      {current > 1 ? <Link href={pageHref(current - 1)} aria-label="Previous page" className="workspace-page-arrow"><ChevronLeft size={17} /></Link> : <span className="workspace-page-arrow is-disabled" aria-hidden="true"><ChevronLeft size={17} /></span>}
      {first > 1 && <><Link href={pageHref(1)} aria-label="Go to page 1" className="workspace-page-number">1</Link>{first > 2 && <span className="workspace-page-gap" aria-hidden="true">…</span>}</>}
      {pages.map(number => <Link key={number} href={pageHref(number)} aria-current={number === current ? "page" : undefined} aria-label={`Go to page ${number}`} className="workspace-page-number tnum">{number}</Link>)}
      {pages[pages.length - 1] < totalPages && <>{pages[pages.length - 1] < totalPages - 1 && <span className="workspace-page-gap" aria-hidden="true">…</span>}<Link href={pageHref(totalPages)} aria-label={`Go to last page, ${totalPages}`} className="workspace-page-number tnum">{totalPages}</Link></>}
      {current < totalPages ? <Link href={pageHref(current + 1)} aria-label="Next page" className="workspace-page-arrow"><ChevronRight size={17} /></Link> : <span className="workspace-page-arrow is-disabled" aria-hidden="true"><ChevronRight size={17} /></span>}
    </div>
  </nav>;
}
