#!/usr/bin/env bash
# Upload backup: tarballs of the private + public file roots alongside the
# database dump taken at the same time. Restore database FIRST, then files,
# then run the storage verification query (see docs/runbook.md).
#   ./scripts/backup-files.sh [/backups] [stamp]
set -euo pipefail
OUT_DIR="${1:-./backups}"
STAMP="${2:-$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$OUT_DIR"
PRIV="${PRIVATE_UPLOAD_DIR:-storage/private}"
PUB="${PUBLIC_UPLOAD_DIR:-storage/public}"
tar -czf "$OUT_DIR/jalanin-files-$STAMP.tar.gz" \
  --exclude='.gitkeep' "$PRIV" "$PUB" 2>/dev/null || \
tar -czf "$OUT_DIR/jalanin-files-$STAMP.tar.gz" "$PRIV" "$PUB"
echo "files backup complete: $OUT_DIR/jalanin-files-$STAMP.tar.gz"
find "$OUT_DIR" -maxdepth 1 -name 'jalanin-files-*.tar.gz' -mtime +30 -delete || true
