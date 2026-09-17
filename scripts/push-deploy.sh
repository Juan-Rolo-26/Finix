#!/bin/bash
# ==============================================================================
# Script de Commit & Despliegue Automático para Finix
# Uso:
#   ./scripts/push-deploy.sh "Tu mensaje de commit"
#   o mediante: npm run deploy "Tu mensaje de commit"
# ==============================================================================

set -e

MSG="$1"
if [ -z "$MSG" ]; then
    MSG="deploy: actualización automática $(date '+%Y-%m-%d %H:%M')"
fi

echo "================================================="
echo "   🚀 Enviando cambios a GitHub y VPS           "
echo "   Mensaje: $MSG                                 "
echo "================================================="

# 1. Agregar cambios al stage
git add -A

# 2. Verificar si hay cambios para commitear
if git diff-index --quiet HEAD --; then
    echo "ℹ️ No hay cambios nuevos en el código para commitear."
else
    git commit -m "$MSG"
fi

# 3. Empujar a la rama main de GitHub
echo "Pushing a origin/main..."
git push origin main

echo "================================================="
echo "   ✅ ¡Cambios subidos a GitHub con éxito!       "
echo "   El workflow de GitHub Actions o tu Webhook    "
echo "   iniciará automáticamente el deploy en el VPS. "
echo "   Web: https://finixarg.com                     "
echo "   Admin: https://admin.finixarg.com             "
echo "================================================="
