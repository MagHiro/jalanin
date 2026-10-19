import { db } from "@/lib/db/client";
import { DomainError } from "@/lib/errors/domain-error";
import {
  adminNotifications,
  adminUsers,
  applicationDocuments,
  applicationRevisions,
  applicationStatusEvents,
  applications,
  auditEvents,
  categories,
  internships,
  placements,
  profiles,
  quotations,
} from "@/lib/db/schema";
import { enqueueEmail } from "@/lib/email/outbox";
import { STATUS_NEXT_STEPS } from "@/lib/email/templates";
import { applicationRef, audit, singleCount } from "@/lib/utils";
import {
  internshipInputSchema,
  placementInputSchema,
} from "@/lib/validation/schemas";
import {
  allowedNextPlacementStatuses,
  canTransitionPlacement,
} from "@/lib/workflow/placements";
import {
  allowedNextStatuses,
  canTransition,
  formatSgd,
  type ApplicationStatus,
} from "@/lib/workflow/transitions";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";

export interface AdminActor {
  id: string;
}

// ------------------------------------------------------------------ overview
/** Real operational counts (D06) — every number derives from stored records. */
export async function getAdminOverview() {
  const byStatus = await db
    .select({
      status: applications.lifecycleStatus,
      n: count(),
    })
    .from(applications)
    .where(eq(applications.isDraft, false))
    .groupBy(applications.lifecycleStatus);
  const statusCounts: Record<string, number> = {};
  for (const row of byStatus) statusCounts[row.status] = Number(row.n);

  const [pubRows, studentRows, unreadRows] = await Promise.all([
    db
      .select({ n: count() })
      .from(internships)
      .where(eq(internships.publicationStatus, "Published")),
    db.select({ n: count() }).from(profiles),
    db
      .select({ n: count() })
      .from(adminNotifications)
      .where(eq(adminNotifications.isRead, false)),
  ]);
  const placementRows = await db
    .select({ status: placements.placementStatus, n: count() })
    .from(placements)
    .groupBy(placements.placementStatus);
  const placementCounts: Record<string, number> = {};
  for (const row of placementRows) placementCounts[row.status] = Number(row.n);

  return {
    statusCounts,
    publishedInternships: singleCount(pubRows),
    totalStudents: singleCount(studentRows),
    unreadNotifications: singleCount(unreadRows),
    placementCounts,
  };
}

// --------------------------------------------------------------- internships
export async function listAdminInternships(input: {
  q?: string;
  status?: string;
  sort?: "updated" | "title" | "start";
  page: number;
  pageSize: number;
}) {
  const conds = [];
  if (input.status) conds.push(eq(internships.publicationStatus, input.status));
  if (input.q) {
    conds.push(
      or(
        ilike(internships.title, `%${input.q}%`),
        ilike(internships.city, `%${input.q}%`),
      ),
    );
  }
  const where = conds.length > 0 ? and(...conds) : undefined;
  const rows = await db
    .select()
    .from(internships)
    .where(where)
    .orderBy(
      input.sort === "title" ? asc(internships.title)
        : input.sort === "start" ? asc(internships.startDate)
        : desc(internships.updatedAt),
      asc(internships.id),
    )
    .limit(input.pageSize)
    .offset((input.page - 1) * input.pageSize);
  const totalRows = await db
    .select({ n: count() })
    .from(internships)
    .where(where);
  return { rows, total: singleCount(totalRows) };
}

