import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require";
import { adminIdSchema, adminMutationError, readAdminBody } from "@/features/admin/request";
import { saveInternship } from "@/features/admin/service";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireAdmin();
    const id = adminIdSchema.parse(params.id);
    const body = await readAdminBody(request);
    const result = await saveInternship({ id: admin.id }, body, id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return adminMutationError("admin.internship.update.failed", err);
  }
}
