#!/usr/bin/env bash
# Isolated releases. Changes only Finix pointers and the finix-api PM2 process.
set -Eeuo pipefail
umask 077
FINIX_SOURCE_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
cd "$FINIX_SOURCE_ROOT"
if [[ -n ${FINIX_DEPLOY_CONFIG:-} ]]; then
  [[ -f $FINIX_DEPLOY_CONFIG ]] || { echo 'Falta FINIX_DEPLOY_CONFIG' >&2; exit 1; }
  set -a; source "$FINIX_DEPLOY_CONFIG"; set +a
fi
# Reviewed per-release .env is authoritative; do not inherit another DB target.
unset DATABASE_URL DIRECT_URL SOURCE_DATABASE_URL FINIX_BACKUP_SOURCE_URL REDIS_URL
FINIX_DRY_RUN=0
FINIX_SKIP_FETCH=0
for FINIX_ARG in "$@"; do
  case "$FINIX_ARG" in
    --dry-run) FINIX_DRY_RUN=1 ;;
    --skip-pull|--skip-fetch) FINIX_SKIP_FETCH=1 ;;
    --help|-h) echo 'Uso: FINIX_DEPLOY_CONFIG=/etc/finix/deploy.env bash deploy.sh [--dry-run] [--skip-fetch]'; exit 0 ;;
    *) echo "Opción desconocida: $FINIX_ARG" >&2; exit 2 ;;
  esac
done
FINIX_RELEASE_ROOT=${FINIX_RELEASE_ROOT:-/opt/finix/releases}
FINIX_SHARED_ROOT=${FINIX_SHARED_ROOT:-/opt/finix/shared}
FINIX_API_CURRENT=${FINIX_API_CURRENT:-/opt/finix/current}
FINIX_WEB_CURRENT=${FINIX_WEB_CURRENT:-/var/www/finix-web/current}
FINIX_ADMIN_CURRENT=${FINIX_ADMIN_CURRENT:-/var/www/finix-admin/current}
FINIX_BACKUP_ROOT=${FINIX_BACKUP_ROOT:-/var/backups/finix}
FINIX_DEPLOY_BRANCH=${FINIX_DEPLOY_BRANCH:-main}
export FINIX_API_ENV FINIX_WEB_ENV FINIX_ADMIN_ENV FINIX_BACKUP_ROOT FINIX_DB_CONTAINER FINIX_SECRETS_DIR FINIX_ALLOW_GOOGLE_DISABLED
fail() { echo "ERROR: $*" >&2; exit 1; }
for FINIX_CMD in node npm git tar curl docker pm2 flock; do command -v "$FINIX_CMD" >/dev/null || fail "Falta $FINIX_CMD"; done
node -e 'if(Number(process.versions.node.split(".")[0])<22)throw new Error("Usar Node 22+ compatible con las dependencias")'
git rev-parse --is-inside-work-tree >/dev/null
node scripts/deploy-preflight.cjs environment
# Dry run: no fetch, no mkdir, no lock/log file, no backup or process changes.
if [[ $FINIX_DRY_RUN == 1 ]]; then
  node scripts/deploy-preflight.cjs database
  printf 'DRY RUN: fetch %s; git archive; npm ci; generate; build; backup verificado; migrate deploy revisado; publicar symlinks; reiniciar sólo finix-api; health; rollback del código si falla.\n' "$FINIX_DEPLOY_BRANCH"
  printf 'Nginx, SSL, DNS, SSH, firewall, otros procesos y base existente: sin modificaciones de configuración.\n'
  exit 0
fi
[[ -z $(git status --porcelain --untracked-files=normal) ]] || fail 'Hay cambios de código sin publicar; revisar y crear el commit antes de deploy.'
if ! pm2 jlist | node scripts/pm2-path-check.cjs "$FINIX_API_CURRENT/apps/api"; then
  [[ ${FINIX_RECREATE_PM2_ONCE:-false} == true ]] || fail 'PM2 conserva un cwd anterior. En el primer corte controlado, configurar FINIX_RECREATE_PM2_ONCE=true para recrear sólo finix-api.'
fi
[[ $FINIX_DEPLOY_BRANCH =~ ^[a-zA-Z0-9._/-]+$ && $FINIX_DEPLOY_BRANCH != -* ]] || fail 'Rama inválida'
[[ -d $FINIX_RELEASE_ROOT && -w $FINIX_RELEASE_ROOT && -d $FINIX_SHARED_ROOT && -w $FINIX_SHARED_ROOT ]] || fail 'Preparar directorios de releases/shared con el usuario de Finix'
for FINIX_POINTER in "$FINIX_API_CURRENT" "$FINIX_WEB_CURRENT" "$FINIX_ADMIN_CURRENT"; do
  [[ -d $(dirname -- "$FINIX_POINTER") && -w $(dirname -- "$FINIX_POINTER") ]] || fail "Sin permisos para $FINIX_POINTER"
  [[ ! -e $FINIX_POINTER || -L $FINIX_POINTER ]] || fail "El destino debe ser un symlink: $FINIX_POINTER"
