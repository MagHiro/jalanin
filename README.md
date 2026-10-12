# Jalanin Internship Platform

Separate-subdomain internship discovery + application + quotation platform for
Jalanin (`internships.jalanin.com`). Next.js 14 (App Router) + TypeScript strict +
Tailwind · PostgreSQL (Docker locally, Supabase hosted in prod) · Supabase Auth ·
Supabase Storage (private) · Vercel. Implements PRD v0.4 (`docs/Jalanin_Internship_Platform_PRD_v0.4.md`).

## Quickstart (new developer)

Prerequisites: Node 20+, pnpm 9+, Docker (or the no-Docker fallback below),
Supabase CLI (optional full stack).

```bash
pnpm install
cp .env.example .env            # defaults work for local dev
pnpm db:start                   # Docker: postgres :54322 + mailpit :1025/:8025
pnpm db:migrate                 # version-controlled SQL (supabase/migrations)
pnpm db:seed                    # deterministic dev listings
pnpm dev                        # http://localhost:3000
```

No-Docker fallback (this environment): a user-space PostgreSQL 17 on port
54322 stands in for `docker compose up postgres`. `docker-compose.yml`
remains the canonical local DB definition (Supabase-CLI-parity port 54322).

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
- `supabase/migrations` — `0001_init.sql` (schema), `0002_rls.sql` (RLS).
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
