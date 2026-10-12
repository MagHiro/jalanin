import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require";
import { PlacementForm } from "@/components/admin/placement-form";
import { db } from "@/lib/db/client";
import { placements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manage placement</h1>
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
