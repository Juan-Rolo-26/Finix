#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Finix — Production Deploy Script
# Runs on the VPS after code is pulled by CI/CD.
# Usage: /srv/finix/scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_DIR="/srv/finix"
RELEASES_DIR="$DEPLOY_DIR/releases"
CURRENT_LINK="$DEPLOY_DIR/current"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$RELEASES_DIR/$TIMESTAMP"
KEEP_RELEASES=5

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "🚀 Starting deploy: $TIMESTAMP"

# ── 1. Create release directory ───────────────────────────────────────────────
mkdir -p "$RELEASE_DIR"

# ── 2. Copy source ────────────────────────────────────────────────────────────
cd "$DEPLOY_DIR/repo"
git pull origin main
rsync -a --exclude='.git' --exclude='node_modules' . "$RELEASE_DIR/"

# ── 3. Install production deps ────────────────────────────────────────────────
log "📦 Installing dependencies..."
cd "$RELEASE_DIR"
npm ci --production --workspace=apps/api --if-present

# ── 4. Generate Prisma client ─────────────────────────────────────────────────
log "🗄️  Generating Prisma client..."
cd "$RELEASE_DIR/apps/api"
npx prisma generate

# ── 5. Run database migrations ────────────────────────────────────────────────
log "🗄️  Running database migrations..."
npx prisma migrate deploy

# ── 6. Symlink shared uploads dir ─────────────────────────────────────────────
ln -sfn "$DEPLOY_DIR/shared/uploads" "$RELEASE_DIR/apps/api/uploads"
ln -sfn "$DEPLOY_DIR/shared/apps/api/.env" "$RELEASE_DIR/apps/api/.env"

# ── 7. Build web ──────────────────────────────────────────────────────────────
log "🏗️  Building web..."
cd "$DEPLOY_DIR/repo"
npm ci
npm run build -w web

# Copy web build to shared www dir
log "📁 Copying web build..."
rsync -a --delete "$DEPLOY_DIR/repo/apps/web/dist/" /var/www/finix/dist/

# ── 8. Build API ──────────────────────────────────────────────────────────────
log "🏗️  Building API..."
cd "$RELEASE_DIR/apps/api"
npm run build

# ── 9. Atomic switch current → new release ────────────────────────────────────
log "🔗 Switching to new release..."
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

log "✅ Release $TIMESTAMP is now current"

# ── 10. Reload PM2 (zero-downtime) ───────────────────────────────────────────
log "♻️  Reloading PM2..."
cd "$CURRENT_LINK/apps/api"
pm2 reload finix-api --update-env || pm2 start dist/main.js --name finix-api

# ── 11. Health check ──────────────────────────────────────────────────────────
log "🏥 Waiting for API health check..."
for i in {1..12}; do
    if curl -fsS http://127.0.0.1:3010/health > /dev/null 2>&1; then
        log "✅ API healthy!"
        break
    fi
    if [ "$i" -eq 12 ]; then
        log "❌ Health check failed after 60s — executing rollback"
        "$DEPLOY_DIR/scripts/rollback.sh"
        exit 1
    fi
    log "   Attempt $i/12 — waiting 5s..."
    sleep 5
done

# ── 12. Cleanup old releases ──────────────────────────────────────────────────
log "🧹 Cleaning up old releases (keeping last $KEEP_RELEASES)..."
ls -dt "$RELEASES_DIR"/*/ 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | xargs rm -rf --

log "🎉 Deploy $TIMESTAMP completed successfully!"
