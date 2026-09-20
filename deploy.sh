#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$SCRIPT_DIR"
DEPLOY_STAGE="startup"
SKIP_PULL=0
DRY_RUN=0
LOCK_FILE="${FINIX_DEPLOY_LOCK:-/tmp/finix-deploy.lock}"
LOG_DIR="$SCRIPT_DIR/logs/deploy"
STAMP="$(date -u +%Y-%m-%d_%H%M%S)"
LOG_FILE="$LOG_DIR/deploy-$STAMP.log"
TMP_DIR=""
PREVIOUS_WEB=""
PREVIOUS_ADMIN=""
NGINX_BACKUP=""
API_DIST_BACKUP=""
PUBLISHED=0

for arg in "$@"; do
    case "$arg" in
        --skip-pull) SKIP_PULL=1 ;;
        --dry-run) DRY_RUN=1 ;;
        -h|--help) printf 'Uso: bash deploy.sh [--dry-run] [--skip-pull]\n'; exit 0 ;;
        *) printf 'ERROR: opción desconocida: %s\n' "$arg" >&2; exit 2 ;;
    esac
done

mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

log() { printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }
ok() { printf '  OK    %s\n' "$*"; }
warn() { printf '  WARN  %s\n' "$*" >&2; }
die() { printf '  ERROR %s\n' "$*" >&2; exit 1; }
stage() { DEPLOY_STAGE="$1"; printf '\n[%s] %s\n' "$2" "$1"; }

rollback() {
    [[ "$PUBLISHED" -eq 1 || -n "$API_DIST_BACKUP" ]] || return 0
    log 'Intentando rollback de frontend, API y Nginx...'
    if [[ "$PUBLISHED" -eq 1 && -n "$PREVIOUS_WEB" && -e "$PREVIOUS_WEB" ]]; then sudo ln -sfnT "$PREVIOUS_WEB" /var/www/finix-web/current || true; fi
    if [[ "$PUBLISHED" -eq 1 && -n "$PREVIOUS_ADMIN" && -e "$PREVIOUS_ADMIN" ]]; then sudo ln -sfnT "$PREVIOUS_ADMIN" /var/www/finix-admin/current || true; fi
    if [[ -n "$API_DIST_BACKUP" && -d "$API_DIST_BACKUP" ]]; then
        rm -rf -- "$SCRIPT_DIR/apps/api/dist"
        cp -a -- "$API_DIST_BACKUP" "$SCRIPT_DIR/apps/api/dist"
        pm2 reload finix-api --update-env >/dev/null 2>&1 || true
    fi
    if [[ -n "$NGINX_BACKUP" && -f "$NGINX_BACKUP" ]]; then
        sudo cp -- "$NGINX_BACKUP" /etc/nginx/sites-available/finixarg.com.conf
        sudo nginx -t >/dev/null 2>&1 && sudo systemctl reload nginx >/dev/null 2>&1 || true
    fi
    warn 'Rollback de archivos/proceso intentado. Las migraciones de base de datos no se revierten automáticamente.'
}

on_error() {
    local code=$? line=$1 command=$2
    trap - ERR
    printf '\nFINIX DEPLOY FAILED\nStage: %s\nLine: %s\nCommand: %s\nExit code: %s\nProduction version: %s\nLog: %s\n' \
        "$DEPLOY_STAGE" "$line" "$command" "$code" "$([[ "$PUBLISHED" -eq 1 ]] && echo 'rollback attempted' || echo 'unchanged')" "$LOG_FILE" >&2
    rollback || true
    exit "$code"
}
trap 'on_error "$LINENO" "$BASH_COMMAND"' ERR

cleanup() {
    local code=$?
    [[ -n "$TMP_DIR" && -d "$TMP_DIR" ]] && rm -rf -- "$TMP_DIR"
    exec 9>&- || true
    exit "$code"
}
trap cleanup EXIT

require_command() { command -v "$1" >/dev/null 2>&1 || die "Falta $1. Instalálo antes de desplegar."; }

validate_runtime() {
    local node_major required_major
    node_major="$(node -p 'process.versions.node.split(".")[0]')"
    required_major="$(node - <<'NODE'
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const value = p.engines?.node || '';
const match = value.match(/(?:^|[^0-9])(\d{2})(?:[^0-9]|$)/);
process.stdout.write(match ? match[1] : '');
NODE
)"
    log "Node detectado: $(node --version)${required_major:+ | requerido según package.json: Node $required_major+}"
    [[ -z "$required_major" || "$node_major" -ge "$required_major" ]] || die "Node incompatible: detectado $(node --version), requerido Node $required_major+."
}

