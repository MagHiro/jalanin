import { NextResponse } from "next/server";
import { requireStudent, AuthError } from "@/lib/auth/require";
import { saveDraft } from "@/features/applications/service";
import { applicationRequestSchema } from "@/features/applications/request";
import { classifyApplicationError } from "@/features/applications/errors";
import { logServerError } from "@/lib/observability/logger";

// Draft save endpoint: authenticated owner only; resumes the single row per
// (student, internship). Never creates duplicates (UNIQUE + tx).
export async function POST(request: Request) {
  try {
    const user = await requireStudent();
    const parsed = applicationRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
    }
    const body = parsed.data;
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
    const message = classifyApplicationError(err);
    if (message) return NextResponse.json({ ok: false, error: message }, { status: 400 });
    // The logger includes exception messages in development: pass no raw error
    // in any environment, since DB exceptions can contain SQL and personal data.
    const incidentId = logServerError("applications.draft.failed", null);
    return NextResponse.json(
      { ok: false, error: "Could not save draft. Please try again.", incidentId },
      { status: 500 },
    );
  }
}
