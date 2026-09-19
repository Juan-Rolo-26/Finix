#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
BACKUP="${1:-}"
[[ -n "$BACKUP" && -f "$BACKUP" ]] || { echo "Uso: $0 /var/backups/finix/backup-*.sql.gz" >&2; exit 2; }
if [[ -z "${DATABASE_URL:-}" && -f "apps/api/.env" ]]; then set -a; source apps/api/.env; set +a; fi
: "${DATABASE_URL:?DATABASE_URL es obligatorio}"
read -r -p "ATENCIÓN: esto sobrescribirá datos. Escribí RESTAURAR para continuar: " CONFIRM
[[ "$CONFIRM" == RESTAURAR ]] || { echo 'Cancelado.'; exit 1; }
gzip -dc "$BACKUP" | psql --dbname="$DATABASE_URL" --set ON_ERROR_STOP=1
echo 'Restore completado.'
