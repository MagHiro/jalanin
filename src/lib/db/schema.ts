// Canonical Drizzle schema for the Jalanin Internship Platform.
// Source of truth for DDL is version-controlled SQL in db/migrations
// (0001_init.sql for the domain, 0005_remove_rls.sql retiring Supabase RLS,
// 0006_native_auth.sql for application-managed authentication).
// The privileged server client (src/lib/db/client.ts) connects as the table
// owner — every caller MUST enforce authorization explicitly via
// src/lib/auth/require.ts before querying.
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Native application identity (db/migrations/0006_native_auth.sql).
// Passwords are bcrypt hashes — never plaintext. Email compare is
// case-insensitive via the lower(email) unique index; legacyAuthId exists
// ONLY for the one-time Supabase cutover import.
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    legacyAuthId: uuid("legacy_auth_id").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("users_email_lower_uq").on(sql`lower(${t.email})`)],
);

export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    userAgent: text("user_agent"),
  },
  (t) => [
    index("user_sessions_user_idx").on(t.userId),
    index("user_sessions_expires_idx").on(t.expiresAt),
  ],
);

export const userTokens = pgTable(
  "user_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: varchar("purpose", { length: 20 }).notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (t) => [index("user_tokens_user_idx").on(t.userId)],
);

export const adminUsers = pgTable("admin_users", {
  userId: uuid("user_id").primaryKey(),
  active: boolean("active").default(true).notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  grantedBy: uuid("granted_by"),
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull().unique(),
    active: boolean("active").default(true).notNull(),
  },
  (t) => [index("categories_active_idx").on(t.active)],
);

export const internships = pgTable(
  "internships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    city: varchar("city", { length: 120 }).notNull(),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    description: text("description").notNull(),
    responsibilities: text("responsibilities").notNull(),
    requirements: text("requirements").notNull(),
    publicationStatus: varchar("publication_status", { length: 20 })
      .default("Draft")
      .notNull(),
    featured: boolean("featured").default(false).notNull(),
    // Optional application deadline. Informational only unless B04 is
    // approved (see docs/open-decisions.md): never auto-unpublishes.
    applicationDeadline: timestamp("application_deadline", {
      withTimezone: true,
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("internships_pub_idx").on(t.publicationStatus),
    index("internships_country_idx").on(t.countryCode),
    index("internships_category_idx").on(t.categoryId),
    index("internships_start_idx").on(t.startDate),
    // NOTE: start_date <= end_date is enforced by CHECK in 0001_init.sql.
    // Trigram search index is likewise SQL-authoritative (0001_init.sql).
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    internshipId: uuid("internship_id")
      .notNull()
      .references(() => internships.id, { onDelete: "restrict" }),
    applicantUserId: uuid("applicant_user_id").notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    nationality: varchar("nationality", { length: 100 }).notNull(),
    university: varchar("university", { length: 200 }).notNull(),
    course: varchar("course", { length: 200 }).notNull(),
    graduationYear: integer("graduation_year").notNull(),
    preferredStart: date("preferred_start").notNull(),
    preferredEnd: date("preferred_end").notNull(),
    additionalInformation: text("additional_information"),
    lifecycleStatus: varchar("lifecycle_status", { length: 20 })
      .default("New")
      .notNull(),
    isDraft: boolean("is_draft").default(true).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    revision: integer("revision").default(1).notNull(),
    reviewedRevision: integer("reviewed_revision").default(1).notNull(),
    needsReReview: boolean("needs_re_review").default(false).notNull(),
    reopenedBy: uuid("reopened_by"),
    reopenedAt: timestamp("reopened_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // D05/D09: one application per student per internship, drafts included.
    unique("applications_student_internship_uq").on(
      t.applicantUserId,
      t.internshipId,
    ),
    index("applications_applicant_idx").on(t.applicantUserId),
    index("applications_internship_idx").on(t.internshipId),
    index("applications_status_idx").on(t.lifecycleStatus),
    index("applications_submitted_idx").on(t.submittedAt),
  ],
);

export const applicationRevisions = pgTable(
  "application_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    revision: integer("revision").notNull(),
    changedFields: text("changed_fields").array().notNull(),
    oldValues: jsonb("old_values").notNull(),
    newValues: jsonb("new_values").notNull(),
    editedBy: uuid("edited_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("application_revisions_app_rev_uq").on(t.applicationId, t.revision),
    index("application_revisions_app_idx").on(t.applicationId),
  ],
);

export const applicationDocuments = pgTable(
  "application_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    documentType: varchar("document_type", { length: 20 })
      .default("cv")
      .notNull(),
    storagePath: text("storage_path").notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 127 }).notNull(),
    byteSize: integer("byte_size").notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("application_documents_app_idx").on(t.applicationId)],
);

