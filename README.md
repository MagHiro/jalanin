# Jalanin Internship Platform

Separate-subdomain internship discovery + application + quotation platform for
Jalanin (`internships.jalanin.com`). Next.js 14 (App Router) + TypeScript strict +
Tailwind · standalone PostgreSQL 16 · native auth (bcrypt + sessions) ·
filesystem storage (private + public) · Docker production. Implements PRD v0.4
(`docs/Jalanin_Internship_Platform_PRD_v0.4.md`). No Supabase anywhere.

## Quickstart (new developer)

Prerequisites: Node 20+, pnpm 9+, Docker (for PostgreSQL + Mailpit), or a
native PostgreSQL 16 (see below).

```bash
pnpm install
cp .env.example .env.local      # defaults target localhost PostgreSQL
pnpm db:start                   # Docker PostgreSQL :5432 + Mailpit :1025/:8025
pnpm db:migrate                 # version-controlled SQL in db/migrations
pnpm db:seed                    # deterministic dev listings
pnpm dev                        # http://localhost:3000
```

Native PostgreSQL (no Docker for the database):

```bash
# Install PostgreSQL 16, then:
createuser -s jalanin && createdb -O jalanin jalanin
# .env.local: DATABASE_URL=postgresql://jalanin:local_password@127.0.0.1:5432/jalanin
pnpm db:migrate && pnpm db:seed && pnpm dev
```

Standalone CLI commands (`pnpm db:migrate`, `pnpm db:seed`,
`pnpm db:seed:test`, `pnpm admin:grant`, `pnpm email:dispatch`, and
`pnpm db:generate`) load Next.js-style environment files automatically.
Precedence: **exported shell environment** → `.env.development.local` →
`.env.local` → `.env.development` → `.env`. Never commit real credentials.
`pnpm db:seed:test` truncates user data and refuses non-local hosts.

Useful commands:

```bash
pnpm db:stop | pnpm db:reset | pnpm db:seed:test | pnpm db:seed:demo
pnpm dev | pnpm lint | pnpm typecheck
pnpm test            # vitest: unit + integration (needs DATABASE_URL)
pnpm test:e2e        # playwright (needs dev server + E2E_MODE=1)
pnpm build
pnpm email:dispatch  # outbox worker (local)
pnpm admin:grant <email-or-user-uuid>   # privileged admin provisioning
pnpm migrate:supabase-pg | pnpm migrate:supabase-storage   # one-time cutover
pnpm backup:db | pnpm backup:files | ./scripts/restore-db.sh  # backups
```

Local email: `EMAIL_PROVIDER=log` writes rendered mail to
`.storage-local/mailbox/*.json` (no SMTP needed). `smtp` targets Mailpit
(`localhost:1025`, UI `:8025`) when available.

## Production (Docker)

```bash
cp .env.example .env.prod   # fill real secrets (untracked)
sudo docker compose -f compose.prod.yml --env-file .env.prod up -d --build
sudo docker compose -f compose.prod.yml --env-file .env.prod ps
curl https://internships.jalanin.com/api/health
```

Migrations run in the one-off `migrate` service before the app starts;
volumes `pgdata` / `private_files` / `public_uploads` persist everything.
Full procedure: `docs/deployment.md`. Backups/restore: `docs/runbook.md`.
One-time Supabase cutover: `docs/migration-cutover.md`.

## Repository map

- `src/app` — routes: `/` landing, `/opportunities`, `/apply/[id]`,
  `/dashboard`, `/admin`, `/auth`, `/api`, SEO (`sitemap`, `robots`).
- `src/features` — `internships/`, `applications/` (draft/submit/revision),
  `admin/` (overview, listings, review, students, placements, notifications).
- `src/lib` — `workflow/` (tested state machines), `validation/` (Zod),
  `auth/` (native session + role + crypto), `db/` (Drizzle privileged client + schema),
  `email/` (provider adapter, templates, outbox), `storage/` (filesystem document store),
  `security/` (rate limit, Turnstile), `analytics/` (privacy-safe events).
- `db/migrations` — schema (0001), operational events (0004), RLS removal
  (0005), native auth (0006). 0002–0003 are historical Supabase RLS, retained
  for source-database parity and retired by 0005.
- `tests/` — `unit/` (auth crypto, filesystem storage, services, routes),
  `integration/` (DB constraints), `e2e/` (journeys via the E2E session seam).
- `docs/` — PRD, requirements matrix, architecture, database design,
  deployment, runbook, migration cutover, UAT checklist.

## Key product rules

- One application per student per internship (`UNIQUE`, incl. drafts).
- Submitted edits (owner, `New`/`In Review` only) → revision + admin re-review;
  progression blocked until acknowledged; hard lock at `Quotation Sent`.
- Quotations SGD-only (integer cents), emailed amount + terms; internal notes
  never emailed; no expiry claimed. Reply-by-email acceptance, admin records.
- Placements admin-managed (`Preparing → Confirmed → Active → Completed`,
  `Cancelled` terminal). No payments anywhere. See `docs/open-decisions.md`
  for the 10 pending product decisions and interim rules.
