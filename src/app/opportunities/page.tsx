import Link from "next/link";
import type { Metadata } from "next";
import {
  listFilterOptions,
  listPublishedInternships,
  COUNTRY_NAMES,
} from "@/features/internships/service";
import { InternshipCard } from "@/components/ui/internship-card";
import { ActiveFilterChips } from "@/components/ui/active-filter-chips";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/motion/reveal";
import { WorkspaceSelect } from "@/components/ui/workspace-select";

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
    const qs = params.toString();
    return qs ? `/opportunities?${qs}` : "/opportunities";
  };
  const hrefWithout = (key: keyof SearchParams): string => {
    const rest: SearchParams = { ...searchParams };
    delete rest[key];
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...rest, page: "1" })) {
      if (v && k !== "page") params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/opportunities?${qs}` : "/opportunities";
  };

  const categoryNameFor = (slug?: string) =>
    categories.find((c) => c.slug === slug)?.name;

  const chips: Array<{ label: string; href: string }> = [];
  if (searchParams.q) chips.push({ label: `“${searchParams.q}”`, href: hrefWithout("q") });
  if (searchParams.country)
    chips.push({
      label: COUNTRY_NAMES[searchParams.country] ?? searchParams.country,
      href: hrefWithout("country"),
    });
  if (searchParams.category)
    chips.push({
      label: categoryNameFor(searchParams.category) ?? searchParams.category,
      href: hrefWithout("category"),
    });

  const sortLabel =
    sort === "title" ? "Title A–Z" : sort === "start" ? "Soonest start" : "Newest published";

  return (
    <div className="opportunity-directory space-y-9">
      <div className="learn-directory-heading">
        <div><p className="eyebrow">Explore opportunities</p><h1 className="section-title mt-4 max-w-2xl">Find an experience that moves you forward.</h1></div>
        <div><p className="mb-4 max-w-sm leading-7 text-muted-foreground">A new city. Real-world experience. Discover a placement that fits your next chapter.</p><span role="status" className="tnum text-sm text-muted-foreground">
            {total} published {total === 1 ? "placement" : "placements"}
            {total > 0 && <> · sorted by {sortLabel}</>}
          </span></div>
      </div>

      {/* Filters — GET form keeps state in shareable URL params (JOB-*) */}
      <form
        method="get"
        action="/opportunities"
        aria-label="Search and filter internships"
        className="learn-filters grid gap-4 md:grid-cols-2 xl:grid-cols-6"
      >
        <label className="field-label md:col-span-2">
          <span>Search role or location</span>
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="e.g. hotel, Singapore"
            autoComplete="off"
            className="field"
          />
        </label>
        <label className="field-label">
          <span>Country</span>
          <WorkspaceSelect name="country" ariaLabel="Country" defaultValue={searchParams.country ?? ""} options={[{ value: "", label: "All countries" }, ...countries.map(c => ({ value: c, label: COUNTRY_NAMES[c] ?? c }))]} />
        </label>
        <label className="field-label">
          <span>Category</span>
          <WorkspaceSelect name="category" ariaLabel="Category" defaultValue={searchParams.category ?? ""} options={[{ value: "", label: "All categories" }, ...categories.map(c => ({ value: c.slug, label: c.name }))]} />
        </label>
        <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto] md:col-span-2">
          <label className="field-label">
            <span>Sort</span>
            <WorkspaceSelect name="sort" ariaLabel="Sort" defaultValue={sort} options={[{ value: "newest", label: "Newest published" }, { value: "title", label: "Title A–Z" }, { value: "start", label: "Soonest start" }]} />
          </label>
          <div className="flex gap-2 pb-0.5">
            <button type="submit" className="btn btn-primary btn-sm min-h-11">
              Apply filters
            </button>
            <Link href="/opportunities" className="btn btn-outline btn-sm min-h-11">
              Reset
            </Link>
          </div>
        </div>
      </form>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <ActiveFilterChips chips={chips} />
          <Link href="/opportunities" className="text-xs font-semibold text-muted-foreground hover:text-primary hover:underline">
            Clear all
          </Link>
        </div>
      )}

      <div className="learn-results-heading">
        <div><p className="eyebrow">Your possibilities</p><h2>Available internships <span className="tnum">{total}</span></h2></div>
        <p>{chips.length > 0 ? "Results reflect your selected filters." : "Browse the latest published opportunities, or narrow your search above."}</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="○"
          title="No internships match your filters."
          body="Try widening the search or clearing a filter — new placements are added regularly."
          actionHref="/opportunities"
          actionLabel="Clear all filters"
        />
      ) : (
        <Reveal>
          <ul className="learn-opportunity-grid">
            {rows.map(({ internship, categoryName }) => (
              <InternshipCard
                key={internship.id}
                title={internship.title}
                city={internship.city}
                country={COUNTRY_NAMES[internship.countryCode] ?? internship.countryCode}
                categoryName={categoryName}
                startDate={internship.startDate}
                endDate={internship.endDate}
                href={`/opportunities/${internship.slug}`}
              />
            ))}
          </ul>
        </Reveal>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link href={hrefFor({ page: String(page - 1) })} className="btn btn-outline btn-sm min-h-11">
              ← Previous
            </Link>
          ) : (
            <span aria-hidden="true" className="btn btn-outline btn-sm min-h-11 pointer-events-none opacity-40">← Previous</span>
          )}
          <span className="tnum text-sm text-muted-foreground" aria-current="page">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={hrefFor({ page: String(page + 1) })} className="btn btn-outline btn-sm min-h-11">
              Next →
            </Link>
          ) : (
            <span aria-hidden="true" className="btn btn-outline btn-sm min-h-11 pointer-events-none opacity-40">Next →</span>
          )}
        </nav>
      )}
    </div>
  );
}
