import { db } from "@/lib/db/client";
import { categories, internships } from "@/lib/db/schema";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { singleCount } from "@/lib/utils";

export interface DirectoryQuery {
  q?: string;
  country?: string;
  category?: string;
  sort?: "newest" | "title" | "start";
  page: number;
  pageSize: number;
}

/** Public directory: published internships only, URL-driven filters. */
export async function listPublishedInternships(query: DirectoryQuery) {
  const conds = [eq(internships.publicationStatus, "Published")];
  if (query.q) {
    const term = `%${query.q.trim()}%`;
    conds.push(
      or(
        ilike(internships.title, term),
        ilike(internships.city, term),
      )!,
    );
  }
  if (query.country) conds.push(eq(internships.countryCode, query.country));
  if (query.category) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, query.category))
      .limit(1);
    conds.push(eq(internships.categoryId, cat?.id ?? "00000000-0000-0000-0000-000000000000"));
  }
  const where = and(...conds);

  const order =
    query.sort === "title"
      ? asc(internships.title)
      : query.sort === "start"
        ? asc(internships.startDate)
        : desc(sql`COALESCE(${internships.publishedAt}, ${internships.createdAt})`);

  const rows = await db
    .select({ internship: internships, categoryName: categories.name, categorySlug: categories.slug })
    .from(internships)
    .leftJoin(categories, eq(internships.categoryId, categories.id))
    .where(where)
    .orderBy(order, asc(internships.id))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);
  const totalRows = await db
    .select({ n: count() })
    .from(internships)
    .where(where);
  return { rows, total: singleCount(totalRows) };
}

export async function getPublishedInternshipBySlug(slug: string) {
  const rows = await db
    .select({ internship: internships, categoryName: categories.name })
    .from(internships)
    .leftJoin(categories, eq(internships.categoryId, categories.id))
    .where(
      and(
        eq(internships.slug, slug),
        eq(internships.publicationStatus, "Published"),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function listFeaturedInternships(limit = 6) {
  return db
    .select({ internship: internships, categoryName: categories.name })
    .from(internships)
    .leftJoin(categories, eq(internships.categoryId, categories.id))
    .where(
      and(
        eq(internships.publicationStatus, "Published"),
        eq(internships.featured, true),
      ),
    )
    .orderBy(desc(sql`COALESCE(${internships.publishedAt}, ${internships.createdAt})`))
    .limit(limit);
}

export async function listFilterOptions() {
  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.active, true))
    .orderBy(asc(categories.name));
  const countries = await db
    .selectDistinct({ code: internships.countryCode })
    .from(internships)
    .where(eq(internships.publicationStatus, "Published"))
    .orderBy(asc(internships.countryCode));
  return { categories: cats, countries: countries.map((c) => c.code) };
}

export const COUNTRY_NAMES: Record<string, string> = {
  SG: "Singapore",
  MY: "Malaysia",
  TH: "Thailand",
  ID: "Indonesia",
  VN: "Vietnam",
  PH: "Philippines",
};
