import { db } from "@/lib/db/client";
import {
  adminNotifications,
  applicationDocuments,
  applicationRevisions,
  applicationStatusEvents,
  applications,
  consentRecords,
  internships,
  policyVersions,
  profiles,
} from "@/lib/db/schema";
import { enqueueEmail } from "@/lib/email/outbox";
import { adminAlertRecipients } from "@/lib/email/provider";
import { STATUS_NEXT_STEPS } from "@/lib/email/templates";
import { applicationRef, appUrl, audit } from "@/lib/utils";
import { applicationEditSchema, applicationFormBase, applicationFormSchema } from "@/lib/validation/schemas";
import {
  canTransition,
  isStudentEditLocked,
  type ApplicationStatus,
} from "@/lib/workflow/transitions";
import { and, desc, eq } from "drizzle-orm";

export type ApplicationRow = typeof applications.$inferSelect;

// Fields a student may edit post-submission (B05 interim). Status, quotation,
// ownership, and internship linkage are NEVER student-editable.
export const STUDENT_EDITABLE_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "nationality",
  "university",
  "course",
  "graduationYear",
  "preferredStart",
  "preferredEnd",
  "additionalInformation",
] as const;

async function currentPolicyVersion(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  type: string,
): Promise<string> {
  const rows = await tx
    .select()
    .from(policyVersions)
    .where(eq(policyVersions.policyType, type))
    .limit(1);
  return rows[0]?.version ?? "unknown";
}

/**
 * Save (or create) the student's draft for an internship. Exactly one row
 * per (student, internship) — enforced by UNIQUE; concurrent creators
 * converge via on-conflict resume of the existing row.
 */
export async function saveDraft(input: {
  userId: string;
  internshipId: string;
  values: Record<string, unknown>;
  idempotencyKey?: string;
}): Promise<{ applicationId: string; created: boolean }> {
  const internship = await db
    .select()
    .from(internships)
    .where(eq(internships.id, input.internshipId))
    .limit(1);
  if (internship.length === 0) throw new Error("Internship not found.");
  if (internship[0].publicationStatus !== "Published") {
    throw new Error("This internship is not currently accepting drafts.");
  }

  const parsed = applicationFormBase.partial().parse({
    ...input.values,
    consentPrivacy: input.values.consentPrivacy ?? true,
    consentTerms: input.values.consentTerms ?? true,
  });

  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.applicantUserId, input.userId),
          eq(applications.internshipId, input.internshipId),
        ),
      )
      .limit(1);
    if (existing.length > 0) {
      const row = existing[0];
      if (!row.isDraft) {
        throw new Error(
          "You already have a submitted application for this internship.",
        );
      }
      await tx
        .update(applications)
        .set({
          firstName: parsed.firstName ?? row.firstName,
          lastName: parsed.lastName ?? row.lastName,
          email: parsed.email ?? row.email,
          nationality: parsed.nationality ?? row.nationality,
          university: parsed.university ?? row.university,
          course: parsed.course ?? row.course,
          graduationYear: parsed.graduationYear ?? row.graduationYear,
          preferredStart: parsed.preferredStart ?? row.preferredStart,
          preferredEnd: parsed.preferredEnd ?? row.preferredEnd,
          additionalInformation:
            parsed.additionalInformation ?? row.additionalInformation,
          updatedAt: new Date(),
        })
        .where(eq(applications.id, row.id));
      return { applicationId: row.id, created: false };
    }
    const inserted = await tx
      .insert(applications)
      .values({
        internshipId: input.internshipId,
        applicantUserId: input.userId,
        firstName: parsed.firstName ?? "",
        lastName: parsed.lastName ?? "",
        email: parsed.email ?? "",
        nationality: parsed.nationality ?? "",
        university: parsed.university ?? "",
        course: parsed.course ?? "",
        graduationYear: parsed.graduationYear ?? new Date().getFullYear(),
        preferredStart: parsed.preferredStart ?? "2026-01-01",
        preferredEnd: parsed.preferredEnd ?? "2026-01-02",
        additionalInformation: parsed.additionalInformation ?? "",
        isDraft: true,
        lifecycleStatus: "New",
      })
      .onConflictDoNothing({
        target: [applications.applicantUserId, applications.internshipId],
      })
      .returning({ id: applications.id });
    if (inserted.length > 0) {
      return { applicationId: inserted[0].id, created: true };
    }
    // Lost the race: resume the winner's row.
    const winner = await tx
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.applicantUserId, input.userId),
          eq(applications.internshipId, input.internshipId),
        ),
      )
      .limit(1);
    if (winner.length === 0) throw new Error("Could not save draft.");
    return { applicationId: winner[0].id, created: false };
  });
}

