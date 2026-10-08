# Finix: ejecución local y despliegue al VPS

Estado comprobado el 7 de octubre de 2026. El entorno local está migrado a PostgreSQL nativo y Redis. En esta revisión no se conectó ni desplegó al VPS.

La guía con el paso a paso del primer traslado está en [docs/database-local-vps.md](docs/database-local-vps.md). Los resultados y pendientes están en [docs/vps-readiness-2026-10-07.md](docs/vps-readiness-2026-10-07.md). La configuración de PostgreSQL está en [POSTGRESQL.md](POSTGRESQL.md).

## Probar ahora en esta computadora

```bash
npm run local
```

Web: http://localhost:5173. Admin: http://localhost:5147. Correos de registro, recuperación y admin: http://localhost:8025. Readiness: http://localhost:3010/ready, comprueba PostgreSQL y Redis.

Si ya están iniciados, abrir esas direcciones; no levantar otra copia. Ctrl+C detiene las aplicaciones; `npm run local:stop` detiene los contenedores conservando los datos. No ejecutar `down -v`.

La cuenta demo está en `.local/finix/demo-account.env`. Los usuarios y las claves originales se conservan. El admin sigue exigiendo contraseña, email y TOTP. Google necesita las credenciales indicadas más abajo.

Para volver a ejecutar checks que construyen la API, detener primero el watch de `npm run local`: un build que limpia `dist` no debe competir con otro compilador.

```bash
npm run local:check
npm test -w api
npm run local:test
npm run build -w web
npm run build -w admin
npm run local:backup
```

La integración con pantallas requiere web/admin iniciados y Chromium con sus dependencias:

```bash
FINIX_AUDIT_DATABASE_ENV=apps/api/.env FINIX_AUDIT_BROWSER=true \
FINIX_AUDIT_WEB_URL=http://localhost:5173 node scripts/full-web.integration.cjs
```

Los tests de operaciones usan el Redis/PostgreSQL locales. El ensayo real de PM2 requiere un binario local en `.local/finix/ops-tools/node_modules/.bin/pm2`; instalarlo con `npm install --prefix .local/finix/ops-tools pm2`. El test usa un daemon temporal y el puerto 13561; no toca el daemon habitual.

```bash
npm run ops:test
```

## Qué hace el deploy

`npm run deploy` ahora llama `bash deploy.sh`. El comando anterior hacía commit y push de todo el checkout; esa publicación automática no forma parte del deploy nuevo.

```bash
FINIX_DEPLOY_CONFIG=/etc/finix/deploy.env bash deploy.sh --dry-run
FINIX_DEPLOY_CONFIG=/etc/finix/deploy.env bash deploy.sh
```

La configuración del operador se prepara a partir de `ops/deploy.env.example`. El dry run valida variables y lee la base; no hace fetch/pull, instalaciones, builds, respaldos, creación de releases, locks, cambios de procesos o symlinks. No sirve contra el `.env` de desarrollo: exige la configuración de producción.

El deploy normal:

1. Valida entorno, rol de aplicación, base ya restaurada, rutas persistentes, checkout limpio y directorios del operador.
2. Adquiere un lock propio de Finix y trae la rama configurada con `git fetch`; no modifica el checkout activo.
3. Extrae el commit en una release nueva; instala dependencias y genera Prisma allí.
4. Construye shared, API, web y admin sin borrar archivos usados por la API anterior. Cada release conserva su configuración privada con permiso 600. PM2 recibe esa configuración explícitamente; variables viejas del proceso o shell no reemplazan la nueva DATABASE_URL.
5. Comprueba SQL pendiente contra `ops/database/reviewed-migrations.json`. Cada migración nueva exige SHA256 revisado; bloquea SQL potencialmente destructivo y la historia SQLite sin aplicar.
6. Genera y verifica respaldo completo de PostgreSQL, archivos públicos/privados y claves antes de `prisma migrate deploy`.
7. Cambia symlinks de API/web/admin y recarga únicamente `finix-api` usando un directorio PM2 estable.
8. Comprueba DB/Redis, commit de API y `release.json` HTTPS de web/admin. Si falla después de publicar, repone las releases anteriores y solicita la recarga del código previo.

Las migraciones no se revierten automáticamente. Un rollback de código exige migraciones compatibles con la release anterior. El primer deploy sin release anterior detiene la API si falla y necesita intervención. Se conservan las releases; no hay limpieza automática que pueda borrar la vigente. Revisar su espacio en disco.

Para la primera conversión de un PM2 que usaba otra ruta, `FINIX_RECREATE_PM2_ONCE=true` permite recrear exclusivamente `finix-api`; hacerlo durante el corte y quitarlo después. Las siguientes recargas usan `/opt/finix/current/apps/api`. El ensayo detectó que PM2 retiene el cwd anterior al recargar: por eso la ruta del proceso es estable y el symlink cambia.

