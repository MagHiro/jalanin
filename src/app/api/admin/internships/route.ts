import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require";
import { adminMutationError, readAdminBody } from "@/features/admin/request";
import { saveInternship } from "@/features/admin/service";

// Admin internship create (ADM-JOB-*). Server-validated; audited.
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await readAdminBody(request);
    const result = await saveInternship({ id: admin.id }, body);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return adminMutationError("admin.internship.create.failed", err);
  }
}
