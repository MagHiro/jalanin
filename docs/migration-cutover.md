# Migration cutover — Supabase → standalone PostgreSQL + filesystem

Status: tooling implemented and tested against representative fixtures
(2026-10-19). **Live production data has NOT been migrated** — the steps
below require production credentials and a maintenance window.

## 1. Inventory (source of truth)

| Source (Supabase) | Destination (standalone) | Notes |
|---|---|---|
| 16 public tables (`categories` … `request_rate_limits`) | same tables, `db/migrations/0001` + `0004` | copied by `pnpm migrate:supabase-pg` |
| RLS policies + `auth.uid()` + `is_admin()` | **removed** by `0005_remove_rls.sql` | authz is application-level |
| `auth.users` / sessions / refresh tokens | `users` / `user_sessions` / `user_tokens` (`0006`) | passwords NOT portable |
| `documents` storage bucket (`supabase:` keys) | `PRIVATE_UPLOAD_DIR` (`file:` keys) | copied by `pnpm migrate:supabase-storage` |

Supabase-specific objects left untouched in the source: `auth.*`,
`storage.*`, `realtime.*`, `vault`, extensions. The scripts are read-only
against the source.

## 2. Pre-cutover checklist

1. Provision the production stack (`compose.prod.yml`) and take a
   pre-migration destination backup (`docs/runbook.md` §2).
2. Create a **read-only** Supabase pooler user for `SOURCE_DATABASE_URL`
   and a service key with storage-read for the migration host only.
3. Freeze writes (maintenance page) or accept a delta window with a second
   pass of the idempotent data script.

## 3. Cutover commands

```bash
# 1. Schema (idempotent; safe to re-run):
DATABASE_URL="postgresql://.../jalanin" pnpm db:migrate
# 2. Data (idempotent; validates counts + FK orphans, exits 1 on mismatch):
SOURCE_DATABASE_URL="postgresql://readonly:...@...:5432/postgres" \
DATABASE_URL="postgresql://.../jalanin" pnpm migrate:supabase-pg
# 3. Files (idempotent; verifies sizes, lists missing objects, exits 1):
SOURCE_SUPABASE_URL="https://<ref>.supabase.co" \
SOURCE_SUPABASE_SERVICE_KEY="<service-key>" \
DATABASE_URL="postgresql://.../jalanin" pnpm migrate:supabase-storage
# 4. Promote an operator to admin (after a user claims their account):
DATABASE_URL="postgresql://.../jalanin" pnpm admin:grant operator@jalanin.com
```

## 4. User identity cutover (passwords are NOT portable)

Supabase password hashes (bcrypt variants under `auth.users`) are not safely
exportable, so every account uses the **claim flow**:

1. The data script creates one `users` row per legacy identity with the SAME
   uuid (`legacy_auth_id` = old id) and a login-disabled placeholder hash —
   all application/document/placement relationships keep resolving.
2. Each user opens **Forgot password**, enters their Supabase email, and sets
   a new password (single-use 1-hour token, all sessions revoked on reset).
3. `REQUIRE_VERIFIED_EMAIL` stays `false` through cutover (existing users
   are pre-verified by the claim email itself); new signups verify via the
   24-hour `verify-email` outbox mail.
4. All Supabase sessions die at DNS cutover (cookies are app-scoped);
   users log in fresh. Announce this in advance.

## 5. Validation before opening traffic

- Row counts per table match the source (± the documented users skeleton).
- Zero FK orphans (script exits 1 otherwise).
- Every `application_documents.storage_path` starts with `file:` and
  resolves to a same-size file under `PRIVATE_UPLOAD_DIR`.
- `pnpm db:migrate` reports all-skipped; `/api/health` → `{"ok":true}`.
- Admin login → CV download 200; student download 403; anon 401.

## 6. What was proven with fixtures (2026-10-19)

- Source fixture at pre-`0005` shape (RLS policies + `auth.uid()` stub) →
  `migrate:supabase-pg` copied 4 categories / 7 internships / profiles /
  admin / applications / placements, built 2 `users` skeleton rows with
  `legacy_auth_id`, reported `VALIDATION OK`, and was idempotent on re-run.
- `migrate:supabase-storage` against a fixture HTTP source migrated
  `supabase:<uuid>/cv.pdf` → `file:<uuid>/cv.pdf` on disk + DB row update.
- Backup (`pg_dump` custom, 125 TOC entries) + restore into a scratch DB
  (7 internships / 1 user / 6 migrations) verified.
- Production Docker stack: `migrate` → `app (healthy)` + `postgres
  (healthy)`; signup/login/dashboard; CV upload → admin 200 / student 403 /
  anon 401; app rebuild + postgres restart preserved data and files.

## 7. Remaining blockers for the real cutover

- Live `SOURCE_DATABASE_URL` / `SOURCE_SUPABASE_*` credentials.
- Maintenance window + traffic freeze decision.
- Off-host backup destination + cron schedule.
- SMTP production credentials + sender verification.
- Turnstile production keys.
- `internships.jalanin.com` DNS/TLS + `NEXT_PUBLIC_APP_URL`.
