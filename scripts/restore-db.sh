#!/usr/bin/env bash
# Restore a database dump into the target DATABASE_URL.
# DANGER: overwrites the target. Refuses production-looking targets unless
# RESTORE_ALLOW_REMOTE=1 is set explicitly.
#   DATABASE_URL=postgresql://... ./scripts/restore-db.sh ./backups/jalanin-<stamp>.dump
set -euo pipefail
FILE="${1:?usage: restore-db.sh <dump-file>}"
HOST="$(python3 -c "import urllib.parse as u; print(u.urlparse('$DATABASE_URL').hostname or '')" 2>/dev/null || echo remote)"
if [[ "$HOST" != "localhost" && "$HOST" != "127.0.0.1" && "$HOST" != "::1" && "${RESTORE_ALLOW_REMOTE:-}" != "1" ]]; then
  echo "Refusing restore to remote host '$HOST' without RESTORE_ALLOW_REMOTE=1." >&2
  exit 1
fi
echo "restoring $FILE (target WILL be overwritten)"
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$DATABASE_URL" "$FILE"
echo "restore complete. Verify with: pnpm db:migrate && node scripts/verify-restore.mjs"