export async function saveInternship(
  actor: AdminActor,
  input: unknown,
  id?: string,
) {
  const values = internshipInputSchema.parse(input);
  const now = new Date();
  const base = {
    title: values.title,
    slug: values.slug,
    city: values.city,
    countryCode: values.countryCode,
    categoryId: values.categoryId ?? null,
    startDate: values.startDate,
    endDate: values.endDate,
    description: values.description,
    responsibilities: values.responsibilities,
    requirements: values.requirements,
    publicationStatus: values.publicationStatus,
    featured: values.featured,
    applicationDeadline: values.applicationDeadline
      ? new Date(values.applicationDeadline)
      : null,
    updatedAt: now,
  };

  return db.transaction(async (tx) => {
    if (id) {
      // Preserve the original published_at when already published.
      const [current] = await tx
        .select({ publishedAt: internships.publishedAt })
        .from(internships)
        .where(eq(internships.id, id))
        .limit(1)
        .for("update");
      if (!current) throw new DomainError("Internship not found.");
      await tx
        .update(internships)
        .set({
          ...base,
          publishedAt:
            values.publicationStatus === "Published"
              ? (current.publishedAt ?? now)
              : null,
        })
        .where(eq(internships.id, id));
      await audit({
        actorUserId: actor.id,
        entityType: "internship",
        entityId: id,
        action: "updated",
        changes: { title: values.title, status: values.publicationStatus },
      }, tx);
      return { id };
    }
    const inserted = await tx
      .insert(internships)
      .values({
        ...base,
        publishedAt: values.publicationStatus === "Published" ? now : null,
      })
      .returning({ id: internships.id });
    await audit({
      actorUserId: actor.id,
      entityType: "internship",
      entityId: inserted[0].id,
      action: "created",
      changes: { title: values.title, status: values.publicationStatus },
    }, tx);
    return { id: inserted[0].id };
  });
}

// -------------------------------------------------------------- applications
export async function listAdminApplications(input: {
  q?: string;
  status?: string;
  sort?: "newest" | "oldest" | "name";
  needsReReview?: boolean;
  page: number;
  pageSize: number;
}) {
  const conds = [eq(applications.isDraft, false)];
  if (input.status) conds.push(eq(applications.lifecycleStatus, input.status));
  if (input.needsReReview !== undefined) {
    conds.push(eq(applications.needsReReview, input.needsReReview));
  }
  if (input.q) {
    const term = `%${input.q}%`;
    const match = or(
      ilike(applications.firstName, term),
      ilike(applications.lastName, term),
      ilike(applications.email, term),
      ilike(applications.university, term),
    );
    if (match) conds.push(match);
  }
  const where = and(...conds);
  const rows = await db
    .select({
      application: applications,
      internshipTitle: internships.title,
      internshipSlug: internships.slug,
    })
    .from(applications)
    .innerJoin(internships, eq(applications.internshipId, internships.id))
    .where(where)
    .orderBy(
      input.sort === "oldest" ? asc(applications.submittedAt)
        : input.sort === "name" ? asc(applications.lastName)
        : desc(applications.submittedAt),
      asc(applications.id),
    )
    .limit(input.pageSize)
    .offset((input.page - 1) * input.pageSize);
  const totalRows = await db
    .select({ n: count() })
    .from(applications)
    .where(where);
  return { rows, total: singleCount(totalRows) };
}

export async function getAdminApplication(id: string) {
  const rows = await db
    .select({ application: applications, internship: internships })
    .from(applications)
    .innerJoin(internships, eq(applications.internshipId, internships.id))
    .where(eq(applications.id, id))
    .limit(1);
  if (rows.length === 0) return null;
  const appId = id;
  const [revisions, documents, events, quotes, linkedPlacements] =
    await Promise.all([
      db
        .select()
        .from(applicationRevisions)
        .where(eq(applicationRevisions.applicationId, appId))
        .orderBy(desc(applicationRevisions.revision)),
      db
        .select()
        .from(applicationDocuments)
        .where(eq(applicationDocuments.applicationId, appId)),
      db
        .select()
        .from(applicationStatusEvents)
        .where(eq(applicationStatusEvents.applicationId, appId))
        .orderBy(desc(applicationStatusEvents.createdAt)),
      db
        .select()
        .from(quotations)
        .where(eq(quotations.applicationId, appId))
        .orderBy(desc(quotations.revision)),
      db
        .select()
        .from(placements)
        .where(eq(placements.applicationId, appId)),
    ]);
  return { ...rows[0], revisions, documents, events, quotes, linkedPlacements };
}

/**
 * Admin status transition. Transactional: permission → valid transition →
 * prerequisites (re-review acknowledged,
 * optimistic-concurrency revision check) → persist → audit + status event +
 * student email (outbox). Email failure never rolls back the transition, but
 * delivery state stays visible via the outbox (NOT-03).
 */
