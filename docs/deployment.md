# Deployment — Jalanin Internship Platform (standalone PostgreSQL + Docker)

## Production topology

- **App:** Next.js 14 container (`compose.prod.yml` → `app`), non-root,
  standalone output, health-gated on `/api/health`.
- **Database:** PostgreSQL 16 container (`postgres`), private Docker network,
  persistent `pgdata` volume, never exposed publicly.
- **Files:** `private_files` volume (restricted CVs, auth-gated downloads) +
  `public_uploads` volume (sanitized public assets). Both survive rebuilds.
- **Migrations:** one-off `migrate` container runs before the app starts;
  the app never reports healthy until schema `0006_native_auth.sql` exists.
- **Email:** SMTP provider via the outbox dispatcher (`/api/cron/dispatch-emails`
  with `Authorization: Bearer <CRON_SECRET>` on a 5-minute schedule).
- **Development:** PostgreSQL (+ Mailpit) on localhost via `docker compose`;
  the app runs on the host with `pnpm dev`. No Supabase anywhere.

## 1. Environment (.env.prod)

Copy `.env.example` to `.env.prod` (untracked) and set real secrets.
Required keys: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`,
`DATABASE_URL` (host `postgres`, e.g.
`postgresql://USER:PASS@postgres:5432/DB`), `NEXT_PUBLIC_APP_URL`,
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` (+ `NEXT_PUBLIC_ANALYTICS_ENABLED=false`
unless analytics is wanted), `EMAIL_PROVIDER=smtp` + SMTP settings,
`ADMIN_ALERT_EMAIL`, `CRON_SECRET`, `RATE_LIMIT_PEPPER`, Turnstile
production `TURNSTILE_SECRET_KEY`. See `.env.example` for the full
reference. Never commit `.env.prod`.

> `NEXT_PUBLIC_*` values are inlined into client JS at **build time** and
> cannot come from `env_file` at runtime. `compose.prod.yml` forwards them
> from `.env.prod` as Docker build args, so a domain/key change requires a
> rebuild (`up -d --build`). Server secrets (`DATABASE_URL`, `SMTP_*`,
> `CRON_SECRET`, `RATE_LIMIT_PEPPER`, `TURNSTILE_SECRET_KEY`) stay
> runtime-only via `env_file` and are never build args. The builder itself
> needs NO database: `src/lib/db/client.ts` uses a placeholder connection
> string when `DATABASE_URL` is absent (any real query still fails loudly),
> and `src/app/sitemap.ts` is `force-dynamic` so it renders on first request
> after migrations instead of at build time.

## 2. First deploy / release procedure

1. `pnpm typecheck && pnpm lint && pnpm test` (179 unit/integration checks).
2. `pnpm build` (standalone production bundle).
3. `sudo docker compose -f compose.prod.yml --env-file .env.prod up -d --build`
4. Watch: `sudo docker compose -f compose.prod.yml --env-file .env.prod ps` —
   `migrate` must exit 0, `app` and `postgres` must be `(healthy)`.
5. Verify: `/api/health` → `{"ok":true}`; auth + reset flows; submit →
   admin alert; quotation email; Turnstile on contact; backup status.
6. Seed demo data NEVER in production (`pnpm db:seed:demo` refuses remotes).

## 3. Rollback

- App: `docker compose -f compose.prod.yml --env-file .env.prod up -d`
  with the previous image tag (migrations are additive; each file documents
  its inverse for the rare revert).
- Data: restore from the pg_dump backup per `docs/runbook.md`; re-verify
  `/api/health` and row counts before reopening traffic.

## 4. Health checks & troubleshooting

```bash
sudo docker compose -f compose.prod.yml --env-file .env.prod ps
sudo docker compose -f compose.prod.yml --env-file .env.prod logs -f app
sudo docker compose -f compose.prod.yml --env-file .env.prod logs -f postgres
sudo docker compose -f compose.prod.yml --env-file .env.prod logs migrate
curl https://internships.jalanin.com/api/health
```

- `app` unhealthy + `/api/health` 503 → migrations incomplete or storage
  root unwritable; inspect the `migrate` logs first.
- `auth.session.lookup.failed` spikes → database unreachable from the app
  network (check `postgres` health, `DATABASE_URL` host `postgres`).
- `document.download.missing` → file missing from the `private_files`
  volume; restore from `jalanin-files-<stamp>.tar.gz` (see runbook).
- Outbox: query `notification_outbox WHERE status='failed'`; dispatcher logs
  `processed/sent/failed`. Structured server errors carry an `incidentId`.

## 5. Backups (summary)

Nightly `pg_dump` custom-format + file tarball; 30-day local retention;
off-host copy required (volume ≠ backup). Full procedure, restore test, and
retention expectations: `docs/runbook.md`.
