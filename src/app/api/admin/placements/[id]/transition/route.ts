import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require";
import { z } from "zod";
import { adminIdSchema, adminMutationError, readAdminBody } from "@/features/admin/request";
import { PLACEMENT_STATUSES } from "@/lib/workflow/placements";
import { transitionPlacement } from "@/features/admin/service";

// Admin placement status transition (D17 lifecycle, audited).
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireAdmin();
    const id = adminIdSchema.parse(params.id);
    const body = z.object({ to: z.enum(PLACEMENT_STATUSES) }).parse(await readAdminBody(request));
    const result = await transitionPlacement({
      adminId: admin.id,
      placementId: id,
      to: body.to,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return adminMutationError("admin.placement.transition.failed", err);
  }
}
