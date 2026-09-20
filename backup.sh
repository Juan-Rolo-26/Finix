#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/finix}"
RETENTION_DAYS="${RETENTION_DAYS:-28}"
mkdir -p "$BACKUP_DIR"
ENV_FILE="$ROOT_DIR/apps/api/.env"
[[ -f "$ENV_FILE" ]] || { echo 'Falta apps/api/.env' >&2; exit 1; }
read_env_value() {
    local key="$1"
    node - "$ENV_FILE" "$key" <<'NODE' | base64 -d
const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(process.argv[2]));
const value = env[process.argv[3]] || '';
process.stdout.write(Buffer.from(value, 'utf8').toString('base64'));
NODE
}
DATABASE_URL="${DATABASE_URL:-$(read_env_value DATABASE_URL)}"
DIRECT_URL="${DIRECT_URL:-$(read_env_value DIRECT_URL)}"
[[ -n "$DATABASE_URL" ]] || { echo 'DATABASE_URL es obligatorio' >&2; exit 1; }
BACKUP_DATABASE_URL="${DIRECT_URL:-$DATABASE_URL}"
PG_DUMP="$(find /usr/lib/postgresql -type f -path '*/bin/pg_dump' -perm -111 2>/dev/null | sort -V | tail -n 1)"
PG_DUMP="${PG_DUMP:-$(command -v pg_dump || true)}"
[[ -n "$PG_DUMP" ]] || { echo 'Falta pg_dump' >&2; exit 1; }
STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
OUT="$BACKUP_DIR/backup-$STAMP.sql.gz"
echo "[$(date -Is)] Creando backup PostgreSQL: $OUT"
"$PG_DUMP" --dbname="$BACKUP_DATABASE_URL" --no-owner --no-privileges --format=plain | gzip -9 > "$OUT"
test -s "$OUT"
find "$BACKUP_DIR" -type f -name 'backup-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
echo "Backup OK: $OUT"
