#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
FINIX_SCRIPT_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$FINIX_SCRIPT_ROOT"
FINIX_BACKUP_ROOT=${FINIX_BACKUP_ROOT:-$FINIX_SCRIPT_ROOT/.local/finix/backups}
mkdir -p -- "$FINIX_BACKUP_ROOT"
exec 9>"$FINIX_BACKUP_ROOT/.backup.lock"
flock -n 9 || { echo "Ya hay un respaldo en curso" >&2; exit 1; }
FINIX_BACKUP_OUTPUT=${1:-$FINIX_BACKUP_ROOT/$(date -u +%Y%m%dT%H%M%SZ)}
node scripts/database/native-backup.cjs "$FINIX_BACKUP_OUTPUT"
node scripts/database/verify-native-backup.cjs "$FINIX_BACKUP_OUTPUT"
if [[ -n ${FINIX_BACKUP_REMOTE:-} ]]; then
  command -v rsync >/dev/null
  rsync -a --protect-args -e 'ssh -o BatchMode=yes -o StrictHostKeyChecking=yes' -- "$FINIX_BACKUP_OUTPUT" "$FINIX_BACKUP_REMOTE"
fi
if [[ ${FINIX_BACKUP_RETENTION:-false} == true ]]; then
  node scripts/database/retention.cjs "$FINIX_BACKUP_ROOT" --apply
fi
