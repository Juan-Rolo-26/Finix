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

# 2. Permisos INMEDIATOS para que NGINX (www-data) siempre pueda leer la carpeta
echo "🔒 Verificando permisos del servidor web..."
chmod -R 755 "$SCRIPT_DIR"
if [[ "$SCRIPT_DIR" == /root* ]]; then
    chmod 755 /root
fi

# 3. Descargar los últimos cambios de GitHub
echo "[1/7] Descargando últimos cambios desde GitHub (main)..."
git fetch --all
git reset --hard origin/main

# 4. Instalar dependencias del monorepo
echo "[2/7] Instalando dependencias de NPM..."
npm install

# 5. Cargar variables de apps/api/.env de forma segura
if [ -f "apps/api/.env" ]; then
    set -a
    source apps/api/.env 2>/dev/null || true
    set +a
    if [ -z "$DIRECT_URL" ] && [ -n "$DATABASE_URL" ]; then
        export DIRECT_URL="$DATABASE_URL"
    fi
fi

echo "[3/7] Sincronizando base de datos con Prisma..."
npx prisma generate --schema=apps/api/prisma/schema.prisma
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma || {
    echo "⚠️ Advertencia: Error en prisma migrate deploy. Continuando con el build..."
}

# 6. Compilar Backend, Web y Admin
echo "[4/7] Compilando Backend (NestJS)..."
cd "$SCRIPT_DIR/apps/api"
rm -f *.tsbuildinfo
npx nest build || npx tsc -p tsconfig.build.json
cd "$SCRIPT_DIR"

# Asegurar que main.js esté en dist/main.js si se compiló en subcarpeta
if [ -f "$SCRIPT_DIR/apps/api/dist/src/main.js" ] && [ ! -f "$SCRIPT_DIR/apps/api/dist/main.js" ]; then
    cp -r "$SCRIPT_DIR/apps/api/dist/src/"* "$SCRIPT_DIR/apps/api/dist/"
fi

echo "[5/7] Compilando Frontend Web (finixarg.com)..."
npm run build -w web

echo "[6/7] Compilando Panel Admin (admin.finixarg.com)..."
npm run build -w admin

# 7. Publicar archivos en /var/www/finix-web y /var/www/finix-admin (evita cualquier error 500 de permisos en /root)
echo "📦 Publicando frontend para NGINX..."
sudo mkdir -p /var/www/finix-web /var/www/finix-admin "$SCRIPT_DIR/apps/api/uploads"
sudo cp -r "$SCRIPT_DIR/apps/web/dist/"* /var/www/finix-web/
sudo cp -r "$SCRIPT_DIR/apps/admin/dist/"* /var/www/finix-admin/
sudo chown -R www-data:www-data /var/www/finix-web /var/www/finix-admin "$SCRIPT_DIR/apps/api/uploads"
sudo chmod -R 755 /var/www/finix-web /var/www/finix-admin "$SCRIPT_DIR/apps/api/uploads"

# 8. Gestionar proceso PM2
echo "[7/7] Gestionando proceso en PM2..."
API_ENTRY=$(find "$SCRIPT_DIR/apps/api/dist" -name "main.js" 2>/dev/null | head -n 1)

if [ -z "$API_ENTRY" ]; then
    echo "❌ Error: No se encontró main.js en $SCRIPT_DIR/apps/api/dist"
    exit 1
fi

echo "📍 Archivo de inicio del backend: $API_ENTRY"

# Eliminar proceso previo desactualizado para asegurar la ruta correcta
pm2 delete finix-api 2>/dev/null || true
pm2 start "$API_ENTRY" --name "finix-api" --cwd "$SCRIPT_DIR/apps/api"
pm2 save

# 9. Actualizar y recargar NGINX automáticamente
echo "🌐 Actualizando configuración y recargando NGINX..."
sudo cp "$SCRIPT_DIR/deploy/nginx/finixarg.com.conf" /etc/nginx/sites-available/finixarg.com.conf
sudo ln -sf /etc/nginx/sites-available/finixarg.com.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx || echo "⚠️ Advertencia al recargar NGINX"

# 10. Verificación de salud (Health Check)
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
    echo "   ⚠️ Despliegue completado:                  "
    echo "   Health check respondió código: $HTTP_STATUS"
    echo "   Revisa los logs con: pm2 logs finix-api   "
    echo "============================================="
fi

