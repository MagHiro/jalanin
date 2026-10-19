import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require";
import { adminMutationError, readAdminBody } from "@/features/admin/request";
import { savePlacement } from "@/features/admin/service";

// Admin placement create (D11/D17). Server-validated; audited.
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await readAdminBody(request);
    const result = await savePlacement({ id: admin.id }, body);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return adminMutationError("admin.placement.create.failed", err);
  }
}
