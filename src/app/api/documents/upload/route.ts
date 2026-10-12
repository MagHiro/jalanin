import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { applications } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/require";
import { getDocumentStore, safeFilename, validateUpload } from "@/lib/storage/documents";
import { applicationDocuments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// CV upload endpoint. Server-validated (MIME + magic bytes + size), stored
// under random keys in the private bucket/filesystem. Ownership verified:
// students may attach only to their own draft (or pre-lock submitted) rows.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
  }
  const form = await request.formData();
  const applicationId = String(form.get("applicationId") ?? "");
  const file = form.get("file");
  if (!applicationId || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Application and file are required." }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  if (rows.length === 0 || rows[0].applicantUserId !== user.id) {
    return NextResponse.json({ ok: false, error: "Application not found." }, { status: 404 });
  }
  const app = rows[0];
  if (!app.isDraft && (app.lifecycleStatus === "Quotation Sent" || app.lifecycleStatus === "Accepted" || app.lifecycleStatus === "Rejected" || app.lifecycleStatus === "Completed")) {
    return NextResponse.json(
      { ok: false, error: "This application is locked for document changes." },
      { status: 403 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const check = validateUpload({
    filename: file.name,
    mimeType: file.type,
    bytes,
  });
  if (!check.ok) {
    return NextResponse.json({ ok: false, error: check.error }, { status: 400 });
  }

  const store = getDocumentStore();
  const ext = `.${(file.name.split(".").pop() ?? "pdf").toLowerCase()}`;
  const stored = await store.put(`cv${ext}`, bytes, file.type);

  // Replace previous CV metadata (single active CV per application).
  const previous = await db
    .select()
    .from(applicationDocuments)
    .where(
      and(
        eq(applicationDocuments.applicationId, app.id),
        eq(applicationDocuments.documentType, "cv"),
      ),
    );
  for (const doc of previous) {
    await store.remove(doc.storagePath).catch(() => undefined);
    await db.delete(applicationDocuments).where(eq(applicationDocuments.id, doc.id));
  }
  const inserted = await db
    .insert(applicationDocuments)
    .values({
      applicationId: app.id,
      documentType: "cv",
      storagePath: stored.storagePath,
      originalFilename: safeFilename(file.name),
      mimeType: file.type,
      byteSize: bytes.length,
      uploadedBy: user.id,
    })
    .returning({ id: applicationDocuments.id });

  return NextResponse.json({ ok: true, documentId: inserted[0].id });
}
