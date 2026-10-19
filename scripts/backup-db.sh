#!/usr/bin/env bash
# PostgreSQL backup (pg_dump custom format). Run on the database host or any
# machine with DATABASE_URL access.
#   DATABASE_URL=postgresql://... ./scripts/backup-db.sh [/backups]
# Retention: keep 30 daily dumps (oldest pruned); copy off-host per runbook.
set -euo pipefail
OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$OUT_DIR/jalanin-$STAMP.dump"
echo "dumping to $FILE"
pg_dump --format=custom --compress=9 --file="$FILE" "$DATABASE_URL"
echo "backup complete: $FILE ($(du -h "$FILE" | cut -f1))"
# Prune dumps older than 30 days.
find "$OUT_DIR" -maxdepth 1 -name 'jalanin-*.dump' -mtime +30 -delete || true
echo "retention: 30 days (see docs/runbook.md for off-host copies)"
