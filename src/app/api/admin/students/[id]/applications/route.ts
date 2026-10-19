import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require";
import { adminIdSchema, adminMutationError } from "@/features/admin/request";
import { listEligibleApplicationsForStudent } from "@/features/admin/service";

// Admin-only: submitted applications of one student eligible for placement
// linkage. The placement service re-validates ownership on save.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    const parsed = adminIdSchema.safeParse(params.id);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid student reference." }, { status: 400 });
    }
    const results = await listEligibleApplicationsForStudent(parsed.data);
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return adminMutationError("admin.student.applications.failed", err);
  }
}

export const dynamic = "force-dynamic";
