import { NextResponse } from "next/server";
import { requireStudent, AuthError } from "@/lib/auth/require";
import { saveDraft } from "@/features/applications/service";

// Draft save endpoint: authenticated owner only; resumes the single row per
// (student, internship). Never creates duplicates (UNIQUE + tx).
export async function POST(request: Request) {
  try {
    const user = await requireStudent();
    const body = (await request.json()) as {
      internshipId?: string;
      values?: Record<string, unknown>;
    };
    if (!body.internshipId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.internshipId) || !body.values) {
      return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
    }
    const result = await saveDraft({
      userId: user.id,
      internshipId: body.internshipId,
      values: body.values,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Could not save draft." },
      { status: 400 },
    );
  }
}
