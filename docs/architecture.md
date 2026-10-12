# Architecture — Jalanin Internship Platform

## 1. Overview

Modular monolith: single Next.js App Router application on Vercel, Supabase
PostgreSQL (local Docker PostgreSQL for development), Supabase Auth, Supabase
Storage (private bucket), database-backed email outbox. No microservices,
queue infrastructure, Redis, or Kubernetes.

Priorities (in order): correctness → security/privacy → data integrity →
performance → simplicity → accessibility → developer experience.

## 2. Runtime topology

```text
Visitor / Student / Admin --HTTPS--> Vercel (Next.js App Router)
  Public routes: SSR/ISR, no per-user data, short cache
  Authenticated routes: dynamic, Supabase Auth session (HttpOnly cookies)
  Mutations: Server Actions / Route Handlers, Zod validation, server authz
      |
      +-- PostgreSQL (Supabase hosted prod / Docker locally) via:
      |     - Drizzle ORM over privileged DATABASE_URL — trusted server code
      |       ONLY, every call preceded by explicit authz + ownership checks.
      |     - Supabase JS client (RLS) for user-scoped reads where suitable.
      +-- Supabase Storage, private bucket `documents`
      |     uploads via server route (type/size validated) -> storage adapter
      |     downloads via short-lived signed URLs after authorization
      +-- Email outbox (`notification_outbox`) -> dispatcher -> SMTP provider
          (Mailpit locally, configured SMTP/Resend-compatible in prod).
          Status mutations never depend on email success; retries idempotent.
```

## 3. Technology versions (pinned at implementation start)

Next.js 14 (App Router), React 18, TypeScript strict, Tailwind CSS,
Drizzle ORM + drizzle-kit, `pg`, `@supabase/supabase-js` + `@supabase/ssr`,
`zod`, `react-hook-form`, `nodemailer`, `vitest`, `playwright`. See
`package.json` for exact pins and rationale comments.

## 4. Authorization model

- Single `admin` role: `admin_users(user_id)` table; provisioned by
  `pnpm admin:grant <email>` (server script using service key) or SQL.
  Client-provided role claims are never trusted.
- Students: Supabase Auth user id = `profiles.user_id`; all student queries
  scoped by `auth.uid()` (RLS) **and** server-side ownership checks.
- RLS enabled on all user-data tables; policies in `supabase/migrations/`.
  Drizzle server client bypasses RLS by design → every server mutation
  re-validates actor, role, ownership, and workflow preconditions.
- Sensitive reads (CV download, admin views) verify authorization at the
  server/database boundary, never in middleware or hidden UI alone.
- Per-operation enforcement map: see `docs/database-design.md` §RLS and
  `src/lib/auth/require.ts` (`requireStudent`, `requireAdmin`).

## 5. Domain workflows

- Application lifecycle: `Draft (client/db pre-submit)` → `New` → `In Review`
  → `Quotation Sent` → `Accepted | Rejected` → `Completed` (manual, admin).
  Transition table centralized in `src/lib/workflow/transitions.ts` (tested).
- One application per student per internship: `UNIQUE(applicant_user_id,
  internship_id)` at DB level; submit path is transactional + idempotent
  (Idempotency-Key / double-click guard).
- Post-submit edits (owner, status `New`/`In Review` only): bump `revision`,
  preserve field-level audit in `application_revisions`, set
  `needs_re_review=true`, create persistent admin notification, block
  `Quotation Sent`/`Accepted`/`Completed` until admin acknowledges
  (`reviewed_revision = revision`) in the same transaction as the next action.
- Edit lock: at `Quotation Sent` and later, all student write paths reject
  (server + RLS + UI). Rejected records are student read-only; reopen is
  admin-only (interim target: `In Review`, see `docs/open-decisions.md` B03).
- Quotations: SGD-only (`CHECK(currency='SGD')`, `amount_minor INTEGER > 0`,
  never floats). Email carries amount + currency + student terms; internal
  notes never enter student email. No expiry (B01 unresolved).
- Placements: admin-owned lifecycle
  `Preparing → Confirmed → Active → Completed`, `Cancelled` terminal from any
  non-terminal state (`src/lib/workflow/placements.ts`, tested). Linked to
  student + optional application; no auto-creation, no auto-completion sync.

## 6. Email and notifications

Small replaceable adapter: `EmailProvider` interface (`src/lib/email/`),
SMTP implementation via nodemailer. Outbox pattern: mutations insert
`notification_outbox` rows with `event_key UNIQUE` (dedupe); dispatcher
(`pnpm email:dispatch` / `POST /api/cron/dispatch-emails` with
`CRON_SECRET`) sends with retries (`attempt_count`, `next_attempt_at`).
Admin alerts additionally persist in `admin_notifications` (unread counts
derive from DB, never client state). Local testing via Mailpit (MailHog
protocol UI :8025, SMTP :1025, see `docker-compose.yml`).

## 7. Storage

`DocumentStore` adapter (`src/lib/storage/`): `supabase` backend (prod) and
`local` filesystem backend (dev default, `STORAGE_BACKEND=local`,
`STORAGE_LOCAL_DIR`). Server route validates MIME + magic bytes + size
(PDF/DOCX ≤ 5 MB interim, see B05), random object keys, no path traversal,
private bucket, signed-URL downloads only. No public bucket for student docs.

## 8. Validation, security, abuse

Zod schemas shared client/server (`src/lib/validation/`); server is source
of truth. Contact + auth endpoints: Cloudflare Turnstile server verification
(`TURNSTILE_SECRET_KEY`, test keys documented) + in-memory/IP rate limiting
(`src/lib/security/ratelimit.ts`). Security headers in `next.config.js`.
CSRF: Server Actions + same-origin cookie auth; no tokens in URLs except
one-time Supabase recovery links.

## 9. Rendering, caching, SEO, analytics

Landing: ISR. Directory: SSR with URL search params + short cache.
Detail: ISR by slug, revalidated on publish/edit/unpublish; eligibility
re-checked at submit time. Admin/auth/student: dynamic, `no-store`, noindex.
Sitemap/robots: published internships only. Analytics: lightweight,
consent-aware page/detail/apply/submit events, no PII (see `src/lib/analytics/`).

## 10. Environments and configuration

`DATABASE_URL` (server, privileged), `NEXT_PUBLIC_SUPABASE_URL` +
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser-safe), `SUPABASE_SERVICE_ROLE_KEY`
(server only), SMTP, Turnstile, `ADMIN_ALERT_EMAIL`, `CRON_SECRET`,
`STORAGE_BACKEND`. Never `NEXT_PUBLIC_` secrets. Full list: `.env.example`.
Local infra: `docker-compose.yml` (PostgreSQL 16 + Mailpit). Production:
hosted Supabase + Vercel, subdomain `internships.jalanin.com`.
