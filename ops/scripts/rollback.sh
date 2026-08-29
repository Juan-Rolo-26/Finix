#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Finix — Rollback Script
# Switches to the previous release atomically.
# Usage: /srv/finix/scripts/rollback.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_DIR="/srv/finix"
RELEASES_DIR="$DEPLOY_DIR/releases"
CURRENT_LINK="$DEPLOY_DIR/current"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "⏮️  Starting rollback..."

# Find the previous release (second-to-last)
PREVIOUS=$(ls -dt "$RELEASES_DIR"/*/ 2>/dev/null | sed -n '2p')

if [ -z "$PREVIOUS" ]; then
    log "❌ No previous release found — cannot rollback"
    exit 1
fi

log "🔗 Rolling back to: $PREVIOUS"
ln -sfn "$PREVIOUS" "$CURRENT_LINK"

# Reload PM2 from previous release
cd "$PREVIOUS/apps/api"
pm2 reload finix-api --update-env

# Verify health
sleep 5
if curl -fsS http://127.0.0.1:3010/health > /dev/null 2>&1; then
    log "✅ Rollback successful — API healthy"
else
    log "❌ Rollback health check failed — manual intervention required"
    exit 1
fi
