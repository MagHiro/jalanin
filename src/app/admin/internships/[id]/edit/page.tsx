import Link from "next/link";
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
    <div className="workspace-editor-page">
      <div className="workspace-editor-heading">
        <nav aria-label="Breadcrumb">
          <Link href="/admin/internships" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
            <span aria-hidden="true">←</span> All internships
          </Link>
        </nav>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Edit: {row.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unpublishing keeps submitted applications and history intact. Slug changes affect the public URL.
        </p>
      </div>
      <div className="workspace-editor-layout">
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
      <aside className="workspace-editor-aside" aria-label="Listing guide">
        <h2>Listing guide</h2>
        <p>Publishing a listing makes it available on the public internship catalogue. Drafts remain private until published.</p>
        <p>You can revisit and edit the internship dates, location and requirements from its record.</p>
        <Link href="/admin/internships">View all internships →</Link>
      </aside>
      </div>
    </div>
  );
}