validate_environment() {
    [[ -f apps/api/.env ]] || die 'No existe apps/api/.env en el VPS.'
    node - <<'NODE'
const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('apps/api/.env'));
const required = ['NODE_ENV', 'PORT', 'DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET', 'FRONTEND_URL', 'ADMIN_URL'];
const missing = required.filter((key) => !env[key] || env[key].startsWith('REPLACE_WITH_'));
if (missing.length) { console.error(`Faltan variables obligatorias: ${missing.join(', ')}`); process.exit(1); }
if (env.NODE_ENV !== 'production') { console.error(`NODE_ENV debe ser production, recibido: ${env.NODE_ENV}`); process.exit(1); }
if (env.JWT_SECRET.length < 32) { console.error('JWT_SECRET debe tener al menos 32 caracteres'); process.exit(1); }
for (const key of required) console.log(`${key}: OK`);
NODE
}

check_git() {
    local dirty
    git rev-parse --is-inside-work-tree >/dev/null
    [[ "$(git branch --show-current)" == main ]] || die "El checkout no está en main (actual: $(git branch --show-current))."
    git remote get-url origin >/dev/null || die 'No existe el remote origin.'
    # Este repositorio histórico contiene algunos artifacts generados tracked. Se ignoran
    # únicamente caches/dependencias/builds; cualquier fuente o configuración sí bloquea.
    dirty="$(git status --porcelain --untracked-files=no | awk '{ path=substr($0,4); if (path !~ /(^|\/)node_modules\// && path !~ /(^|\/)\.vite\// && path !~ /(^|\/)(dist|build)\//) print }')"
    if [[ -n "$dirty" ]]; then printf '%s\n' "$dirty"; die 'Hay cambios tracked de código/configuración; deploy cancelado.'; fi
    if [[ "$SKIP_PULL" -eq 0 ]]; then git fetch --prune origin main; git pull --ff-only origin main; fi
    dirty="$(git status --porcelain --untracked-files=no | awk '{ path=substr($0,4); if (path !~ /(^|\/)node_modules\// && path !~ /(^|\/)\.vite\// && path !~ /(^|\/)(dist|build)\//) print }')"
    [[ -z "$dirty" ]] || { printf '%s\n' "$dirty"; die 'El checkout quedó sucio después del pull.'; }
}

check_resources() {
    local free_kb mem_kb
    free_kb="$(df -Pk "$SCRIPT_DIR" | awk 'NR==2 {print $4}')"
    mem_kb="$(awk '/MemAvailable:/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)"
    log "Disco disponible: $((free_kb / 1024 / 1024)) GB"
    log "Memoria disponible: $((mem_kb / 1024)) MB"
    (( free_kb >= 2097152 )) || die 'Menos de 2 GB libres en disco; deploy cancelado.'
    (( mem_kb == 0 || mem_kb >= 524288 )) || warn 'Menos de 512 MB libres de RAM; el build puede fallar.'
}

check_sudo() { sudo -n true >/dev/null 2>&1 || die 'sudo no está disponible sin interacción; configurá sudoers para el usuario de deploy.'; }
install_dependencies() { npm ci --no-audit --no-fund; }

run_prisma() {
    (cd apps/api && npx prisma generate --schema prisma/schema.prisma)
    (cd apps/api && npx prisma migrate status --schema prisma/schema.prisma >/dev/null)
}

build_all() {
    mkdir -p "$TMP_DIR"
    [[ -d apps/api/dist ]] && { cp -a apps/api/dist "$TMP_DIR/api-dist-backup"; API_DIST_BACKUP="$TMP_DIR/api-dist-backup"; } || true
    npm run build -w @finix/shared
    [[ -s packages/shared/dist/index.js && -s packages/shared/dist/index.d.ts ]] || die 'No se pudo construir packages/shared/dist.'
    npm run build -w api
    npm run build -w web
    npm run build -w admin
    [[ -s apps/api/dist/main.js ]] || die 'No existe apps/api/dist/main.js después del build API.'
    [[ -d apps/web/dist && -n "$(find apps/web/dist -mindepth 1 -print -quit)" ]] || die 'apps/web/dist está vacío.'
    [[ -d apps/admin/dist && -n "$(find apps/admin/dist -mindepth 1 -print -quit)" ]] || die 'apps/admin/dist está vacío.'
}

publish_frontends() {
    local web_release="/var/www/finix-web/releases/$STAMP" admin_release="/var/www/finix-admin/releases/$STAMP"
    PREVIOUS_WEB="$(readlink -f /var/www/finix-web/current 2>/dev/null || true)"
    PREVIOUS_ADMIN="$(readlink -f /var/www/finix-admin/current 2>/dev/null || true)"
    sudo mkdir -p "$web_release" "$admin_release"
    sudo cp -a apps/web/dist/. "$web_release/"
    sudo cp -a apps/admin/dist/. "$admin_release/"
    sudo chown -R www-data:www-data "$web_release" "$admin_release"
    sudo find "$web_release" "$admin_release" -type d -exec chmod 755 {} +
    sudo find "$web_release" "$admin_release" -type f -exec chmod 644 {} +
    PUBLISHED=1
    sudo ln -sfnT "$web_release" /var/www/finix-web/current
    sudo ln -sfnT "$admin_release" /var/www/finix-admin/current
}

