import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth/require";
import {
  acknowledgeRevision,
  reopenRejected,
  transitionApplication,
} from "@/features/admin/service";
import type { ApplicationStatus } from "@/lib/workflow/transitions";

async function guard<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const result = await fn();
    return NextResponse.json({ ok: true, ...(result as object) });
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

// Status transition (ADM-APP-*): admin-only, transition-guarded, audited,
// student emailed via outbox. Revision race-safe via expectedRevision.
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const url = new URL(request.url);
  const action = url.pathname.split("/").pop();
  const admin = await requireAdmin().catch((err: unknown) => {
    if (err instanceof AuthError) return null;
    throw err;
  });
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as {
    to?: ApplicationStatus;
    reason?: string;
    expectedRevision?: number;
    quotation?: { amount: string; notesStudent: string; notesInternal?: string };
  };

  if (action === "transition") {
    if (!body.to) return NextResponse.json({ ok: false, error: "Target status required." }, { status: 400 });
    return guard(() =>
      transitionApplication({
        adminId: admin.id,
        applicationId: params.id,
        to: body.to as ApplicationStatus,
        reason: body.reason,
        expectedRevision: body.expectedRevision,
        quotation: body.quotation,
      }),
    );
  }
  if (action === "acknowledge") {
    return guard(() =>
      acknowledgeRevision({ adminId: admin.id, applicationId: params.id }).then(() => ({})),
    );
  }
  if (action === "reopen") {
    return guard(() =>
      reopenRejected({
        adminId: admin.id,
        applicationId: params.id,
        reason: String(body.reason ?? ""),
      }).then(() => ({})),
    );
  }
  return NextResponse.json({ ok: false }, { status: 404 });
}
