import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  pathname,
  searchParams,
}: {
  page: number;
  totalPages: number;
  pathname: string;
  searchParams: Record<string, string | undefined>;
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

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-3 text-sm">
      {page > 1 && <Link href={pageHref(Math.min(page - 1, totalPages))} className="btn btn-outline btn-sm">Previous</Link>}
      <span className="tnum text-muted-foreground" role="status">Page {page} of {totalPages}</span>
      {page < totalPages && <Link href={pageHref(page + 1)} className="btn btn-outline btn-sm">Next</Link>}
    </nav>
  );
}
