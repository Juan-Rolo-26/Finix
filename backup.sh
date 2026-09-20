#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/finix}"
RETENTION_DAYS="${RETENTION_DAYS:-28}"
mkdir -p "$BACKUP_DIR"
if [[ -z "${DATABASE_URL:-}" && -f "$ROOT_DIR/apps/api/.env" ]]; then set -a; source "$ROOT_DIR/apps/api/.env"; set +a; fi
: "${DATABASE_URL:?DATABASE_URL es obligatorio}"
BACKUP_DATABASE_URL="${DIRECT_URL:-$DATABASE_URL}"
command -v pg_dump >/dev/null || { echo 'Falta pg_dump' >&2; exit 1; }
STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
OUT="$BACKUP_DIR/backup-$STAMP.sql.gz"
echo "[$(date -Is)] Creando backup PostgreSQL: $OUT"
pg_dump --dbname="$BACKUP_DATABASE_URL" --no-owner --no-privileges --format=plain | gzip -9 > "$OUT"
test -s "$OUT"
find "$BACKUP_DIR" -type f -name 'backup-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
echo "Backup OK: $OUT"