export async function transitionApplication(input: {
  adminId: string;
  applicationId: string;
  to: ApplicationStatus;
  reason?: string;
  expectedRevision?: number;
}) {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ application: applications, internship: internships })
      .from(applications)
      .innerJoin(internships, eq(applications.internshipId, internships.id))
      .where(eq(applications.id, input.applicationId))
      .limit(1)
      .for("update");
    if (rows.length === 0) throw new DomainError("Application not found.");
    const { application: app, internship } = rows[0];
    if (app.isDraft) throw new DomainError("Draft applications cannot transition.");
    const from = app.lifecycleStatus as ApplicationStatus;

    // Optimistic concurrency: concurrent admins cannot silently overwrite.
    if (
      input.expectedRevision !== undefined &&
      input.expectedRevision !== app.revision
    ) {
      throw new DomainError(
        "This application changed since you opened it. Reload and retry.",
      );
    }

    const check = canTransition({
      from,
      to: input.to,
      actor: "admin",
      needsReReview: app.needsReReview,
      hasValidQuotation: false,
      revisionReviewed: app.reviewedRevision >= app.revision,
    });
    if (!check.ok) throw new DomainError(check.reason ?? "Application transition is not permitted.");

    // Race safety: re-review acknowledgement and the transition commit in one
    // tx; a student edit landing here would flip needs_re_review first.
    await tx
      .update(applications)
      .set({
        lifecycleStatus: input.to,
        needsReReview: false,
        reviewedRevision: app.revision,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, app.id));

    const [statusEvent] = await tx.insert(applicationStatusEvents).values({
      applicationId: app.id,
      fromStatus: from,
      toStatus: input.to,
      actorUserId: input.adminId,
      reason: input.reason ?? null,
    }).returning({ id: applicationStatusEvents.id });

    await audit({
      actorUserId: input.adminId,
      entityType: "application",
      entityId: app.id,
      action: `status:${from}->${input.to}`,
      changes: {
        from,
        to: input.to,
        reason: input.reason ?? null,
        revision: app.revision,
      },
    }, tx);

    const ref = applicationRef(app.id);
    const studentName = `${app.firstName} ${app.lastName}`.trim() || "there";
    // Stage-only workflow: do not create or resend monetary quotations.
      await enqueueEmail({
        eventKey: `status-change:${statusEvent.id}`,
        recipient: app.email,
        templateKey: "status-change",
        payload: {
          studentName: app.firstName || studentName,
          internshipTitle: internship.title,
          applicationRef: ref,
          status: input.to,
          nextStep: STATUS_NEXT_STEPS[input.to] ?? "Our team will be in touch.",
        },
      }, tx);
    return { ref };
  });
}

/** Explicit admin acknowledgement of the latest student revision (D10 step 4). */
export async function acknowledgeRevision(input: {
  adminId: string;
  applicationId: string;
  expectedRevision: number;
}) {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(applications)
      .where(eq(applications.id, input.applicationId))
      .limit(1)
      .for("update");
    if (rows.length === 0) throw new DomainError("Application not found.");
    const app = rows[0];
    if (input.expectedRevision !== app.revision) {
      throw new DomainError(
        "This application changed since you opened it. Reload and retry.",
      );
    }
    await tx
      .update(applications)
      .set({
        reviewedRevision: app.revision,
        needsReReview: false,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, app.id));
    await audit({
      actorUserId: input.adminId,
      entityType: "application",
      entityId: app.id,
      action: "revision-acknowledged",
      changes: { revision: app.revision },
    }, tx);
    // Mark related re-review notifications read.
    await tx
      .update(adminNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(adminNotifications.applicationId, app.id));
  });
}

