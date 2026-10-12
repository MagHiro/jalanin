import { requireAdmin } from "@/lib/auth/require";
import { listCategories } from "@/features/admin/service";
import { InternshipForm } from "@/components/admin/internship-form";

export const metadata = { title: "New internship", robots: "noindex" };

export default async function NewInternshipPage() {
  await requireAdmin();
  const categories = await listCategories();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New internship</h1>
      <InternshipForm categories={categories} />
    </div>
  );
}

export const dynamic = "force-dynamic";