deploy_api() {
    mkdir -p logs
    export FINIX_ROOT="$SCRIPT_DIR"
    if pm2 describe finix-api >/dev/null 2>&1; then pm2 reload ops/ecosystem.config.cjs --only finix-api --env production --update-env; else pm2 start ops/ecosystem.config.cjs --only finix-api --env production; fi
}

configure_nginx() {
    NGINX_BACKUP="$TMP_DIR/finixarg.com.conf.previous"
    if sudo test -f /etc/nginx/sites-available/finixarg.com.conf; then sudo cp /etc/nginx/sites-available/finixarg.com.conf "$NGINX_BACKUP"; fi
    sudo install -m 0644 deploy/nginx/finixarg.com.conf /etc/nginx/sites-available/finixarg.com.conf
    sudo ln -sfn /etc/nginx/sites-available/finixarg.com.conf /etc/nginx/sites-enabled/finixarg.com.conf
    sudo nginx -t
    sudo systemctl is-active --quiet nginx || die 'Nginx no está activo.'
    sudo systemctl reload nginx
}

health_api() {
    local status attempt
    for attempt in {1..10}; do
        status="$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' 'http://127.0.0.1:3010/health' || true)"
        [[ "$status" == 200 ]] && { ok "API OK (HTTP 200, intento $attempt)"; return; }
        log "API intento $attempt/10: HTTP ${status:-error}"; sleep 2
    done
    pm2 logs finix-api --lines 40 --nostream || true
    die 'La API no respondió correctamente.'
}

health_external() {
    local url status
    for url in https://finixarg.com https://admin.finixarg.com; do
        status="$(curl -LfsS --max-time 15 -o /dev/null -w '%{http_code}' "$url" || true)"
        [[ "$status" =~ ^2[0-9][0-9]$|^3[0-9][0-9]$ ]] || die "Health check externo falló: $url (HTTP ${status:-error})"
        ok "$url (HTTP $status)"
    done
}

cleanup_releases() {
    local base file
    for base in /var/www/finix-web /var/www/finix-admin; do
        while IFS= read -r file; do sudo rm -rf -- "$file"; done < <(sudo find "$base/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' 2>/dev/null | sort -rn | awk 'NR > 5 {sub(/^[^ ]+ /, ""); print}')
    done
    while IFS= read -r file; do rm -f -- "$file"; done < <(find "$LOG_DIR" -type f -name 'deploy-*.log' -printf '%T@ %p\n' | sort -rn | awk 'NR > 10 {sub(/^[^ ]+ /, ""); print}')
}

main() {
    exec 9>"$LOCK_FILE"
    flock -n 9 || die "Ya hay otro deploy ejecutándose (lock: $LOCK_FILE)."
    TMP_DIR="$(mktemp -d /tmp/finix-deploy.XXXXXX)"
    printf '\nFINIX DEPLOY\nNode: %s\nnpm: %s\nGit: %s\nPM2: %s\nNginx: %s\nDirectorio: %s\nBranch: %s\nCommit: %s\nUsuario: %s\nFecha: %s\nLog: %s\n' \
        "$(node --version 2>/dev/null || echo missing)" "$(npm --version 2>/dev/null || echo missing)" "$(git --version 2>/dev/null || echo missing)" "$(pm2 --version 2>/dev/null || echo missing)" "$(nginx -v 2>&1 | head -n1 || echo missing)" "$SCRIPT_DIR" "$(git branch --show-current)" "$(git rev-parse --short HEAD)" "$(id -un)" "$(date -Is)" "$LOG_FILE"
    log "PM2 user: $(id -un); PM2 home: ${PM2_HOME:-$HOME/.pm2}"

    stage 'Preflight checks' '01/15'; for cmd in node npm git pm2 nginx curl flock sudo; do require_command "$cmd"; done; validate_runtime; check_resources; check_sudo
    if [[ "$DRY_RUN" -eq 1 ]]; then validate_environment; check_git; ok 'Dry run: no se modificó producción'; return; fi
    stage 'Git' '02/15'; check_git
    stage 'Dependencies' '03/15'; install_dependencies
    stage 'Environment' '04/15'; validate_environment
    stage 'Prisma and builds' '05/15'; run_prisma; build_all
    stage 'Database backup' '06/15'; bash backup.sh; ok 'Backup OK'
    stage 'Prisma migrations' '07/15'; (cd apps/api && npx prisma migrate deploy --schema prisma/schema.prisma)
    stage 'Publish frontend' '08/15'; publish_frontends
    stage 'PM2' '09/15'; deploy_api
    stage 'API health' '10/15'; health_api
    stage 'Nginx' '11/15'; configure_nginx
    stage 'External health' '12/15'; health_external
    stage 'PM2 save' '13/15'; pm2 save
    stage 'Cleanup' '14/15'; cleanup_releases
    stage 'Summary' '15/15'; printf '\nFINIX DEPLOY SUCCESSFUL\nCommit: %s\nAPI: http://127.0.0.1:3010\nWeb: https://finixarg.com\nAdmin: https://admin.finixarg.com\nLog: %s\n' "$(git rev-parse --short HEAD)" "$LOG_FILE"
}

main "$@"