El script conserva Nginx, certificados, DNS, SSH, firewall y otros procesos. Sus ajustes iniciales se revisan aparte. Una instancia evita duplicar cron y perder mensajes Socket.IO; puede haber una interrupción breve. La documentación de [PM2](https://pm2.keymetrics.io/docs/faq/) reserva la recarga sin interrupción para cluster, que Finix todavía no habilita.

## Backups y restauración

```bash
# Local; crea una carpeta privada nueva y nunca sobrescribe otra.
bash backup.sh

# VPS con las variables del archivo del operador ya exportadas.
set -a
source /etc/finix/deploy.env
set +a
bash backup.sh

node scripts/database/verify-native-backup.cjs /ruta/al/respaldo
node scripts/database/retention.cjs /var/backups/finix
```

`backup-postgres.sh` es un alias de `backup.sh`; `restore-postgres.sh` lo es de `restore.sh`. El backup usa credenciales por entorno del proceso y clientes de la misma imagen de PostgreSQL; no coloca URLs con contraseñas en argv. Conserva dump completo, dump público, SQL, roles sin contraseñas, manifiestos, archivos y configuración con secretos: toda la carpeta es privada.

La instantánea de PostgreSQL es consistente. Para que DB y archivos correspondan a un mismo instante, detener escritores durante el respaldo del corte. Los respaldos diarios son online y su copia de archivos no es una instantánea transaccional.

La restauración requiere destino vacío, URL loopback y contenedor declarado explícitamente. Rechaza un esquema poblado y carpetas de archivos con contenido; nunca hace reset, DROP ni limpieza sobre la base vigente. Compara filas, huellas, esquema, constraints e índices antes de habilitar el rol runtime. Las claves del backup no sobrescriben automáticamente la configuración del destino.

```bash
FINIX_API_ENV=/etc/finix/restore-target.env \
FINIX_DB_CONTAINER=finix-production-db-1 \
bash restore.sh /var/backups/finix/RESPALDO --confirm-empty
```

El archivo `restore-target.env` debe contener DATABASE_URL, DIRECT_URL y rutas absolutas vacías UPLOADS_DIR / FINIX_PRIVATE_STORAGE_DIR del destino.

Hay timer y service en `ops/finix-backup.*`: 03:15 UTC con retraso aleatorio, retención de un respaldo por día para 7 días, uno por semana para 4 semanas y uno por mes para 3 meses. Instalarlos sólo después del primer deploy correcto, ajustando User/Group/WorkingDirectory al usuario real. `ops/daily-backup.sh` usa el código de la release vigente. No se instalaron ni modificaron tareas del VPS en esta revisión.

`FINIX_BACKUP_REMOTE=usuario@servidor:/ruta/` habilita copia rsync por SSH ya configurado y con host verificado. No borra el destino ni configura SSH. Dejarlo vacío significa que aún falta copia externa automática. Los secretos deben ir en un destino privado/cifrado. Una copia en el mismo disco no cubre la pérdida del VPS.

## Configuraciones pendientes

- Google: faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET. Registrar exactamente `http://localhost:5173/api/auth/google/callback` para local y `https://finixarg.com/api/auth/google/callback` para producción. Conservar client/consentimiento y comprobar vinculación/login con una cuenta real. El secreto va sólo en API. El deploy bloquea Google ausente, salvo decisión explícita `FINIX_ALLOW_GOOGLE_DISABLED=true`.
- Resend: la clave archivada y el dominio finixarg.com respondieron correctamente a controles de sólo lectura; no se enviaron correos externos. En local se usa Mailpit. En VPS restaurar RESEND_API_KEY, EMAIL_FROM y destinatarios reales y probar registro/recuperación/admin con un destinatario autorizado.
- Auth gestionado de Supabase: la exportación API conserva 5 usuarios e identidades disponibles, pero no sus hashes de contraseña ni todas las tablas internas. El dump integral del origen sigue bloqueado por permisos sobre auth. Resolverlo antes de cerrar Supabase o afirmar que se conservó íntegramente todo su proyecto.
- Stripe, precios y webhook: los valores originales son placeholders. Mercado Pago autentica en lectura, pero falta ensayo de webhook/cobro si se habilitan compras. El acceso gratuito mantiene compras pausadas.
- Push: faltan VAPID. IA local phi3:mini funciona; el VPS debe tener Ollama/modelo y recursos suficientes si se conservará esa función. MX de correo entrante y DNS de api.finixarg.com están pendientes si se usarán; el diseño actual puede servir API por `/api` sin ese subdominio.
- Origen final, copia externa, recursos, SSL/Nginx, reinicio del VPS, monitor/alertas y prueba de correo/OAuth en producción: aún requieren verificación en el servidor.
