import { requireAdmin } from "@/lib/auth/require";
import { PlacementForm } from "@/components/admin/placement-form";

export const metadata = { title: "New placement", robots: "noindex" };

export default async function NewPlacementPage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New placement</h1>
      <p className="text-sm text-slate-600">
        Placements are created and managed manually. Find the student user ID on their{" "}
        <a href="/admin/students" className="text-emerald-700 hover:underline">student record</a>.
      </p>
      <PlacementForm />
    </div>
  );
}

export const dynamic = "force-dynamic";
