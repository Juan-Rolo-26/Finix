# FINIX — Production Runbook

> Quick reference for common operational tasks.

---

## 🔧 Desarrollo Local

```bash
# Clonar e instalar
git clone git@github.com:tuorg/finix.git
cd finix
cp apps/api/.env.example apps/api/.env   # Completar con tus valores
cp apps/web/.env.example apps/web/.env
npm install

# Iniciar con Docker Compose
docker compose up -d          # PostgreSQL + Redis + API + Web

# O iniciar manualmente
npm run dev                   # Inicia API (3010) + Web (5173)
```

---

## 🚀 Deploy a Producción

```bash
# Merge a main dispara CI/CD automáticamente.
# El pipeline ejecuta: typecheck → lint → tests → build → deploy → smoke test

# Deploy manual (emergencia):
ssh finix-vps '/srv/finix/scripts/deploy.sh'
```

---

## ⏮️ Rollback

```bash
# Automático: el script de deploy ejecuta rollback si el health check falla.

# Manual:
ssh finix-vps '/srv/finix/scripts/rollback.sh'

# Ver releases disponibles:
ssh finix-vps 'ls -lt /srv/finix/releases/'
```

---

## 🗄️ Base de Datos

### Ejecutar migration

```bash
# Desarrollo
cd apps/api && npx prisma migrate dev --name nombre_de_la_migration

# Producción (solo con deploy, NUNCA manualmente si hay CI)
cd apps/api && npx prisma migrate deploy
```

### Ver estado de migrations

```bash
cd apps/api && npx prisma migrate status
```

### Backup manual

```bash
ssh finix-vps '/srv/finix/scripts/backup.sh'
```

### Restore

```bash
# En VPS:
pg_restore -U finix_admin -h HOST -d postgres backup_YYYYMMDD.dump
```

---

## 📋 Logs

```bash
# API logs (PM2)
pm2 logs finix-api
pm2 logs finix-api --lines 100

# Nginx access log
tail -f /var/log/nginx/access.log

# Nginx error log
tail -f /var/log/nginx/error.log
```

---

## 🔄 Reiniciar servicios

### API (PM2)

```bash
pm2 restart finix-api   # Hard restart
pm2 reload finix-api    # Zero-downtime reload (preferred)
pm2 status              # Ver estado de todos los procesos
```

### Nginx

```bash
sudo nginx -t           # Verificar config antes de recargar
sudo systemctl reload nginx   # Reload sin downtime
sudo systemctl restart nginx  # Restart completo (breve downtime)
```

---

## 🔑 Cambiar secrets

1. Actualizar en GitHub Secrets (Settings → Secrets and variables → Actions)
2. Actualizar en `/srv/finix/shared/apps/api/.env` en el VPS
3. Recargar API: `pm2 reload finix-api`

**NUNCA** commitear secrets al repo.

---

## 📊 Monitoring

```bash
# Ver uso de recursos
pm2 monit

# Ver health
curl https://finixarg.com/health

# Ver métricas DB (conexiones activas)
# Consultar panel Supabase Dashboard → Database → Connections
```

---

## 🔍 Debugging de errores

```bash
# Ver último error del API
pm2 logs finix-api --err --lines 50

# Ver request específico por ID (si Request-ID está implementado)
grep "req-XXXXX" /var/log/finix/api.log

# Ver errores 500 en nginx
grep " 500 " /var/log/nginx/access.log | tail -20
```

---

## 📦 Agregar variable de entorno

1. Agregar a `apps/api/.env.example` con descripción (SIN el valor)
2. Documentar en `docs/environment.md`
3. Subir valor real a:
   - GitHub Secrets (para CI/CD)
   - `/srv/finix/shared/apps/api/.env` (VPS)
4. Recargar: `pm2 reload finix-api`

---

## 🛡️ Incidentes de seguridad

1. Identificar el leak/ataque
2. Rotar los secretos afectados **inmediatamente**
3. Revocar tokens/sessions comprometidas
4. Revisar logs de acceso
5. Notificar si corresponde (GDPR, usuarios)
6. Documentar en post-mortem

---

## 💾 Backup & Recovery

### Schedule actual

| Tipo    | Frecuencia | Retención | Almacenamiento |
| ------- | ---------- | --------- | -------------- |
| Supabase auto-backup | Diario | 7 días | Supabase cloud |
| Manual backup | On-demand | 30 días | R2/S3 |

### Restaurar backup

```bash
# 1. Descargar backup de R2
aws s3 cp s3://finix-backups/backup_YYYYMMDD.dump.gz ./

# 2. Descomprimir
gunzip backup_YYYYMMDD.dump.gz

# 3. Restaurar (ATENCIÓN: destructivo en producción)
pg_restore -U finix_admin -h HOST -d postgres --clean backup_YYYYMMDD.dump

# 4. Verificar
npx prisma migrate status
```

---

## 🔴 Incidentes comunes

### API no responde

```bash
pm2 status           # Ver si el proceso está corriendo
pm2 restart finix-api
curl https://finixarg.com/health
```

### Base de datos no disponible

- Ver estado en Supabase Dashboard
- El API devuelve 503 — se muestra página de error al usuario
- No hacer nada hasta que Supabase esté disponible

### Redis no disponible

- Las funcionalidades de rate limiting/cache degradan graciosamente
- El API continúa funcionando consultando PostgreSQL directamente

### Market data API caída

- El API devuelve datos en cache (si existen) o error 503 en ese endpoint
- El resto de la app sigue funcionando

---

## 📞 Contacto de emergencia

- **Infra / VPS**: juanpablorolo2007@gmail.com
- **Supabase Dashboard**: https://supabase.com/dashboard/project/apxfsuxftnovgkvdrwpx
- **Status Supabase**: https://status.supabase.com