export const applicationStatusEvents = pgTable(
  "application_status_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    fromStatus: varchar("from_status", { length: 20 }),
    toStatus: varchar("to_status", { length: 20 }).notNull(),
    actorUserId: uuid("actor_user_id"),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("status_events_app_time_idx").on(t.applicationId, t.createdAt)],
);

// Money as integer minor units (cents), SGD only. Never floats.
export const quotations = pgTable(
  "quotations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    amountMinor: integer("amount_minor").notNull(),
    currency: varchar("currency", { length: 3 }).default("SGD").notNull(),
    notesStudent: text("notes_student").notNull(),
    notesInternal: text("notes_internal"),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    revision: integer("revision").default(1).notNull(),
    // Reserved for an approved future expiry policy (B01). Unused: never set,
    // never read for enforcement, never rendered.
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [
    unique("quotations_app_revision_uq").on(t.applicationId, t.revision),
    index("quotations_app_idx").on(t.applicationId),
  ],
);

export const placements = pgTable(
  "placements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentUserId: uuid("student_user_id").notNull(),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "set null",
    }),
    organization: varchar("organization", { length: 200 }).notNull(),
    role: varchar("role", { length: 200 }).notNull(),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    startDate: date("start_date"),
    endDate: date("end_date"),
    placementStatus: varchar("placement_status", { length: 20 })
      .default("Preparing")
      .notNull(),
    notes: text("notes"),
    createdBy: uuid("created_by").notNull(),
    updatedBy: uuid("updated_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("placements_student_idx").on(t.studentUserId)],
);

export const adminNotifications = pgTable(
  "admin_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "cascade",
    }),
    eventKey: text("event_key").notNull().unique(),
    eventType: varchar("event_type", { length: 40 }).notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [index("admin_notifications_read_idx").on(t.isRead, t.createdAt)],
);

export const notificationOutbox = pgTable(
  "notification_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventKey: text("event_key").notNull().unique(),
    recipient: varchar("recipient", { length: 320 }).notNull(),
    templateKey: varchar("template_key", { length: 80 }).notNull(),
    payload: jsonb("payload").notNull(),
    status: varchar("status", { length: 20 }).default("queued").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    error: text("error"),
    providerMessageId: text("provider_message_id"),
  },
  (t) => [index("outbox_status_next_idx").on(t.status, t.nextAttemptAt)],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id"),
    entityType: varchar("entity_type", { length: 60 }).notNull(),
    entityId: text("entity_id").notNull(),
    action: varchar("action", { length: 80 }).notNull(),
    changes: jsonb("changes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("audit_entity_idx").on(t.entityType, t.entityId)],
);

export const contactSubmissions = pgTable(
  "contact_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 200 }),
    message: text("message").notNull(),
    origin: varchar("origin", { length: 40 }).default("contact-form").notNull(),
    // Enquiry handling state (A3): Open / Handled. Defaults to Open.
    handlingStatus: varchar("handling_status", { length: 20 })
      .default("Open")
      .notNull(),
    handledAt: timestamp("handled_at", { withTimezone: true }),
    handledBy: uuid("handled_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("contact_created_idx").on(t.createdAt),
    index("contact_handling_idx").on(t.handlingStatus, t.createdAt),
  ],
);

export const consentRecords = pgTable("consent_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  applicationId: uuid("application_id").references(() => applications.id, {
    onDelete: "set null",
  }),
  policyType: varchar("policy_type", { length: 20 }).notNull(),
  policyVersion: varchar("policy_version", { length: 20 }).notNull(),
  consentedAt: timestamp("consented_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const policyVersions = pgTable(
  "policy_versions",
  {
    policyType: varchar("policy_type", { length: 20 }).notNull(),
    version: varchar("version", { length: 20 }).notNull(),
    contentHash: varchar("content_hash", { length: 128 }).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.policyType, t.version] })],
);

export { timestamps };