done
exec 9>"$FINIX_SHARED_ROOT/deploy.lock"
flock -n 9 || fail 'Ya hay un deploy de Finix en curso'
mkdir -p "$FINIX_SHARED_ROOT/logs/deploy"
FINIX_STAMP=$(date -u +%Y%m%dT%H%M%SZ)
exec > >(tee -a "$FINIX_SHARED_ROOT/logs/deploy/$FINIX_STAMP.log") 2>&1
FINIX_STAGE=fetch
FINIX_PUBLISHED=0
FINIX_SUCCESS=0
FINIX_PREVIOUS_API=$(readlink -f -- "$FINIX_API_CURRENT" || true)
FINIX_PREVIOUS_WEB=$(readlink -f -- "$FINIX_WEB_CURRENT" || true)
FINIX_PREVIOUS_ADMIN=$(readlink -f -- "$FINIX_ADMIN_CURRENT" || true)
FINIX_PREVIOUS_COMMIT=unknown
if [[ -f $FINIX_PREVIOUS_API/release.json ]]; then FINIX_PREVIOUS_COMMIT=$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1])).commit)' "$FINIX_PREVIOUS_API/release.json"); fi
pointer() {
  local FINIX_TARGET=$1 FINIX_LINK=$2 FINIX_TEMP
  FINIX_TEMP="$FINIX_LINK.next.$$"
  ln -s -- "$FINIX_TARGET" "$FINIX_TEMP"
  mv -Tf -- "$FINIX_TEMP" "$FINIX_LINK"
}
restart_finix() {
  if ! pm2 jlist | node "$FINIX_SOURCE_ROOT/scripts/pm2-path-check.cjs" "$FINIX_API_CURRENT/apps/api"; then
    [[ ${FINIX_RECREATE_PM2_ONCE:-false} == true ]] || return 1
    pm2 delete finix-api
  fi
  # PM2 retains cwd on reload. Keep its path stable; replace the symlink atomically.
  FINIX_ROOT="$FINIX_API_CURRENT" FINIX_COMMIT=$2 FINIX_LOG_DIR="$FINIX_SHARED_ROOT/logs" pm2 startOrReload "$1/ops/ecosystem.config.cjs" --only finix-api --env production --update-env
}
finish() {
  local FINIX_EXIT=$?
  trap - EXIT
  if [[ $FINIX_SUCCESS != 1 ]]; then
    echo "Deploy falló en $FINIX_STAGE (código $FINIX_EXIT)."
    if [[ $FINIX_PUBLISHED == 1 ]]; then
      if [[ -d $FINIX_PREVIOUS_API ]]; then
        pointer "$FINIX_PREVIOUS_API" "$FINIX_API_CURRENT" || true
        [[ -d $FINIX_PREVIOUS_WEB ]] && pointer "$FINIX_PREVIOUS_WEB" "$FINIX_WEB_CURRENT" || true
        [[ -d $FINIX_PREVIOUS_ADMIN ]] && pointer "$FINIX_PREVIOUS_ADMIN" "$FINIX_ADMIN_CURRENT" || true
        restart_finix "$FINIX_PREVIOUS_API" "$FINIX_PREVIOUS_COMMIT" || true
        if curl --silent --fail --max-time 5 http://127.0.0.1:3010/ready >/dev/null; then
          echo 'Rollback de código: /ready respondió. Las migraciones no se revierten automáticamente.'
        else
          echo 'Rollback solicitado, pero /ready no respondió: requiere comprobación del operador.'
        fi
      else
        pm2 stop finix-api || true
        echo 'Primer deploy sin release anterior: API detenida; requiere intervención. No se restaura la DB sobre datos nuevos.'
      fi
    fi
  fi
  exit "$FINIX_EXIT"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
if [[ $FINIX_SKIP_FETCH == 0 ]]; then git fetch origin "$FINIX_DEPLOY_BRANCH"; FINIX_REF=FETCH_HEAD; else FINIX_REF=HEAD; fi
FINIX_COMMIT=$(git rev-parse "$FINIX_REF^{commit}")
FINIX_RELEASE="$FINIX_RELEASE_ROOT/$FINIX_STAMP-${FINIX_COMMIT:0:12}"
mkdir -- "$FINIX_RELEASE"
chmod 711 "$FINIX_RELEASE"
git archive "$FINIX_COMMIT" | tar -x -C "$FINIX_RELEASE"
FINIX_STAGE=build
for FINIX_APP in api web admin; do
  case "$FINIX_APP" in api) FINIX_ENV=$FINIX_API_ENV;; web) FINIX_ENV=$FINIX_WEB_ENV;; admin) FINIX_ENV=$FINIX_ADMIN_ENV;; esac
  # Keep an immutable private config per release so code rollback restores config.
  install -m 600 "$FINIX_ENV" "$FINIX_RELEASE/apps/$FINIX_APP/.env"
