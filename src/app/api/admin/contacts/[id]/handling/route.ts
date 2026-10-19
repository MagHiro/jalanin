import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require";
import {
  adminIdSchema,
  adminMutationError,
  readAdminBody,
} from "@/features/admin/request";
import { setContactHandling } from "@/features/admin/service";

// Admin-only contact handling transition (A3): mark handled / reopen.
// Reply-by-email workflow is unchanged; this only tracks handling state.
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireAdmin();
    const contactId = adminIdSchema.parse(params.id);
    const body = await readAdminBody(request);
    const { handled } = z.object({ handled: z.boolean() }).parse(body);
    await setContactHandling({ adminId: admin.id, contactId, handled });
    return NextResponse.json({ ok: true, handled });
  } catch (err) {
    return adminMutationError("admin.contact.handling.failed", err);
  }
}
