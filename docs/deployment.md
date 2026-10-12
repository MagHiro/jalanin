# Deployment — Jalanin Internship Platform

## Production topology

- **App:** Vercel, one Next.js deployment, custom subdomain
  `internships.jalanin.com` (D01). Legacy site untouched.
- **Data:** hosted Supabase project — PostgreSQL + Auth + Storage
  (private bucket `documents`).
- **Email:** SMTP provider (transactional host) via the outbox dispatcher.
- **Cron:** `POST /api/cron/dispatch-emails` (Bearer `CRON_SECRET`) on a
  5-minute schedule (Vercel Cron or equivalent).

## 1. Supabase project setup

1. Create the project in the Jalanin-owned Supabase account.
2. Apply migrations in order: `supabase/migrations/0001_init.sql`,
   then `0002_rls.sql` (SQL editor or `supabase db push`).
3. Create the private bucket and service-role-only policy (see the storage
   comment block at the end of `0002_rls.sql`):
   `documents`, `public = false`, service-role full access; no anon/authenticated grants.
4. Auth → URL configuration: Site URL `https://internships.jalanin.com`;
   redirect allowlist includes `/auth/callback`, `/auth/reset-password`.
5. Enable email confirmations + password recovery (Supabase Auth → Email).
6. Note the database backup plan/retention (min. provider-backed schedule;
   verify actual tier features against RPO ≤ 24 h / RTO ≤ 24 h targets).

## 2. Vercel setup

Environment variables (production):

| Name | Value |
|---|---|
| `DATABASE_URL` | Supabase pooled connection string (server only) |
| `SUPABASE_DB_URL` | Same, for migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key (server only) |
| `NEXT_PUBLIC_APP_URL` | `https://internships.jalanin.com` |
| `EMAIL_PROVIDER` | `smtp` |
| `EMAIL_FROM` / `EMAIL_REPLY_TO` | verified sender identity |
| `SMTP_HOST/PORT/USER/PASS/SECURE` | transactional SMTP |
| `ADMIN_ALERT_EMAIL` | Jalanin operations inbox(es) |
| `CRON_SECRET` | long random secret |
| `STORAGE_BACKEND` | `supabase` |
| `STORAGE_BUCKET` | `documents` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | production keys |
| `REQUIRE_VERIFIED_EMAIL` | `false` until AUTH-05 decided |

Domain: add `internships.jalanin.com` in Vercel → Domains; create the DNS
`CNAME` at the domain owner; verify TLS + canonical URLs.

## 3. Release procedure

1. `pnpm typecheck && pnpm lint && pnpm test`
2. Apply migrations to staging, then production (`pnpm db:migrate` with
   production `SUPABASE_DB_URL`). Never run destructive migrations
   automatically; review diffs first.
3. Promote the preview deployment after UAT sign-off (`docs/uat-checklist.md`).
4. Verify: auth + reset flows, submit → admin alert, quotation email,
   Turnstile on contact, sitemap/robots scoping, backup status.

## 4. Rollback

- App: Vercel → instant rollback to the previous deployment.
- Data: migrations are additive; each migration file documents its inverse.
  Restore from the provider backup per the runbook below if needed.

## 5. Backup & recovery runbook

- Owner: Jalanin account administrator. Schedule: provider-managed daily
  backups (verify retention on the chosen tier).
- Restore rehearsal: restore to a *new* Supabase project, run
  `pnpm db:migrate` idempotency check, verify counts via the admin overview,
  then swap connection strings. Target RPO/RTO ≤ 24 h (verify against plan).
- Secrets rotation: rotate leaked credentials immediately; anon key rotation
  requires redeploy; service-role rotation requires redeploy + storage check.

## 6. Monitoring

- Outbox: query `notification_outbox WHERE status='failed'`; dispatcher logs
  `processed/sent/failed`. Alert on repeated failures.
- App: Vercel logs + error tracking per approved provider; auth-failure spikes
  indicate abuse (rate limits + Turnstile already in front of public forms).
- Analytics intake logs to stdout (JSON `type: analytics`); no PII is stored.
