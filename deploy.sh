#!/bin/bash
# ==============================================================================
# Script de Despliegue Automático para Finix (VPS)
# Actualiza código, migraciones de base de datos, compila Web, Admin y API,
# y reinicia el servicio backend de manera segura.
# ==============================================================================

set -e # Detener ante cualquier error crítico

echo "============================================="
echo "   🚀 Iniciando Despliegue Automático FINIX  "
echo "============================================="

# 1. Detectar automáticamente la carpeta del repositorio
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || { echo "❌ Error al entrar en la carpeta $SCRIPT_DIR"; exit 1; }
echo "📁 Directorio de Finix: $SCRIPT_DIR"

# 2. Descargar los últimos cambios de GitHub
echo "[1/7] Descargando últimos cambios desde GitHub (main)..."
git fetch --all
git reset --hard origin/main

# 3. Instalar dependencias del monorepo
echo "[2/7] Instalando dependencias de NPM..."
npm install

# 4. Generar Prisma Client y aplicar migraciones
echo "[3/7] Sincronizando base de datos con Prisma..."
npx prisma generate --schema=apps/api/prisma/schema.prisma
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma || {
    echo "⚠️ Advertencia: Error en prisma migrate deploy. Continuando con el build..."
}

# 5. Compilar Backend, Web y Admin
echo "[4/7] Compilando Backend (NestJS)..."
npm run build -w api

echo "[5/7] Compilando Frontend Web (finixarg.com)..."
npm run build -w web

echo "[6/7] Compilando Panel Admin (admin.finixarg.com)..."
npm run build -w admin

# 6. Gestionar proceso PM2
echo "[7/7] Gestionando proceso en PM2..."
if pm2 describe finix-api > /dev/null 2>&1; then
    echo "🔄 Reiniciando finix-api con nuevas variables y código..."
    pm2 restart finix-api --update-env
else
    echo "⚡ Iniciando finix-api por primera vez en PM2..."
    cd "$SCRIPT_DIR/apps/api"
    pm2 start dist/main.js --name "finix-api"
    cd "$SCRIPT_DIR"
    pm2 save
fi

# 7. Permisos y carpetas necesarias
echo "🔒 Ajustando permisos del servidor web..."
mkdir -p apps/api/uploads
chmod -R 755 "$SCRIPT_DIR"

# Si el repo está dentro de /root, permitir a Nginx (www-data) leer los archivos compilados
if [[ "$SCRIPT_DIR" == /root* ]]; then
    chmod +x /root
fi

# 8. Verificación de salud (Health Check)
echo "🩺 Verificando estado del backend..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/health || echo "error")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "============================================="
    echo "   ✅ ¡Despliegue finalizado exitosamente!   "
    echo "   Backend: OK (HTTP 200)                    "
    echo "   Web: https://finixarg.com                 "
    echo "   Admin: https://admin.finixarg.com         "
    echo "============================================="
else
    echo "============================================="
    echo "   ⚠️ Despliegue completado con advertencia: "
    echo "   Health check respondió código: $HTTP_STATUS"
    echo "   Revisa los logs con: pm2 logs finix-api   "
    echo "============================================="
fi

