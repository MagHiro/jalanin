import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require";
import { adminMutationError } from "@/features/admin/request";
import { searchStudentsForPlacement } from "@/features/admin/service";

// Admin-only student search for placement creation (A1). Small paged
// results — never the whole directory.
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const results = await searchStudentsForPlacement(q);
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return adminMutationError("admin.students.search.failed", err);
  }
}

export const dynamic = "force-dynamic";
