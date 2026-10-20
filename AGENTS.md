# AGENTS.md — working rules for this repository

## Stack (pinned)

Next.js 14 App Router · React 18 · TypeScript strict · Tailwind · Drizzle ORM
(typed access over `DATABASE_URL`) + version-controlled SQL migrations ·
Supabase Auth/Storage clients · Zod (server is source of truth) · pnpm only.

## Non-negotiable rules

1. **`docs/Jalanin_Internship_Platform_PRD_v0.4.md` is the sole product
   documentation source of truth**, including confirmed decisions D01–D20
   and pending decisions B01–B10. Never ship
   placeholder behavior as a confirmed requirement, and never invent scope
   (no payments, portals, CRM, i18n, ML, exports).
2. **Authorization is server-side + RLS, never UI-only.**
   Use `requireStudent`/`requireAdmin` in every route/action; the privileged
   Drizzle client bypasses RLS, so ownership checks precede every query.
   Client-provided roles are never trusted. `admin_users` changes only via
   `pnpm admin:grant` / SQL.
3. **State machines live in `src/lib/workflow/`.**
   `transitions.ts` (applications) and `placements.ts` are the single source
   of transition truth — UI, services, and tests import them; do not duplicate
   transition tables in components.
4. **Money in integer minor units, SGD only.** No floats, no other currency,
   no expiry claims, no payment tables (B01/B02 pending).
5. **Email via outbox, never inline.** Mutations enqueue (`event_key` UNIQUE);
   the dispatcher sends with retries. Status changes never depend on delivery.
6. **Documents are private.** Server-validated (MIME + magic bytes + size),
   random keys, admin-only download by default (B05 pending).
7. **Validate every feature with appropriate tests (unit → integration → e2e).**
   A feature is done only when UI + backend + DB + authz + validation +
   states + tests all hold. Supplementary documentation was intentionally
   removed to avoid conflicting guidance; do not recreate it unless requested.

## Commands

`pnpm dev|lint|typecheck|test|test:e2e|build` ·
`pnpm db:start|db:stop|db:reset|db:migrate|db:seed|db:seed:test` ·
`pnpm email:dispatch` · `pnpm admin:grant <uuid>`.

## Environment

Local PostgreSQL on port 54322 (Docker `postgres` service). Never mix
local/prod credentials. `.env` is git-ignored;
`.env.example` is the canonical variable list. `E2E_MODE=1` tooling
(`src/app/api/dev/session`) is test-only and 404s otherwise.
