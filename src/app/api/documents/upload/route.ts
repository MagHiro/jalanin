import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  adminNotifications,
  applicationDocuments,
  applicationRevisions,
  applications,
  internships,
} from "@/lib/db/schema";
import { requireStudent, AuthError } from "@/lib/auth/require";
import { getDocumentStore, safeFilename, validateUpload, cvPolicy } from "@/lib/storage/documents";
import { isStudentEditLocked, type ApplicationStatus } from "@/lib/workflow/transitions";
import { enqueueEmail } from "@/lib/email/outbox";
import { adminAlertRecipients } from "@/lib/email/provider";
import { appUrl, applicationRef, audit } from "@/lib/utils";
import { logServerError } from "@/lib/observability/logger";

// Private CV uploads: the previous object remains until replacement metadata
// commits. Submitted replacements create a revision and require admin re-review.
export async function POST(request: Request) {
  try {
    const user = await requireStudent();
    // Reject obviously oversized bodies before multipart parsing allocates bytes.
    const declaredBytes = Number(request.headers.get("content-length") ?? 0);
    if (declaredBytes > cvPolicy().maxBytes + 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "Upload is too large." }, { status: 413 });
    }
    const form = await request.formData();
    const applicationId = String(form.get("applicationId") ?? "");
    const file = form.get("file");
    if (!/^[0-9a-f-]{36}$/i.test(applicationId) || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Application and file are required." }, { status: 400 });
    }
    if (file.size === 0 || file.size > cvPolicy().maxBytes) {
      return NextResponse.json({ ok: false, error: "CV exceeds the allowed size or is empty." }, { status: 413 });
    }
    // Pre-authorize before performing any side effect in object storage.
    // The transaction below locks and checks again to handle status races.
    const [eligible] = await db.select({
      userId: applications.applicantUserId,
      isDraft: applications.isDraft,
      lifecycleStatus: applications.lifecycleStatus,
    }).from(applications).where(eq(applications.id, applicationId)).limit(1);
    if (!eligible || eligible.userId !== user.id) {
      return NextResponse.json({ ok: false, error: "Application not found." }, { status: 404 });
    }
    if (!eligible.isDraft && isStudentEditLocked(eligible.lifecycleStatus as ApplicationStatus)) {
      return NextResponse.json({ ok: false, error: "Application editing is locked." }, { status: 403 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const check = validateUpload({ filename: file.name, mimeType: file.type, bytes });
    if (!check.ok) {
      return NextResponse.json({ ok: false, error: check.error }, { status: 400 });
    }
    const store = getDocumentStore();
    const ext = `.${(file.name.split(".").pop() ?? "pdf").toLowerCase()}`;
    const stored = await store.put(`cv${ext}`, bytes, file.type);
    let result: { documentId: string; priorPaths: string[]; revision?: number };
    try {
      result = await db.transaction(async (tx) => {
        // SERIALIZE upload with admin quotation and student text edits.
        const [app] = await tx.select().from(applications)
          .where(eq(applications.id, applicationId)).limit(1).for("update");
        if (!app || app.applicantUserId !== user.id) {
          throw new AuthError(403, "Application not found.");
        }
        if (!app.isDraft && isStudentEditLocked(app.lifecycleStatus as ApplicationStatus)) {
          throw new AuthError(403, "This application is locked for document changes.");
        }
        const previous = await tx.select().from(applicationDocuments)
          .where(and(
            eq(applicationDocuments.applicationId, app.id),
            eq(applicationDocuments.documentType, "cv"),
          ));
        await tx.delete(applicationDocuments).where(and(
          eq(applicationDocuments.applicationId, app.id),
          eq(applicationDocuments.documentType, "cv"),
        ));
        const [inserted] = await tx.insert(applicationDocuments).values({
          applicationId: app.id,
          documentType: "cv",
          storagePath: stored.storagePath,
          originalFilename: safeFilename(file.name),
          mimeType: file.type,
          byteSize: bytes.length,
          uploadedBy: user.id,
        }).returning({ id: applicationDocuments.id });

        let revision: number | undefined;
        if (!app.isDraft) {
          revision = app.revision + 1;
          await tx.update(applications).set({
            revision,
            needsReReview: true,
            updatedAt: new Date(),
          }).where(eq(applications.id, app.id));
          await tx.insert(applicationRevisions).values({
            applicationId: app.id,
            revision,
            changedFields: ["cv"],
            oldValues: { cv: previous[0]?.originalFilename ?? null },
            newValues: { cv: safeFilename(file.name) },
            editedBy: user.id,
          });
          await tx.insert(adminNotifications).values({
            applicationId: app.id,
            eventKey: `revision-re-review:${app.id}:r${revision}`,
            eventType: "revision_re_review",
          }).onConflictDoNothing({ target: adminNotifications.eventKey });
          const [listing] = await tx.select({ title: internships.title })
            .from(internships).where(eq(internships.id, app.internshipId)).limit(1);
          for (const recipient of adminAlertRecipients()) {
            await enqueueEmail({
              eventKey: `admin-revision:${app.id}:r${revision}:${recipient}`,
              recipient,
              templateKey: "admin-revision",
              payload: {
                applicantName: `${app.firstName} ${app.lastName}`.trim(),
                applicantEmail: app.email,
                internshipTitle: listing?.title ?? "Internship",
                applicationRef: applicationRef(app.id),
                adminUrl: appUrl(`/admin/applications/${app.id}`),
              },
            }, tx);
          }
          await audit({
            actorUserId: user.id,
            entityType: "application",
            entityId: app.id,
            action: "student-cv-revision",
            changes: { revision, replacedCV: true },
          }, tx);
        }
        return {
          documentId: inserted.id,
          priorPaths: previous.map((doc) => doc.storagePath),
          revision,
        };
      });
    } catch (error) {
      await store.remove(stored.storagePath).catch(() => undefined);
      throw error;
    }
    // Only delete old bytes AFTER the replacement row is committed.
    for (const priorPath of result.priorPaths) {
      await store.remove(priorPath).catch(() => undefined);
    }
    return NextResponse.json({
      ok: true,
      documentId: result.documentId,
      ...(result.revision ? { revision: result.revision, needsReReview: true } : {}),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    const incidentId = logServerError("document.upload.failed", error);
    return NextResponse.json(
      { ok: false, error: "Could not upload CV. Please try again.", incidentId },
      { status: 503 },
    );
  }
}
