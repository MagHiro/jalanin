import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { listCategories } from "@/features/admin/service";
import { InternshipForm } from "@/components/admin/internship-form";

export const metadata = { title: "New internship", robots: "noindex" };

export default async function NewInternshipPage() {
  await requireAdmin();
  const categories = await listCategories();
  return (
    <div className="space-y-5">
      <div>
        <nav aria-label="Breadcrumb">
          <Link href="/admin/internships" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
            <span aria-hidden="true">←</span> All internships
          </Link>
        </nav>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">New internship</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose Draft to prepare, Published to list publicly.</p>
      </div>
      <InternshipForm categories={categories} />
    </div>
  );
}

export const dynamic = "force-dynamic";
