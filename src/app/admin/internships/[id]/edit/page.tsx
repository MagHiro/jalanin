import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require";
import { listCategories } from "@/features/admin/service";
import { InternshipForm } from "@/components/admin/internship-form";
import { db } from "@/lib/db/client";
import { internships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const metadata = { title: "Edit internship", robots: "noindex" };
export const dynamic = "force-dynamic";

export default async function EditInternshipPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const [row] = await db
    .select()
    .from(internships)
    .where(eq(internships.id, params.id))
    .limit(1);
  if (!row) notFound();
  const categories = await listCategories();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit: {row.title}</h1>
      <InternshipForm
        initial={{
          id: row.id,
          title: row.title,
          slug: row.slug,
          city: row.city,
          countryCode: row.countryCode,
          categoryId: row.categoryId,
          startDate: row.startDate,
          endDate: row.endDate,
          description: row.description,
          responsibilities: row.responsibilities,
          requirements: row.requirements,
          publicationStatus: row.publicationStatus,
          featured: row.featured,
          applicationDeadline: row.applicationDeadline
            ? new Date(row.applicationDeadline).toISOString().slice(0, 16)
            : null,
        }}
        categories={categories}
      />
    </div>
  );
}
