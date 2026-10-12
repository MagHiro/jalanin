# Jalanin Internship Platform

Separate-subdomain internship discovery + application + quotation platform for
Jalanin (`internships.jalanin.com`). Next.js 14 (App Router) + TypeScript strict +
Tailwind · PostgreSQL (Docker locally, Supabase hosted in prod) · Supabase Auth ·
Supabase Storage (private) · Vercel. Implements PRD v0.4 (`docs/Jalanin_Internship_Platform_PRD_v0.4.md`).

## Quickstart (new developer)

Prerequisites: Node 20+, pnpm 9+, Docker (or the no-Docker fallback below),
Supabase CLI (required for local Supabase Auth/Storage).

```bash
pnpm install
cp .env.example .env.local      # fill Supabase local keys from 'supabase status -o env'
pnpm db:start                   # Supabase CLI: Docker Postgres :54322, Auth :54321, Storage
pnpm db:seed                    # deterministic dev listings (migrations applied by Supabase)
pnpm dev                        # http://localhost:3000
```

For PostgreSQL-only integration tests, `pnpm db:postgres-only` runs Docker
Compose (PostgreSQL + Mailpit). Override both `DATABASE_URL` and
`SUPABASE_DB_URL` to
`postgresql://jalanin:jalanin@127.0.0.1:54322/jalanin`, then run
`pnpm db:migrate && pnpm db:seed`. This database-only mode **does not run
Supabase Auth or Storage**. Do not start both stacks simultaneously, since
both use port 54322. On the full local stack, the Supabase CLI applies
migrations automatically; do not run the standalone migration runner again.

Standalone CLI commands (`pnpm db:migrate`, `pnpm db:seed`,
`pnpm db:seed:test`, `pnpm admin:grant`, `pnpm email:dispatch`, and
`pnpm db:generate`) now load Next.js-style environment files automatically
via `@next/env`. You do **not** need `node --env-file=...` or `dotenv`.
For local development, precedence is: **exported shell environment** →
`.env.development.local` → `.env.local` → `.env.development` → `.env`.
CI can continue supplying `DATABASE_URL` directly. Never commit real
credentials.

**Hosted Supabase development:** Create a separate Supabase development
project and put its API keys and the **Session Pooler PostgreSQL connection**
in `.env.local` (both `DATABASE_URL` and `SUPABASE_DB_URL`). The direct
`db.<project>.supabase.co` connection may require IPv6 and fail with
`ENETUNREACH` on IPv4-only networks. Run `pnpm db:migrate`, then
`pnpm db:seed`, then `pnpm dev` (do **not** start the local Docker stack).
`pnpm db:seed:test` **deletes user records**, so it explicitly refuses
remote database hosts. Use the local PostgreSQL CI/test database instead.
When using the local Supabase CLI stack, `supabase start` applies migrations
as part of its initialization; avoid applying them twice via another tool.

Development and production both use PostgreSQL; Supabase hosts PostgreSQL,
Auth, and private Storage in production. Production must configure
`STORAGE_BACKEND=supabase`, real Supabase credentials, and SMTP email.
The placeholder keys in `.env.example` are not working credentials.

Useful commands:

```bash
pnpm db:stop | pnpm db:reset | pnpm db:seed:test
pnpm dev | pnpm lint | pnpm typecheck
pnpm test            # vitest: unit + integration (needs DATABASE_URL)
pnpm test:e2e        # playwright (needs dev server + E2E_MODE=1)
pnpm build
pnpm email:dispatch  # outbox worker (local)
pnpm admin:grant <auth-user-uuid>   # privileged admin provisioning
```

Local email: `EMAIL_PROVIDER=log` writes rendered mail to
`.storage-local/mailbox/*.json` (no SMTP needed). `smtp` targets Mailpit
(`localhost:1025`, UI `:8025`) when available.

## Repository map

- `src/app` — routes: `/` landing, `/opportunities`, `/apply/[id]`,
  `/dashboard`, `/admin`, `/auth`, `/api`, SEO (`sitemap`, `robots`).
- `src/features` — `internships/`, `applications/` (draft/submit/revision),
  `admin/` (overview, listings, review, students, placements, notifications).
- `src/lib` — `workflow/` (tested state machines), `validation/` (Zod),
  `auth/` (server session + role), `db/` (Drizzle privileged client + schema),
  `email/` (provider adapter, templates, outbox), `storage/` (document store),
  `security/` (rate limit, Turnstile), `analytics/` (privacy-safe events).
- `supabase/migrations` — schema, RLS, least-privilege hardening and
  operational event/throttle migrations (0001–0004).
- `tests/` — `unit/` (30), `integration/` (DB constraints), `e2e/` (15 journeys).
- `docs/` — PRD, requirements matrix, architecture, database design,
  implementation plan, open decisions, deployment, UAT checklist.

## Key product rules

- One application per student per internship (`UNIQUE`, incl. drafts).
- Submitted edits (owner, `New`/`In Review` only) → revision + admin re-review;
  progression blocked until acknowledged; hard lock at `Quotation Sent`.
- Quotations SGD-only (integer cents), emailed amount + terms; internal notes
  never emailed; no expiry claimed. Reply-by-email acceptance, admin records.
- Placements admin-managed (`Preparing → Confirmed → Active → Completed`,
  `Cancelled` terminal). No payments anywhere. See `docs/open-decisions.md`
  for the 10 pending product decisions and interim rules.