/** Admin-only reopen of a Rejected application (D15). Interim target: In Review (B03). */
export async function reopenRejected(input: {
  adminId: string;
  applicationId: string;
  reason: string;
}) {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(applications)
      .where(eq(applications.id, input.applicationId))
      .limit(1)
      .for("update");
    if (rows.length === 0) throw new DomainError("Application not found.");
    const app = rows[0];
    if (app.lifecycleStatus !== "Rejected") {
      throw new DomainError("Only rejected applications can be reopened.");
    }
    if (!input.reason.trim()) throw new DomainError("A reopen reason is required.");
    await tx
      .update(applications)
      .set({
        lifecycleStatus: "In Review",
        needsReReview: false,
        reviewedRevision: app.revision,
        reopenedBy: input.adminId,
        reopenedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(applications.id, app.id));
    await tx.insert(applicationStatusEvents).values({
      applicationId: app.id,
      fromStatus: "Rejected",
      toStatus: "In Review",
      actorUserId: input.adminId,
      reason: input.reason,
    });
    await audit({
      actorUserId: input.adminId,
      entityType: "application",
      entityId: app.id,
      action: "reopened",
      changes: { from: "Rejected", to: "In Review", reason: input.reason },
    }, tx);
    const [listing] = await tx.select({ title: internships.title })
      .from(internships).where(eq(internships.id, app.internshipId)).limit(1);
    await enqueueEmail({
      eventKey: `status-change:reopened:${app.id}:${new Date().getTime()}`,
      recipient: app.email,
      templateKey: "status-change",
      payload: {
        studentName: app.firstName,
        internshipTitle: listing?.title ?? "Internship",
        applicationRef: applicationRef(app.id),
        status: "In Review",
        nextStep: STATUS_NEXT_STEPS["In Review"],
      },
    }, tx);
  });
}

export function allowedTransitionsFor(
  status: ApplicationStatus,
): ApplicationStatus[] {
  return allowedNextStatuses(status, "admin");
}

// ----------------------------------------------------------------- students
export async function listAdminStudents(input: {
  q?: string;
  sort?: "name" | "newest";
  page: number;
  pageSize: number;
}) {
  const where = input.q
    ? or(
        ilike(profiles.displayName, `%${input.q}%`),
      )
    : undefined;
  const rows = await db
    .select()
    .from(profiles)
    .where(where)
    .orderBy(
      input.sort === "newest" ? desc(profiles.createdAt) : asc(profiles.displayName),
      asc(profiles.userId),
    )
    .limit(input.pageSize)
    .offset((input.page - 1) * input.pageSize);
  const totalStudentRows = await db.select({ n: count() }).from(profiles).where(where);
  return { rows, total: singleCount(totalStudentRows) };
}

export async function getAdminStudent(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  if (!profile) return null;
  const apps = await db
    .select({
      application: applications,
      internshipTitle: internships.title,
    })
    .from(applications)
    .innerJoin(internships, eq(applications.internshipId, internships.id))
    .where(eq(applications.applicantUserId, userId))
    .orderBy(desc(applications.updatedAt));
  const studentPlacements = await db
    .select()
    .from(placements)
    .where(eq(placements.studentUserId, userId));
  return { profile, applications: apps, placements: studentPlacements };
}

// --------------------------------------------------------------- placements
export async function listAdminPlacements(input: {
  q?: string;
  status?: string;
  page: number;
  pageSize: number;
}) {
  const conds = [];
  if (input.status) conds.push(eq(placements.placementStatus, input.status));
  if (input.q) {
    conds.push(
      or(
        ilike(placements.organization, `%${input.q}%`),
        ilike(placements.role, `%${input.q}%`),
      ),
    );
  }
  const where = conds.length > 0 ? and(...conds) : undefined;
  const rows = await db
    .select()
    .from(placements)
    .where(where)
    .orderBy(desc(placements.updatedAt), asc(placements.id))
    .limit(input.pageSize)
    .offset((input.page - 1) * input.pageSize);
  const totalPlacementRows = await db.select({ n: count() }).from(placements).where(where);
  return { rows, total: singleCount(totalPlacementRows) };
}

