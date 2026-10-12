# Database Design — Jalanin Internship Platform

PostgreSQL 16. UUID PKs (`gen_random_uuid()`), `timestamptz` UTC, FKs with
sensible `ON DELETE` rules, `CHECK`s, targeted indexes, RLS on user-data
tables. Migrations: `supabase/migrations/*.sql` (version-controlled,
Drizzle-compatible). ER summary below; authoritative DDL is the migration
history, starting `0001_init.sql`.

## Tables

| Table | Key columns | Constraints / indexes |
|---|---|---|
| `profiles` | `user_id PK/FK auth.users`, `display_name`, timestamps | admin-readable directory only |
| `admin_users` | `user_id PK`, `active`, `granted_at`, `granted_by` | server-provisioned; never client-writable |
| `categories` | `id`, `slug UNIQUE`, `name UNIQUE`, `active` | — |
| `internships` | `id`, `slug UNIQUE`, `title`, `city`, `country_code`, `category_id FK`, `start_date`, `end_date`, `description`, `responsibilities`, `requirements`, `publication_status ('Draft','Published','Unpublished')`, `featured`, `application_deadline NULL`, `published_at`, timestamps | `CHECK(start_date<=end_date)`; idx `(publication_status)`, `(country_code)`, `(category_id)`, `(start_date)`; trigram/ILIKE search on title+city |
| `applications` | `id`, `internship_id FK→internships (RESTRICT)`, `applicant_user_id FK`, snapshot fields (`first_name`, `last_name`, `email`, `nationality`, `university`, `course`, `graduation_year`, `preferred_start`, `preferred_end`, `additional_information`), `lifecycle_status ('New','In Review','Quotation Sent','Accepted','Rejected','Completed')`, `is_draft`, `submitted_at`, `revision` (default 1), `reviewed_revision` (default 1), `needs_re_review` (default false), `reopened_by/at NULL`, timestamps | `UNIQUE(applicant_user_id, internship_id)` — one application per student per internship, drafts included; idx `(applicant_user_id)`, `(internship_id)`, `(lifecycle_status)`, `(submitted_at)` |
| `application_revisions` | `id`, `application_id FK CASCADE`, `revision`, `changed_fields TEXT[]`, `old_values JSONB`, `new_values JSONB` (secrets excluded), `edited_by`, `created_at` | `UNIQUE(application_id, revision)`; append-only |
| `application_documents` | `id`, `application_id FK CASCADE`, `document_type ('cv')`, `storage_path`, `original_filename`, `mime_type`, `byte_size`, `uploaded_by`, `created_at` | private bucket; metadata only, no file bytes in DB |
| `application_status_events` | `id`, `application_id FK CASCADE`, `from_status`, `to_status`, `actor_user_id`, `reason`, `created_at` | append-only; idx `(application_id, created_at)` |
| `quotations` | `id`, `application_id FK CASCADE`, `amount_minor INTEGER > 0`, `currency DEFAULT 'SGD' CHECK(currency='SGD')`, `notes_student TEXT NOT NULL` (terms), `notes_internal TEXT` (admin-only), `created_by`, `created_at`, `sent_at`, `revision` (default 1), `expires_at NULL` (reserved, unused — B01) | money as integer minor units, never float |
| `placements` | `id`, `student_user_id`, `application_id NULL FK`, `organization`, `role`, `country_code`, `start_date/end_date NULL`, `placement_status ('Preparing','Confirmed','Active','Completed','Cancelled')`, `created_by`, `updated_by`, timestamps | idx `(student_user_id)`; transitions enforced in app + `CHECK` on known values |
| `admin_notifications` | `id`, `application_id NULL FK`, `event_key UNIQUE`, `event_type ('new_application','revision_re_review')`, `is_read`, `created_at`, `read_at` | unread counts from this table |
| `notification_outbox` | `id`, `event_key UNIQUE`, `recipient`, `template_key`, `payload JSONB` (minimal, no CV bytes), `status ('queued','sent','failed')`, `attempt_count`, `next_attempt_at`, `sent_at`, `error`, `provider_message_id` | dispatcher claims by `event_key`; idempotent retries |
| `audit_events` | `id`, `actor_user_id NULL`, `entity_type`, `entity_id`, `action`, `changes JSONB` (sanitized), `created_at` | append-only; idx `(entity_type, entity_id)` |
| `contact_submissions` | `id`, `name`, `email`, `subject NULL`, `message`, `created_at`, `origin` | stored + listed in admin |
| `consent_records` | `id`, `user_id NULL`, `application_id NULL FK`, `policy_type`, `policy_version`, `consented_at` | proof of consent + version |
| `policy_versions` | `policy_type PK ('privacy','terms')`, `version PK`, `content_hash`, `published_at` | current version joined at submit time |

## Draft vs submitted

`is_draft=true` pre-submission rows share the same `UNIQUE` key, so resume
edits the existing row (no duplicates). Submit flips `is_draft=false`,
sets `lifecycle_status='New'`, `submitted_at`, `revision=1` in one
transaction with audit + notification + outbox rows.

## RLS summary (policies in migrations; Drizzle privileged client bypasses RLS)

| Resource | anon | student (own rows via `auth.uid()`) | admin (`is_admin()`) |
|---|---|---|---|
| published internships/categories | SELECT | SELECT | ALL |
| unpublished internships | — | — | ALL (server check too) |
| profiles | — | own | SELECT directory |
| applications | — | own: draft INSERT/UPDATE; submitted UPDATE only when status in (`New`,`In Review`) and not `needs...` — full lock logic enforced server-side; SELECT own | SELECT/UPDATE workflow fields (server transition guard) |
| application_documents/revisions/status events | — | own SELECT (no direct INSERT; server writes) | SELECT; INSERT via server |
| quotations | — | none (dashboard shows status only) | ALL via server |
| placements | — | own SELECT | ALL via server |
| admin_notifications / outbox / audit | — | — | SELECT (+ update `is_read`); writes server-side |
| contact_submissions | INSERT via server route only (no direct table grant) | same | SELECT |

`is_admin()` = `EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()
AND active)`. Storage `documents` bucket: no public access; service-role
up/down-load from server routes after authz; signed URLs ≤ 60 s for admin CV
download. Student download of own CV: denied by default (open decision B05).

## Seed data (`supabase/seed.sql`, dev/test only)

Deterministic: 4 categories, 6 published + 1 draft internships across
Singapore/Malaysia/Thailand, no personal data. Test users created by
`pnpm db:seed:test` docs, never committed credentials.
