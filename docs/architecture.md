# Architecture — Jalanin Internship Platform

## 1. Overview

Modular monolith: single Next.js App Router application (Docker container in
production, `pnpm dev` on the host in development), standalone PostgreSQL 16
(local Docker PostgreSQL for development, containerized PostgreSQL in
production), native application authentication (bcrypt + opaque sessions),
filesystem storage (private + public roots), database-backed email outbox.
No microservices, queue infrastructure, Redis, Kubernetes, or Supabase.

Priorities (in order): correctness → security/privacy → data integrity →
performance → simplicity → accessibility → developer experience.

## 2. Runtime topology

```text
Visitor / Student / Admin --HTTPS--> Next.js App Router (Docker prod / pnpm dev)
  Public routes: SSR/ISR, no per-user data, short cache
  Authenticated routes: dynamic, native session (HttpOnly cookies)
  Mutations: Server Actions / Route Handlers, Zod validation, server authz
      |
      +-- Standalone PostgreSQL 16 (container prod / localhost dev) via:
      |     Drizzle ORM over privileged DATABASE_URL — trusted server code
      |     ONLY, every call preceded by explicit authz + ownership checks.
      |     No RLS: application-level authorization is the single layer.
      +-- Filesystem storage: PRIVATE_UPLOAD_DIR (restricted CVs, streamed
      |     downloads after authorization) + PUBLIC_UPLOAD_DIR (sanitized
      |     public assets with cache headers)
      +-- Email outbox (`notification_outbox`) -> dispatcher -> SMTP provider
          (Mailpit locally, configured SMTP in prod).
          Status mutations never depend on email success; retries idempotent.
```

## 3. Technology versions (pinned at implementation start)

Next.js 14 (App Router), React 18, TypeScript strict, Tailwind CSS,
Drizzle ORM + drizzle-kit, `pg`, `bcryptjs`,
`zod`, `react-hook-form`, `nodemailer`, `vitest`, `playwright`. See
`package.json` for exact pins and rationale comments.

## 4. Authorization model

- Single `admin` role: `admin_users(user_id)` table; provisioned by
  `pnpm admin:grant <email-or-user-uuid>` (server script) or SQL.
  Client-provided role claims are never trusted.
- Students: native `users.id` = `profiles.user_id`; all student queries
  scoped by server-side ownership checks in `src/lib/auth/require.ts`.
- No RLS: migration `0005_remove_rls.sql` retired every Supabase policy.
  The Drizzle server client connects as the table owner; every server
  mutation re-validates actor, role, ownership, and workflow preconditions.
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

`DocumentStore` (`src/lib/storage/`): filesystem only — private CVs under
`PRIVATE_UPLOAD_DIR` (outside the web root, streamed downloads after
authorization), sanitized public assets under `PUBLIC_UPLOAD_DIR`. Server
route validates MIME + magic bytes + size (PDF/DOCX ≤ 5 MB interim, see
B05), random object keys, no path traversal. No public directory for
student docs, ever. Legacy `local:`/`supabase:` row keys keep resolving
after the one-time file migration (`docs/migration-cutover.md`).

## 8. Validation, security, abuse

Zod schemas shared client/server (`src/lib/validation/`); server is source
of truth. Contact endpoints: Cloudflare Turnstile server verification
(`TURNSTILE_SECRET_KEY`, test keys documented) + PostgreSQL-backed rate
limiting (`src/lib/security/ratelimit.ts`); auth endpoints are rate-limited
per IP with generic failures (no account enumeration). Security headers in
`src/middleware.ts`. CSRF: origin checking on unsafe `/api/*` methods +
SameSite=Lax HttpOnly session cookies; no tokens in URLs except one-time
email-verification / password-reset links.

## 9. Rendering, caching, SEO, analytics

Landing: ISR. Directory: SSR with URL search params + short cache.
Detail: ISR by slug, revalidated on publish/edit/unpublish; eligibility
re-checked at submit time. Admin/auth/student: dynamic, `no-store`, noindex.
Sitemap/robots: published internships only. Analytics: lightweight,
consent-aware page/detail/apply/submit events, no PII (see `src/lib/analytics/`).

## 10. Environments and configuration

`DATABASE_URL` (server, privileged), `NEXT_PUBLIC_APP_URL`, SMTP, Turnstile,
`ADMIN_ALERT_EMAIL`, `CRON_SECRET`, `PRIVATE_UPLOAD_DIR` / `PUBLIC_UPLOAD_DIR`.
Never `NEXT_PUBLIC_` secrets. Full list: `.env.example`.
Local infra: `docker-compose.yml` (PostgreSQL 16 + Mailpit on localhost;
app runs via `pnpm dev`). Production: `compose.prod.yml` (app + PostgreSQL
containers, persistent volumes, one-off migrate service).
