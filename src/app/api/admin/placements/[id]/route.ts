import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth/require";
import { savePlacement } from "@/features/admin/service";

// Admin placement field update (status moves via /transition).
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const result = await savePlacement({ id: admin.id }, body, params.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ ok: false }, { status: err.status });
    }
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Action failed." },
      { status: 400 },
    );
  }
}
