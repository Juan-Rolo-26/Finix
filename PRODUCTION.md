# Finix — producción

## Deploy

`./deploy.sh` usa modo estricto, lock contra concurrencia, `git pull --ff-only`, migraciones exclusivamente con `prisma migrate deploy`, builds y healthcheck. No usa `prisma db push`.

## Backup y restore

```bash
./backup.sh
./restore.sh /var/backups/finix/backup-AAAA-MM-DDTHH-MM-SSZ.sql.gz
```

Programar el backup diariamente y copiarlo a S3/R2/Backblaze; no depender solo del VPS.

## Instalación

```bash
cp apps/api/.env.example apps/api/.env
chmod 600 apps/api/.env
npm ci
npx prisma generate --schema=apps/api/prisma/schema.prisma
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

Usar `ops/ecosystem.config.cjs`, `ops/nginx/finixarg.com.conf`, `pm2 startup`, `pm2 save`, Certbot, UFW solo SSH/80/443 y Fail2ban. No exponer PostgreSQL, Redis ni Node.

## Checklist

- Secretos rotados y fuera de Git
- HTTPS/HSTS y renovación funcionando
- CORS con dominios reales
- PM2 reinicia tras reboot
- Backups y restore probados
- `/health` y `/ready` operativos
- Builds de API, web y admin verificados
