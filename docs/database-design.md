# Database Design — Jalanin Internship Platform (standalone PostgreSQL 16)

UUID PKs (`gen_random_uuid()`), `timestamptz` UTC, FKs with sensible
`ON DELETE` rules, `CHECK`s, targeted indexes. **No RLS**: migration
`0005_remove_rls.sql` retired every Supabase policy; authorization is enforced
exclusively in application code (`requireStudent`/`requireAdmin` + ownership
checks on every query). Migrations: `db/migrations/*.sql`
(version-controlled, Drizzle-compatible). ER summary below; authoritative DDL
is the migration history, starting `0001_init.sql`.

## Tables

| Table | Key columns | Constraints / indexes |
|---|---|---|
| `users` | `id`, `email UNIQUE (lower)`, `password_hash` (bcrypt), `email_verified_at`, `legacy_auth_id UNIQUE` (cutover only), timestamps | native identity (`0006_native_auth.sql`); email login case-insensitive |
| `user_sessions` | `id`, `user_id FK CASCADE`, `token_hash UNIQUE` (SHA-256), `expires_at`, `revoked_at`, `last_seen_at`, `user_agent` | ≤10 live sessions/user; absolute expiry |
| `user_tokens` | `id`, `user_id FK CASCADE`, `purpose` (`verify_email`/`password_reset`), `token_hash UNIQUE`, `expires_at`, `consumed_at` | single-use; 24 h verify / 1 h reset |
| `profiles` | `user_id PK (= users.id)`, `display_name`, timestamps | admin-readable directory only |
| `admin_users` | `user_id PK`, `active`, `granted_at`, `granted_by` | server-provisioned; never client-writable |
| `categories` | `id`, `slug UNIQUE`, `name UNIQUE`, `active` | — |
| `internships` | `id`, `slug UNIQUE`, `title`, `city`, `country_code`, `category_id FK`, `start_date`, `end_date`, `description`, `responsibilities`, `requirements`, `publication_status ('Draft','Published','Unpublished')`, `featured`, `application_deadline NULL`, `published_at`, timestamps | `CHECK(start_date<=end_date)`; idx `(publication_status)`, `(country_code)`, `(category_id)`, `(start_date)`; trigram/ILIKE search on title+city |
| `applications` | `id`, `internship_id FK→internships (RESTRICT)`, `applicant_user_id (= users.id)`, snapshot fields, `lifecycle_status (...)`, `is_draft`, `submitted_at`, `revision`, `reviewed_revision`, `needs_re_review`, `reopened_by/at NULL`, timestamps | `UNIQUE(applicant_user_id, internship_id)` — one application per student per internship, drafts included; idx `(applicant_user_id)`, `(internship_id)`, `(lifecycle_status)`, `(submitted_at)` |
| `application_revisions` | `id`, `application_id FK CASCADE`, `revision`, `changed_fields TEXT[]`, `old_values`/`new_values JSONB` (secrets excluded), `edited_by`, `created_at` | `UNIQUE(application_id, revision)`; append-only |
| `application_documents` | `id`, `application_id FK CASCADE`, `document_type ('cv')`, `storage_path` (`file:<uuid>/cv.<ext>`), `original_filename`, `mime_type`, `byte_size`, `uploaded_by`, `created_at` | private filesystem; metadata only, no file bytes in DB; one active CV per application |
| `application_status_events` | `id`, `application_id FK CASCADE`, `from_status`, `to_status`, `actor_user_id`, `reason`, `created_at` | append-only; idx `(application_id, created_at)` |
| `quotations` | `id`, `application_id FK CASCADE`, `amount_minor INTEGER > 0`, `currency DEFAULT 'SGD' CHECK(currency='SGD')`, `notes_student TEXT NOT NULL` (terms), `notes_internal TEXT` (admin-only), `created_by`, `created_at`, `sent_at`, `revision`, `expires_at NULL` (reserved, unused — B01) | money as integer minor units, never float |
| `placements` | `id`, `student_user_id`, `application_id NULL FK`, `organization`, `role`, `country_code`, `start_date/end_date NULL`, `placement_status (...)`, `created_by`, `updated_by`, timestamps | idx `(student_user_id)`; transitions enforced in app + `CHECK` on known values |
| `admin_notifications` | `id`, `application_id NULL FK`, `event_key UNIQUE`, `event_type (...)`, `is_read`, `created_at`, `read_at` | unread counts from this table |
| `notification_outbox` | `id`, `event_key UNIQUE`, `recipient`, `template_key`, `payload JSONB` (minimal, no CV bytes), `status`, `attempt_count`, `next_attempt_at`, `sent_at`, `error`, `provider_message_id` | dispatcher claims by `event_key`; idempotent retries |
| `audit_events` | `id`, `actor_user_id NULL`, `entity_type`, `entity_id`, `action`, `changes JSONB` (sanitized), `created_at` | append-only; idx `(entity_type, entity_id)` |
| `contact_submissions` | `id`, `name`, `email`, `subject NULL`, `message`, `created_at`, `origin` | stored + listed in admin |
| `consent_records` | `id`, `user_id NULL`, `application_id NULL FK`, `policy_type`, `policy_version`, `consented_at` | proof of consent + version |
| `policy_versions` | `policy_type PK`, `version PK`, `content_hash`, `published_at` | current version joined at submit time |
| `analytics_events` / `request_rate_limits` | allowlisted events / hashed throttle buckets | server-written only; no PII |

## Draft vs submitted

`is_draft=true` pre-submission rows share the same `UNIQUE` key, so resume
edits the existing row (no duplicates). Submit flips `is_draft=false`,
sets `lifecycle_status='New'`, `submitted_at`, `revision=1` in one
transaction with audit + notification + outbox rows.

## Authorization (application-level; no RLS)

Every server query is preceded by `requireStudent`/`requireAdmin` plus an
ownership check (`applicant_user_id = session.user.id`,
`student_user_id = ...`, or `isAdminUser(...)`). Public reads (published
internships/categories/policy versions) filter `publication_status` /
`active` in the query itself. Private CV bytes never leave
`PRIVATE_UPLOAD_DIR` except through the authorized download route (admin
only by default, B05). Students never read quotation amounts (status only).

## Seed data (`db/seed.sql`, dev/test only)

Deterministic: 4 categories, 6 published + 1 draft internships across
Singapore/Malaysia/Thailand, no personal data. Test users created by
`pnpm db:seed:test` docs, never committed credentials.
