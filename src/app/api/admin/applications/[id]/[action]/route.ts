import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require";
import {
  acknowledgeRevision,
  reopenRejected,
  transitionApplication,
} from "@/features/admin/service";
import { adminIdSchema, adminMutationError, readAdminBody } from "@/features/admin/request";
import { APPLICATION_STATUSES } from "@/lib/workflow/transitions";

const transitionBodySchema = z.object({
  to: z.enum(APPLICATION_STATUSES),
  reason: z.string().optional(),
  expectedRevision: z.number().int().positive().optional(),
  quotation: z.object({
    amount: z.string(),
    notesStudent: z.string(),
    notesInternal: z.string().optional(),
  }).optional(),
});
const acknowledgeBodySchema = z.object({
  expectedRevision: z.number().int().positive(),
});
const reopenBodySchema = z.object({ reason: z.string().default("") });

// Status transition (ADM-APP-*): admin-only, transition-guarded, audited,
// student emailed via outbox. Revision race-safe via expectedRevision.
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireAdmin();
    const action = new URL(request.url).pathname.split("/").pop();
    if (action !== "transition" && action !== "acknowledge" && action !== "reopen") {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    const applicationId = adminIdSchema.parse(params.id);
    const body = await readAdminBody(request);

    if (action === "transition") {
      const values = transitionBodySchema.parse(body);
      const result = await transitionApplication({
        adminId: admin.id,
        applicationId,
        ...values,
      });
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "acknowledge") {
      const { expectedRevision } = acknowledgeBodySchema.parse(body);
      await acknowledgeRevision({ adminId: admin.id, applicationId, expectedRevision });
      return NextResponse.json({ ok: true });
    }
    const { reason } = reopenBodySchema.parse(body);
    await reopenRejected({ adminId: admin.id, applicationId, reason });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminMutationError("admin.application.action.failed", error);
  }
}
