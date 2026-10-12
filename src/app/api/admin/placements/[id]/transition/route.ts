import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth/require";
import { transitionPlacement } from "@/features/admin/service";

// Admin placement status transition (D17 lifecycle, audited).
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireAdmin();
    const body = (await request.json().catch(() => ({}))) as { to?: string };
    if (!body.to) {
      return NextResponse.json({ ok: false, error: "Target status required." }, { status: 400 });
    }
    const result = await transitionPlacement({
      adminId: admin.id,
      placementId: params.id,
      to: body.to,
    });
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