/**
 * Atomic final submission: validate → eligibility → single New row →
 * audit + admin notification + admin email (outbox). Idempotent per
 * idempotencyKey; double-clicks/retries cannot duplicate (UNIQUE + tx).
 */
export async function submitApplication(input: {
  userId: string;
  userEmail: string | null;
  internshipId: string;
  values: Record<string, unknown>;
  idempotencyKey: string;
}): Promise<{ applicationId: string; ref: string; duplicate: boolean }> {
  const values = applicationFormSchema.parse(input.values);

  return db.transaction(async (tx) => {
    const listing = await tx
      .select()
      .from(internships)
      .where(eq(internships.id, input.internshipId))
      .limit(1);
    if (listing.length === 0) throw new Error("Internship not found.");
    if (listing[0].publicationStatus !== "Published") {
      throw new Error(
        "This internship is no longer accepting applications. Your draft is preserved — please contact us for guidance.",
      );
    }

    const existing = await tx
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.applicantUserId, input.userId),
          eq(applications.internshipId, input.internshipId),
        ),
      )
      .limit(1);

    const docsFor = async (appId: string) =>
      tx
        .select()
        .from(applicationDocuments)
        .where(eq(applicationDocuments.applicationId, appId))
        .limit(1);

    if (existing.length > 0 && !existing[0].isDraft) {
      // Already submitted (race with the route-level check): retry-safe
      // no-op, never a duplicate row.
      return {
        applicationId: existing[0].id,
        ref: applicationRef(existing[0].id),
        duplicate: true,
      };
    }
    const appId =
      existing.length > 0
        ? existing[0].id
        : (
            await tx
              .insert(applications)
              .values({
                internshipId: input.internshipId,
                applicantUserId: input.userId,
                firstName: "",
                lastName: "",
                email: "",
                nationality: "",
                university: "",
                course: "",
                graduationYear: new Date().getFullYear(),
                preferredStart: "2026-01-01",
                preferredEnd: "2026-01-02",
                isDraft: true,
                lifecycleStatus: "New",
              })
              .onConflictDoNothing({
                target: [
                  applications.applicantUserId,
                  applications.internshipId,
                ],
              })
              .returning({ id: applications.id })
          )[0]?.id ??
          (
            await tx
              .select()
              .from(applications)
              .where(
                and(
                  eq(applications.applicantUserId, input.userId),
                  eq(applications.internshipId, input.internshipId),
                ),
              )
              .limit(1)
          )[0]?.id;
    if (!appId) throw new Error("Could not create application.");

    // Serialize concurrent submissions of this exact application. A retry
    // arriving after the first commit is a no-op, not another status event.
    const [locked] = await tx.select().from(applications)
      .where(eq(applications.id, appId)).limit(1).for("update");
    if (!locked || locked.applicantUserId !== input.userId) {
      throw new Error("Application not found.");
    }
    if (!locked.isDraft) {
      return { applicationId: appId, ref: applicationRef(appId), duplicate: true };
    }

    const cv = await docsFor(appId);
    if (cv.length === 0) {
      throw new Error("A CV upload is required before submitting.");
    }

    const now = new Date();
    await tx
      .update(applications)
      .set({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        nationality: values.nationality,
        university: values.university,
        course: values.course,
        graduationYear: values.graduationYear,
        preferredStart: values.preferredStart,
        preferredEnd: values.preferredEnd,
        additionalInformation: values.additionalInformation ?? "",
        isDraft: false,
        lifecycleStatus: "New",
        submittedAt: now,
        revision: 1,
        reviewedRevision: 1,
        needsReReview: false,
        updatedAt: now,
      })
      .where(eq(applications.id, appId));

    await tx.insert(applicationStatusEvents).values({
      applicationId: appId,
      fromStatus: null,
      toStatus: "New",
      actorUserId: input.userId,
      reason: "Student submission",
    });

    // Consent proof (policy version + timestamp).
    const privacyVersion = await currentPolicyVersion(tx, "privacy");
    const termsVersion = await currentPolicyVersion(tx, "terms");
    await tx.insert(consentRecords).values([
      {
        userId: input.userId,
        applicationId: appId,
        policyType: "privacy",
        policyVersion: privacyVersion,
      },
      {
        userId: input.userId,
        applicationId: appId,
        policyType: "terms",
        policyVersion: termsVersion,
      },
    ]);

    // Upsert student profile display name (directory, non-sensitive).
    await tx
      .insert(profiles)
      .values({
        userId: input.userId,
        displayName: `${values.firstName} ${values.lastName}`.trim(),
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          displayName: `${values.firstName} ${values.lastName}`.trim(),
          updatedAt: now,
        },
      });

    const ref = applicationRef(appId);
    const adminUrl = appUrl(`/admin/applications/${appId}`);
    const applicantName = `${values.firstName} ${values.lastName}`.trim();

    // Durable admin notification (D08) — deduplicated by event_key.
    await tx
      .insert(adminNotifications)
      .values({
        applicationId: appId,
        eventKey: `new-application:${appId}`,
        eventType: "new_application",
      })
      .onConflictDoNothing({ target: adminNotifications.eventKey });

    // Queue admin emails + student confirmation inside the same tx. The
    // dispatcher sends them afterwards; enqueue is idempotent per event_key.
    for (const recipient of adminAlertRecipients()) {
      await enqueueEmail({
        eventKey: `admin-new-application:${appId}:${recipient}`,
        recipient,
        templateKey: "admin-new-application",
        payload: {
          applicantName,
          applicantEmail: values.email,
          internshipTitle: listing[0].title,
          applicationRef: ref,
          adminUrl,
        },
      }, tx);
    }
    if (input.userEmail) {
      await enqueueEmail({
        eventKey: `status-change:${appId}:New:${input.idempotencyKey}`,
        recipient: input.userEmail,
        templateKey: "status-change",
        payload: {
          studentName: values.firstName,
          internshipTitle: listing[0].title,
          applicationRef: ref,
          status: "New",
          nextStep: STATUS_NEXT_STEPS.New,
        },
      }, tx);
    }

    await audit({
      actorUserId: input.userId,
      entityType: "application",
      entityId: appId,
      action: "submitted",
      changes: { ref, internshipId: input.internshipId },
    }, tx);

    return { applicationId: appId, ref, duplicate: false };
  });
}

