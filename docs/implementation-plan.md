# Implementation Plan — Jalanin Internship Platform

Phases P0–P10 per master prompt §23. Status updated as work lands.

- [x] P0 Requirements & architecture (`docs/requirements-matrix.md`,
      `docs/architecture.md`, `docs/database-design.md`, `docs/open-decisions.md`,
      this plan)
- [ ] P1 Foundation: Next.js+TS+Tailwind+pnpm, lint/format, layouts/nav,
      env handling, docker-compose (postgres+mailpit), scripts
- [ ] P2 Database & auth: migrations, RLS, seed, Supabase Auth flows
      (register/login/logout/forgot/reset), profiles, admin provisioning,
      route protection, constraint/permission tests
- [ ] P3 Public platform: landing, `/opportunities` (search/filter/sort/page),
      `/opportunities/[slug]`, contact + Turnstile, SEO (sitemap/robots/meta)
- [ ] P4 Student applications: form + Zod, draft save/resume, upload, atomic
      submit (unique + idempotent), confirmation, revision + re-review + lock
- [ ] P5 Admin: overview (real counts), internship CRUD + publish, application
      directory + transitions + quotations (SGD), students, contacts,
      notifications, audit, reopen-rejected, manual complete
- [ ] P6 Student dashboard + placements: overview, applications, drafts,
      quotation status, placement history; admin placement CRUD + transitions
- [ ] P7 Email/ops: templates, outbox dispatcher + retries, Turnstile/rate
      limits, error logging, privacy-respecting analytics
- [ ] P8 Hardening & QA: unit (vitest), integration (DB), e2e (playwright 20
      journeys + V04 set), a11y checks, security review, perf pass
- [ ] P9 Deployment prep: `docs/deployment.md`, Vercel + Supabase runbooks,
      migration/seed instructions, backup/restore, rollback
- [ ] P10 Verification & handover: matrix reconciliation, full test runs,
      production build, UAT checklist, README/AGENTS, handover report

## Major risks

1. Supabase local stack vs single-Docker-Postgres (mitigation: storage/email
   adapters with local backends; `supabase/config.toml` + `docker-compose.yml`
   use one DB at a time — never two app databases).
2. Auth in tests without network (mitigation: unit-test pure domain modules;
   e2e gated behind `E2E_BASE_URL` + seeded local stack).
3. Legal/ops blockers B07/B08 (mitigation: DRAFT legal copy flagged, env-driven
   ops config, no launch claim until signed off).
