import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require";
import { PlacementForm } from "@/components/admin/placement-form";
import { db } from "@/lib/db/client";
import { placements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata = { title: "Manage placement", robots: "noindex" };
export const dynamic = "force-dynamic";

export default async function EditPlacementPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  await requireAdmin();
  const [row] = await db
    .select()
    .from(placements)
    .where(eq(placements.id, params.id))
    .limit(1);
  if (!row) notFound();
  return (
    <div className="workspace-editor-page min-w-0 [overflow-wrap:anywhere]">
      {searchParams.created === "1" && <p role="status" className="alert alert-success">Placement created.</p>}
      <div className="workspace-editor-heading">
        <nav aria-label="Breadcrumb">
          <Link href="/admin/placements" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
            <span aria-hidden="true">←</span> All placements
          </Link>
        </nav>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          {row.role} · {row.organization}
        </h1>
        <p className="mt-2"><StatusBadge status={row.placementStatus} /></p>
      </div>
      <div className="workspace-editor-layout">
      <PlacementForm
        initial={{
          id: row.id,
          studentUserId: row.studentUserId,
          applicationId: row.applicationId,
          organization: row.organization,
          role: row.role,
          countryCode: row.countryCode,
          startDate: row.startDate,
          endDate: row.endDate,
          notes: row.notes,
          placementStatus: row.placementStatus,
        }}
      />
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
