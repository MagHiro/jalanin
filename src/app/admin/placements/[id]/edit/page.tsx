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
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const [row] = await db
    .select()
    .from(placements)
    .where(eq(placements.id, params.id))
    .limit(1);
  if (!row) notFound();
  return (
    <div className="space-y-5">
      <div>
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
    </div>
  );
}
