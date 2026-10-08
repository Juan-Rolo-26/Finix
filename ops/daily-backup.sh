#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
[[ -f ${FINIX_DEPLOY_CONFIG:-/etc/finix/deploy.env} ]] || { echo 'Falta la configuración de backup' >&2; exit 1; }
set -a; source "${FINIX_DEPLOY_CONFIG:-/etc/finix/deploy.env}"; set +a
export FINIX_BACKUP_RETENTION=true
# Pin the backup implementation to the current deployed, reviewed release.
exec bash "${FINIX_API_CURRENT:-/opt/finix/current}/backup.sh"