/**
 * Student post-submit edit (D10/D14). Owner-only, status New/In Review only;
 * bumps revision, stores field-level audit, sets needs_re_review, blocks
 * progression until admin acknowledges, and queues a persistent admin alert.
 */
export async function editSubmittedApplication(input: {
  userId: string;
  applicationId: string;
  values: Record<string, unknown>;
}): Promise<{ revision: number }> {
  const values = applicationEditSchema.parse(input.values);

  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(applications)
      .where(eq(applications.id, input.applicationId))
      .limit(1)
      .for("update");
    if (rows.length === 0) throw new Error("Application not found.");
    const app = rows[0];
    if (app.applicantUserId !== input.userId) {
      throw new Error("You can only edit your own applications.");
    }
    if (app.isDraft) {
      throw new Error("This draft has not been submitted yet.");
    }
    if (isStudentEditLocked(app.lifecycleStatus as ApplicationStatus)) {
      throw new Error(
        `Applications in status ${app.lifecycleStatus} are locked for student editing.`,
      );
    }

    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};
    const changedFields: string[] = [];
    const patch: Record<string, unknown> = {};
    for (const field of STUDENT_EDITABLE_FIELDS) {
      const next = (values as Record<string, unknown>)[field];
      const prev = (app as unknown as Record<string, unknown>)[field];
      if (next !== undefined && String(next) !== String(prev ?? "")) {
        changedFields.push(field);
        oldValues[field] = prev ?? null;
        newValues[field] = next;
        patch[field] = next;
      }
    }
    if (changedFields.length === 0) {
      return { revision: app.revision };
    }

    const nextRevision = app.revision + 1;
    await tx
      .update(applications)
      .set({
        ...patch,
        revision: nextRevision,
        needsReReview: true,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, app.id));

    await tx.insert(applicationRevisions).values({
      applicationId: app.id,
      revision: nextRevision,
      changedFields,
      oldValues,
      newValues,
      editedBy: input.userId,
    });

    const ref = applicationRef(app.id);
    await tx
      .insert(adminNotifications)
      .values({
        applicationId: app.id,
        eventKey: `revision-re-review:${app.id}:r${nextRevision}`,
        eventType: "revision_re_review",
      })
      .onConflictDoNothing({ target: adminNotifications.eventKey });

    const listing = await tx
      .select({ title: internships.title })
      .from(internships)
      .where(eq(internships.id, app.internshipId))
      .limit(1);
    for (const recipient of adminAlertRecipients()) {
      await enqueueEmail({
        eventKey: `admin-revision:${app.id}:r${nextRevision}:${recipient}`,
        recipient,
        templateKey: "admin-revision",
        payload: {
          applicantName: `${app.firstName} ${app.lastName}`.trim(),
          applicantEmail: app.email,
          internshipTitle: listing[0]?.title ?? "Internship",
          applicationRef: ref,
          adminUrl: appUrl(`/admin/applications/${app.id}`),
        },
      }, tx);
    }

    await audit({
      actorUserId: input.userId,
      entityType: "application",
      entityId: app.id,
      action: "student-revision",
      changes: { revision: nextRevision, changedFields, oldValues, newValues },
    }, tx);

    return { revision: nextRevision };
  });
}

