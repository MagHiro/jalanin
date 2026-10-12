import Link from "next/link";
import type { Metadata } from "next";
import {
  listFilterOptions,
  listPublishedInternships,
  COUNTRY_NAMES,
} from "@/features/internships/service";

export const metadata: Metadata = {
  title: "Browse internships",
  description: "Search and filter published internship placements across Southeast Asia.",
};

const PAGE_SIZE = 12;

interface SearchParams {
  q?: string;
  country?: string;
  category?: string;
  sort?: string;
  page?: string;
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const sort =
    searchParams.sort === "title" || searchParams.sort === "start"
      ? searchParams.sort
      : "newest";
  const { rows, total } = await listPublishedInternships({
    q: searchParams.q,
    country: searchParams.country,
    category: searchParams.category,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });
  const { categories, countries } = await listFilterOptions();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hrefFor = (overrides: Record<string, string | undefined>): string => {
    const params = new URLSearchParams();
    const merged: SearchParams = { ...searchParams, ...overrides, page: overrides.page ?? "1" };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/opportunities?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Browse internships</h1>
        <p className="mt-1 text-sm text-slate-600" role="status">
          {total} published {total === 1 ? "placement" : "placements"}
        </p>
      </div>

      {/* Filters — GET form keeps state in shareable URL params (JOB-*) */}
      <form method="get" action="/opportunities" className="grid gap-3 rounded-xl border p-4 md:grid-cols-5">
        <label className="text-sm md:col-span-2">
          <span className="font-medium">Search role or location</span>
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="e.g. hotel, Singapore"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Country</span>
          <select name="country" defaultValue={searchParams.country ?? ""} className="mt-1 w-full rounded border px-3 py-2">
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>{COUNTRY_NAMES[c] ?? c}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium">Category</span>
          <select name="category" defaultValue={searchParams.category ?? ""} className="mt-1 w-full rounded border px-3 py-2">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium">Sort</span>
          <select name="sort" defaultValue={sort} className="mt-1 w-full rounded border px-3 py-2">
            <option value="newest">Newest published</option>
            <option value="title">Title A–Z</option>
            <option value="start">Soonest start</option>
          </select>
        </label>
        <div className="flex items-end gap-2 md:col-span-5">
          <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            Apply filters
          </button>
          <Link href="/opportunities" className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            Reset
          </Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-semibold">No internships match your filters.</p>
          <p className="mt-1 text-sm text-slate-600">Try widening the search or clearing a filter.</p>
          <Link href="/opportunities" className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline">
            Clear all filters
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ internship, categoryName }) => (
            <li key={internship.id} className="flex flex-col rounded-xl border p-5">
              <div className="flex flex-wrap gap-2 text-xs">
                {categoryName && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">{categoryName}</span>
                )}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                  {internship.city}, {COUNTRY_NAMES[internship.countryCode] ?? internship.countryCode}
                </span>
              </div>
              <p className="mt-2 font-semibold">{internship.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                {internship.startDate} → {internship.endDate}
              </p>
              <Link
                href={`/opportunities/${internship.slug}`}
                className="mt-3 text-sm font-medium text-emerald-700 hover:underline"
              >
                View details
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={hrefFor({ page: String(page - 1) })} className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50">
              Previous
            </Link>
          )}
          <span className="text-sm text-slate-600" aria-current="page">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={hrefFor({ page: String(page + 1) })} className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50">
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