done
node - "$FINIX_RELEASE" "$FINIX_API_ENV" <<'NODE'
const fs = require('fs'), path = require('path'), root = process.argv[2];
const config = require('dotenv').parse(fs.readFileSync(process.argv[3]));
const link = path.join(root, 'apps/api/uploads');
if (fs.existsSync(link)) {
  if (fs.readdirSync(link).length) throw new Error('Tracked uploads in release; review before deployment');
  fs.rmdirSync(link);
}
fs.symlinkSync(config.UPLOADS_DIR, link, 'dir');
NODE
(
 cd "$FINIX_RELEASE"
 npm ci --no-audit --no-fund
 npx --no-install prisma generate --schema apps/api/prisma/schema.prisma
 npm run build -w @finix/shared
 npm run build -w api
 npm run build -w web
 npm run build -w admin
 FINIX_API_ENV="$FINIX_RELEASE/apps/api/.env" node scripts/deploy-preflight.cjs database apps/api/prisma/migrations
 node -e 'const fs=require("fs"), data=JSON.stringify({commit:process.argv[1],builtAt:new Date().toISOString()}); for(const f of ["release.json","apps/web/dist/release.json","apps/admin/dist/release.json"])fs.writeFileSync(f,data)' "$FINIX_COMMIT"
 node - <<'NODE'
const fs = require('fs');
// Nginx must traverse releases and read public files. Private .env stays 600.
for (const directory of ['apps', 'apps/web', 'apps/admin']) fs.chmodSync(directory, 0o755);
function publishPermissions(directory) {
  fs.chmodSync(directory, 0o755);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = directory + '/' + entry.name;
    if (entry.isDirectory()) publishPermissions(file);
    else if (entry.isFile()) fs.chmodSync(file, 0o644);
    else throw new Error('Unexpected symlink in public build');
  }
}
publishPermissions('apps/web/dist'); publishPermissions('apps/admin/dist');
NODE
)
FINIX_STAGE=backup
bash "$FINIX_RELEASE/backup.sh" "$FINIX_BACKUP_ROOT/pre-deploy-$FINIX_STAMP"
FINIX_STAGE=migration
(cd "$FINIX_RELEASE/apps/api"; npx --no-install prisma migrate deploy --schema prisma/schema.prisma)
FINIX_STAGE=publish
FINIX_PUBLISHED=1
pointer "$FINIX_RELEASE" "$FINIX_API_CURRENT"
pointer "$FINIX_RELEASE/apps/web/dist" "$FINIX_WEB_CURRENT"
pointer "$FINIX_RELEASE/apps/admin/dist" "$FINIX_ADMIN_CURRENT"
restart_finix "$FINIX_RELEASE" "$FINIX_COMMIT"
FINIX_STAGE=health
FINIX_READY=0
for FINIX_ATTEMPT in $(seq 1 30); do
 if curl --silent --fail --max-time 3 http://127.0.0.1:3010/ready >/dev/null && curl --silent --fail --max-time 3 http://127.0.0.1:3010/health | node -e 'let s="";process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>{try{if(JSON.parse(s).commit!==process.argv[1])process.exit(1)}catch{process.exit(1)}})' "$FINIX_COMMIT"; then FINIX_READY=1; break; fi
 sleep 2
done
[[ $FINIX_READY == 1 ]] || fail 'API/DB/Redis no quedaron listos con el commit esperado'
for FINIX_URL in "${FINIX_WEB_HEALTH_URL:-}" "${FINIX_ADMIN_HEALTH_URL:-}"; do
 [[ -n $FINIX_URL ]] || fail 'Configurar URLs HTTPS públicas de release.json'
 [[ $FINIX_URL == https://* ]] || fail 'Health público requiere HTTPS'
 curl --silent --fail --max-time 15 --header 'Cache-Control: no-cache' "$FINIX_URL?deploy=$FINIX_COMMIT" | node -e 'let s="";process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>{try{if(JSON.parse(s).commit!==process.argv[1])process.exit(1)}catch{process.exit(1)}})' "$FINIX_COMMIT"
done
FINIX_SUCCESS=1
echo "Deploy completo: $FINIX_COMMIT; respaldo: $FINIX_BACKUP_ROOT/pre-deploy-$FINIX_STAMP"
echo 'Un único proceso puede tener una interrupción breve. Se conservan releases anteriores; no se modifica Nginx ni otros servicios.'
