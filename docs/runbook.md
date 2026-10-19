# Runbook — backups, restore, volumes, cutover (standalone stack)

## 1. What gets backed up

| Data | Tool | Artifact | Schedule |
|---|---|---|---|
| PostgreSQL (all tables) | `pnpm backup:db` (`pg_dump` custom format) | `backups/jalanin-<UTC stamp>.dump` | nightly (cron on the backup host) |
| Private + public files | `pnpm backup:files` (tar of both roots) | `backups/jalanin-files-<stamp>.tar.gz` | nightly, same stamp as the DB dump |

Retention: 30 daily copies pruned locally; **copy every artifact off-host**
(object storage or a second machine) after each run. A Docker volume alone
is not a backup. Expected RPO ≤ 24 h / RTO ≤ 24 h once nightly backups +
off-host copies are in place; verify against the restoration test below.

## 2. Backup procedure

```bash
# On any host with DATABASE_URL access to production (read-only user preferred):
DATABASE_URL="postgresql://...:5432/jalanin" pnpm backup:db ./backups
PRIVATE_UPLOAD_DIR=/var/lib/jalanin/private PUBLIC_UPLOAD_DIR=/var/lib/jalanin/public \
  ./scripts/backup-files.sh ./backups <same-stamp>
# Then copy ./backups/jalanin-<stamp>.dump + ./backups/jalanin-files-<stamp>.tar.gz off-host.
```

In Docker production the database is reachable only inside the `internal`
network; run `pg_dump` from a sibling container or exec into `postgres`
(`pg_dump -U $POSTGRES_USER -d $POSTGRES_DB`). The `pgdata`,
`private_files`, and `public_uploads` volumes persist across `restart`,
`up --build`, and container recreation — verify with
`docker volume inspect`.

## 3. Restore procedure (tested 2026-10-19)

```bash
# 1. Database (DESTRUCTIVE to the target — refuses remote hosts unless
#    RESTORE_ALLOW_REMOTE=1 is set explicitly):
DATABASE_URL="postgresql://.../jalanin_restore_test" ./scripts/restore-db.sh ./backups/jalanin-<stamp>.dump
# 2. Files: extract the tarball over the file roots, then fix ownership
#    (non-root app uid 1001):
tar -xzf ./backups/jalanin-files-<stamp>.tar.gz -C /
chown -R 1001:1001 "$PRIVATE_UPLOAD_DIR" "$PUBLIC_UPLOAD_DIR"
# 3. Validate: pnpm db:migrate (idempotent), then:
SELECT count(*) FROM applications; SELECT count(*) FROM users;
SELECT storage_path FROM application_documents WHERE storage_path NOT LIKE 'file:%';
# Every row must resolve to a file under PRIVATE_UPLOAD_DIR of matching
# byte_size; /api/health must return {"ok":true}.
```

Verification status: backup (`pg_dump` custom format, 125 TOC entries) and
restore into a scratch database (7 internships / 1 user / 6 migrations)
exercised against the local stack on 2026-10-19. Repeat against production
artifacts before relying on RPO/RTO claims.

## 4. Credential rotation

- `POSTGRES_PASSWORD`: change in `.env.prod` + the database
  (`ALTER USER ... PASSWORD`), then recreate `postgres` + `app`.
- `CRON_SECRET` / `RATE_LIMIT_PEPPER`: change in `.env.prod`, recreate `app`.
  Rotating the pepper invalidates in-flight rate-limit buckets only.
- SMTP credentials: change in `.env.prod`, recreate `app`, send a test mail
  via the outbox dispatcher.

## 5. Rollback during cutover

The Supabase source is never written to by the migration scripts. Until DNS
cutover, rollback = keep serving from Supabase. After cutover, rollback =
restore the pre-cutover destination backup (step 3) and point traffic back.
`users.legacy_auth_id` preserves the Supabase→native id mapping for audit.

## 6. Disaster recovery limitations

- Point-in-time recovery is NOT configured (nightly dumps only; up to 24 h
  of data loss on a total failure).
- No standby replica; recovery = restore on fresh volumes + redeploy.
- Email outbox rows restore with the database; in-flight `queued` rows
  redeliver on the next dispatch run (idempotent by `event_key`).