export async function savePlacement(
  actor: AdminActor,
  input: unknown,
  id?: string,
) {
  const values = placementInputSchema.parse(input);
  const now = new Date();
  return db.transaction(async (tx) => {
    let studentUserId = values.studentUserId;
    if (id) {
      const [current] = await tx.select().from(placements)
        .where(eq(placements.id, id)).limit(1).for("update");
      if (!current) throw new DomainError("Placement not found.");
      studentUserId = current.studentUserId;
      if (values.studentUserId !== studentUserId) {
        throw new DomainError("A placement's student cannot be changed.");
      }
    } else {
      const [profile] = await tx.select({ userId: profiles.userId }).from(profiles)
        .where(eq(profiles.userId, studentUserId)).limit(1);
      if (!profile) throw new DomainError("Student not found.");
    }
    if (values.applicationId) {
      const [application] = await tx.select().from(applications)
        .where(eq(applications.id, values.applicationId)).limit(1).for("share");
      if (!application || application.applicantUserId !== studentUserId || application.isDraft) {
        throw new DomainError("Select a submitted application belonging to this student.");
      }
    }
    if (id) {
      await tx
        .update(placements)
        .set({
          organization: values.organization,
          role: values.role,
          countryCode: values.countryCode,
          startDate: values.startDate || null,
          endDate: values.endDate || null,
          notes: values.notes || null,
          applicationId: values.applicationId || null,
          updatedBy: actor.id,
          updatedAt: now,
        })
        .where(eq(placements.id, id));
      await audit({
        actorUserId: actor.id,
        entityType: "placement",
        entityId: id,
        action: "updated",
        changes: { organization: values.organization, role: values.role },
      }, tx);
      return { id };
    }
    const inserted = await tx
      .insert(placements)
      .values({
        studentUserId,
        applicationId: values.applicationId || null,
        organization: values.organization,
        role: values.role,
        countryCode: values.countryCode,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        notes: values.notes || null,
        placementStatus: "Preparing",
        createdBy: actor.id,
      })
      .returning({ id: placements.id });
    await audit({
      actorUserId: actor.id,
      entityType: "placement",
      entityId: inserted[0].id,
      action: "created",
      changes: { studentUserId: values.studentUserId },
    }, tx);
    return { id: inserted[0].id };
  });
}

export async function transitionPlacement(input: {
  adminId: string;
  placementId: string;
  to: string;
}) {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(placements)
      .where(eq(placements.id, input.placementId))
      .limit(1)
      .for("update");
    if (rows.length === 0) throw new DomainError("Placement not found.");
    const check = canTransitionPlacement(
      rows[0].placementStatus as never,
      input.to as never,
    );
    if (!check.ok) throw new DomainError(check.reason ?? "Placement transition is not permitted.");
    await tx
      .update(placements)
      .set({
        placementStatus: input.to,
        updatedBy: input.adminId,
        updatedAt: new Date(),
      })
      .where(eq(placements.id, input.placementId));
    await audit({
      actorUserId: input.adminId,
      entityType: "placement",
      entityId: input.placementId,
      action: `status:${rows[0].placementStatus}->${input.to}`,
      changes: { from: rows[0].placementStatus, to: input.to },
    }, tx);
    return { allowed: allowedNextPlacementStatuses(input.to as never) };
  });
}

// ------------------------------------------------------------ notifications
export async function listAdminNotifications(input: {
  unreadOnly?: boolean;
  page: number;
  pageSize: number;
}) {
  const where =
    input.unreadOnly === true ? eq(adminNotifications.isRead, false) : undefined;
  const [rows, counts] = await Promise.all([db
    .select({
      notification: adminNotifications,
      applicationEmail: applications.email,
      internshipTitle: internships.title,
    })
    .from(adminNotifications)
    .leftJoin(
      applications,
      eq(adminNotifications.applicationId, applications.id),
    )
    .leftJoin(internships, eq(applications.internshipId, internships.id))
    .where(where)
    .orderBy(desc(adminNotifications.createdAt), desc(adminNotifications.id))
    .limit(input.pageSize)
    .offset((input.page - 1) * input.pageSize),
  db.select({ total: count() }).from(adminNotifications).where(where)]);
  return { rows, total: counts[0]?.total ?? 0 };
}

export async function markNotificationRead(id: string) {
  await db
    .update(adminNotifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(adminNotifications.id, id));
}

// ------------------------------------------------------------------- misc
export async function listCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function recentAudit(limit = 25) {
  return db
    .select()
    .from(auditEvents)
    .orderBy(desc(auditEvents.createdAt))
    .limit(limit);
}

export async function isAdmin(userId: string): Promise<boolean> {
  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.userId, userId))
    .limit(1);
  return rows.length > 0 && rows[0].active === true;
}

export { formatSgd };
