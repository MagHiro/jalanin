import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require";
import { PlacementForm } from "@/components/admin/placement-form";

export const metadata = { title: "New placement", robots: "noindex" };

export default async function NewPlacementPage() {
  await requireAdmin();
  return (
    <div className="workspace-editor-page">
      <div className="workspace-editor-heading">
        <nav aria-label="Breadcrumb">
          <Link href="/admin/placements" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
            <span aria-hidden="true">←</span> All placements
          </Link>
        </nav>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">New placement</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          Placements are created and managed manually. Find the student user ID on their{" "}
          <Link href="/admin/students" className="font-medium text-primary hover:underline">student record</Link>.
          New placements start as Preparing.
        </p>
      </div>
      <div className="workspace-editor-layout">
      <PlacementForm />
      <aside className="workspace-editor-aside" aria-label="Placement workflow">
        <h2>Placement workflow</h2>
        <p>Placements are linked to student profiles and visible to their owners. The status changes only through the recorded workflow.</p>
        <p>New records begin in Preparing. Status transitions remain auditable and follow the approved lifecycle.</p>
        <Link href="/admin/placements">View all placements →</Link>
      </aside>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
