import type { MetadataRoute } from "next";
import { db } from "@/lib/db/client";
import { internships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Published internships only (JOB-11). Private/admin routes never indexed.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const rows = await db
    .select({ slug: internships.slug, updatedAt: internships.updatedAt })
    .from(internships)
    .where(eq(internships.publicationStatus, "Published"));
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/opportunities`, changeFrequency: "daily", priority: 0.9 },
    ...rows.map((r) => ({
      url: `${base}/opportunities/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${base}/privacy`, changeFrequency: "monthly" as const, priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "monthly" as const, priority: 0.2 },
  ];
}
