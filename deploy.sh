#!/bin/bash
# Script de Despliegue Automático para Finix (VPS)
# Este script descarga los últimos cambios de GitHub, instala y compila todo, y reinicia los servicios.

echo "============================================="
echo "   Iniciando Despliegue Automático FINIX     "
echo "============================================="

# 1. Movernos a la carpeta del proyecto
cd /var/www/finix || { echo "La carpeta /var/www/finix no existe."; exit 1; }

# 2. Descargar los últimos cambios (sin que pregunte contraseñas)
echo "Descargando código desde GitHub..."
git fetch --all
git reset --hard origin/main

# 3. Instalar nuevas dependencias
echo "Instalando dependencias de NPM..."
npm install

# 4. Compilar las 3 aplicaciones
echo "Compilando Backend (NestJS)..."
npm run build -w api

echo "Compilando Frontend (Web)..."
npm run build -w web

echo "Compilando Admin..."
npm run build -w admin

# 5. Reiniciar el Backend
echo "Reiniciando servidor PM2..."
pm2 restart finix-api

# 6. Re-aplicar permisos limpios para NGINX
echo "Asegurando permisos web..."
chown -R www-data:www-data apps/web/dist
chown -R www-data:www-data apps/admin/dist
chmod -R 755 /var/www/finix

echo "============================================="
echo "   ¡Despliegue finalizado exitosamente! 🚀   "
echo "================================================="
