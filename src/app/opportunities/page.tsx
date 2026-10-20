import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import {
  listFilterOptions,
  listPublishedInternships,
  COUNTRY_NAMES,
} from "@/features/internships/service";
import { ActiveFilterChips } from "@/components/ui/active-filter-chips";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/motion/reveal";
import { WorkspaceSelect } from "@/components/ui/workspace-select";
import { DestinationMotion } from "@/components/motion/destination-motion";

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
    <DestinationMotion refreshKey={JSON.stringify(searchParams)}>
    <div className="destination-directory">
      <header className="destination-intro" data-destination-reveal>
        <div><p className="destination-kicker"><span aria-hidden="true" />A new perspective</p><h1>Find an experience that<br />moves you forward.</h1></div>
        <p>A new city. Real-world experience. Discover a placement that fits your next chapter.</p>
      </header>
      <figure className="destination-photo" data-destination-reveal>
        <Image src="/images/singapore.jpg" alt="Singapore’s waterfront and city skyline" fill priority sizes="(max-width: 767px) 100vw, 1200px" />
        <figcaption><MapPin size={16} aria-hidden="true" /> Singapore, Southeast Asia<span>Somewhere new. Something next.</span></figcaption>
        <svg className="destination-route" viewBox="0 0 360 180" fill="none" aria-hidden="true"><path data-route-line d="M18 142C90 142 63 30 148 40S240 170 328 32" pathLength="1" /><circle cx="18" cy="142" r="5" /><circle cx="328" cy="32" r="7" /><circle cx="328" cy="32" r="16" /></svg>
      </figure>

      <div className="destination-layout">
        <aside className="destination-sidebar" data-destination-reveal>
          <nav aria-label="Filter by destination">
            <p>Explore by destination</p>
            <Link href={hrefWithout("country")} aria-current={!searchParams.country ? "page" : undefined}>All destinations <ArrowUpRight size={18} aria-hidden="true" /></Link>
            {countries.map(country => <Link key={country} href={hrefFor({ country })} aria-current={searchParams.country === country ? "page" : undefined}>{COUNTRY_NAMES[country] ?? country}<ArrowUpRight size={18} aria-hidden="true" /></Link>)}
          </nav>
          <div className="destination-note"><svg viewBox="0 0 140 90" fill="none" aria-hidden="true"><path d="M12 70C48 70 25 18 66 18S90 72 126 36" stroke="currentColor" strokeDasharray="3 5" /><circle cx="12" cy="70" r="4" fill="currentColor" /><circle cx="126" cy="36" r="9" stroke="currentColor" /><path d="M121 36h10m-5-5v10" stroke="currentColor" /></svg><p>Your next chapter<br />starts with a little curiosity.</p></div>
        </aside>
        <section className="destination-results" aria-labelledby="destination-results-title">

      {/* Filters — GET form keeps state in shareable URL params (JOB-*) */}
      <form
        method="get"
        action="/opportunities"
        aria-label="Search and filter internships"
        className="destination-filters"
      >
        <label className="field-label destination-search">
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
        <div className="destination-sort">
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

      <div className="destination-results-heading">
        <h2 id="destination-results-title">Available internships <span className="tnum">({total})</span></h2>
        <p role="status">{total} published {total === 1 ? "placement" : "placements"} · {sortLabel}</p>
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
          <ul className="destination-roles">
            {rows.map(({ internship, categoryName }) => (
              <li key={internship.id} data-reveal>
                <div className="destination-role-title"><p>{categoryName}</p><h3><Link href={`/opportunities/${internship.slug}`}>{internship.title}</Link></h3></div>
                <div className="destination-role-facts"><p><MapPin size={14} aria-hidden="true" />{internship.city}, {COUNTRY_NAMES[internship.countryCode] ?? internship.countryCode}</p><p><span className="sr-only">Placement dates: </span><time dateTime={internship.startDate}>{internship.startDate}</time><span aria-hidden="true"> — </span><span className="sr-only"> to </span><time dateTime={internship.endDate}>{internship.endDate}</time></p></div>
                <Link className="destination-details" href={`/opportunities/${internship.slug}`} aria-label={`View details for ${internship.title}`}>View details <ArrowUpRight size={18} aria-hidden="true" /></Link>
              </li>
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
        </section>
      </div>
    </div>
    </DestinationMotion>
  );
}
