#!/usr/bin/env bash
# Run from the VPS source checkout as the Finix deployment user.
set -Eeuo pipefail
umask 077
FINIX_SETUP_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
cd "$FINIX_SETUP_ROOT"
FINIX_SETUP_MODE=${1:---check}
[[ $FINIX_SETUP_MODE == --check || $FINIX_SETUP_MODE == --prepare ]] || { echo 'Uso: bash ops/prepare-vps.sh [--check|--prepare]' >&2; exit 2; }
for FINIX_TOOL in node npm docker git tar curl flock; do command -v "$FINIX_TOOL" >/dev/null || { echo "Falta $FINIX_TOOL" >&2; exit 1; }; done
docker compose version
node --version
node -e 'if(Number(process.versions.node.split(".")[0])<22)throw new Error("Usar Node 22+ LTS compatible con las dependencias instaladas")'
free -h
df -h .
docker ps --format '{{.Names}} {{.Ports}}'
if command -v pm2 >/dev/null; then echo 'PM2 disponible en PATH'; else echo 'Falta PM2 para deploy (npm install -g pm2 con la versión de Node seleccionada)'; fi
[[ $FINIX_SETUP_MODE == --prepare ]] || exit 0
[[ $(awk '/MemTotal:/ {print $2}' /proc/meminfo) -ge 2000000 ]] || { echo 'RAM insuficiente para el perfil conservador de DB+Redis+API; medir y ajustar antes de continuar' >&2; exit 1; }
mkdir -p ops/database/.secrets
node - <<'NODE'
const fs=require('fs'),crypto=require('crypto');
for(const role of ['bootstrap','owner','app','redis']) {const f=`ops/database/.secrets/${role}.password`;if(!fs.existsSync(f))fs.writeFileSync(f,crypto.randomBytes(32).toString('hex'),{mode:0o600});}
NODE
# Deliberately no apt upgrade, firewall, SSH, Nginx, Certbot or volume deletion.
docker compose -p finix-production -f ops/database/compose.yml up -d --wait
docker compose -p finix-production -f ops/database/compose.yml exec -T db sh /opt/finix/roles.sh
mkdir -p /opt/finix/releases /opt/finix/shared/logs /opt/finix/shared/uploads /opt/finix/shared/private/storage
chmod 755 /opt/finix /opt/finix/releases
echo 'Contenedores listos. Restaurar en vacío y preparar /etc/finix/api.env antes de deploy. No se cambió la API activa.'
