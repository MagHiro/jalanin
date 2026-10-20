import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { listCategories } from "@/features/admin/service";
import { InternshipForm } from "@/components/admin/internship-form";
import { InternshipEditorLayout } from "@/components/admin/internship-editor-layout";

export const metadata = { title: "New internship", robots: "noindex" };

export default async function NewInternshipPage() {
  await requireAdmin();
  const categories = await listCategories();
  return (
    <InternshipEditorLayout>
      <div className="workspace-editor-heading">
        <nav aria-label="Breadcrumb">
          <Link href="/admin/internships" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
            <span aria-hidden="true">←</span> All internships
          </Link>
        </nav>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">New internship</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose Draft to prepare, Published to list publicly.</p>
      </div>
      <div className="workspace-editor-layout">
      <InternshipForm categories={categories} />
      <aside className="workspace-editor-aside" aria-label="Listing guide">
        <h2>Listing guide</h2>
        <p>Publishing a listing makes it available on the public internship catalogue. Drafts remain private until published.</p>
        <p>You can revisit and edit the internship dates, location and requirements from its record.</p>
        <Link href="/admin/internships">View all internships →</Link>
      </aside>
      </div>
    </InternshipEditorLayout>
  );
}

export const dynamic = "force-dynamic";