/** Student-scoped application list for the dashboard. */
export async function listStudentApplications(userId: string) {
  return db
    .select({
      application: applications,
      internshipTitle: internships.title,
      internshipSlug: internships.slug,
      internshipCity: internships.city,
      internshipCountry: internships.countryCode,
    })
    .from(applications)
    .innerJoin(internships, eq(applications.internshipId, internships.id))
    .where(eq(applications.applicantUserId, userId))
    .orderBy(desc(applications.updatedAt));
}

/** Single application with ownership check (student) or open (admin-verified caller). */
export async function getApplicationForStudent(
  userId: string,
  applicationId: string,
) {
  const rows = await db
    .select({ application: applications, internship: internships })
    .from(applications)
    .innerJoin(internships, eq(applications.internshipId, internships.id))
    .where(eq(applications.id, applicationId))
    .limit(1);
  if (rows.length === 0) return null;
  if (rows[0].application.applicantUserId !== userId) return null;
  const revisions = await db
    .select()
    .from(applicationRevisions)
    .where(eq(applicationRevisions.applicationId, applicationId))
    .orderBy(desc(applicationRevisions.revision));
  const documents = await db
    .select()
    .from(applicationDocuments)
    .where(eq(applicationDocuments.applicationId, applicationId));
  const events = await db
    .select()
    .from(applicationStatusEvents)
    .where(eq(applicationStatusEvents.applicationId, applicationId))
    .orderBy(desc(applicationStatusEvents.createdAt));
  return { ...rows[0], revisions, documents, events };
}

export { canTransition };
