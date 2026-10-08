# Paso a paso: probar Finix local y llevarlo al VPS

Guía del 7 de octubre de 2026. La copia local usa PostgreSQL nativo y Redis; el VPS no se modificó en esta revisión. El bash de deploy está preparado y ensayado localmente. El traslado de datos reales tiene controles adicionales: no publicar la copia de pruebas encima de datos que hayan seguido cambiando en Supabase.

## 1. Probar ahora

```bash
cd /home/juampi26/Finix
npm run local
```

Si ya está ejecutándose, abrir http://localhost:5173, http://localhost:5147 y http://localhost:8025. Las credenciales demo están en `.local/finix/demo-account.env`; los correos quedan en Mailpit. /ready en localhost:3010 comprueba DB y Redis. Probar login, recarga, portafolio, feed, noticias, comunidades, análisis, finanzas y admin. Para admin usar sus credenciales y TOTP originales; no se eliminó el segundo factor.

Las credenciales Google ya están configuradas en el env privado de la API. `/api/auth/providers` informa `google:true` y el frontend redirige a Google con el callback local exacto `http://localhost:5173/api/auth/google/callback`. Falta registrar esa URI en Google Cloud y probar el consentimiento/login real. El callback anterior de Supabase no se utiliza en este flujo.

## 2. Preparar el código que se trasladará

Hay cambios locales propios del proyecto y de estas revisiones. Revisar `git diff`/`git status`, seleccionar los archivos de código, scripts, documentación, Prisma y package-lock; crear un commit revisado y publicarlo en la rama elegida. No publicar `.env`, `ops/database/.secrets`, `.local`, uploads o respaldos. No se hizo commit/push automático de tus cambios.

El VPS necesita el commit que contiene el deploy nuevo. El script no empaqueta cambios sin commit y cancela un checkout sucio. Una release es el `git archive` del commit seleccionado; no depende de archivos olvidados en esta computadora.

## 3. Resolver los pendientes antes del corte real

- Completar Google y probar login/vinculación con una cuenta real si se conservará esa función.
- Recuperar un backup integral del origen gestionado: actualmente la cuenta SQL no puede leer auth. La exportación API no incluye hashes ni todas las tablas internas. Conservar Supabase activo hasta resolver este punto.
- Determinar cuál es el origen de verdad. Si Supabase sigue recibiendo escrituras, el backup local del 7 de octubre es un ensayo y no sirve como instantánea final. Congelar escritores y repetir la migración sobre una copia nueva del último origen, sin mezclar cuentas demo.
- Registrar JWT_SECRET, ADMIN_TOTP_ENCRYPTION_KEY, restricciones del admin y demás claves reales. Si TOTP usaba JWT_SECRET como fallback, conservar esa misma clave explícitamente. No regenerarlas al copiar el ejemplo.
- Definir copia externa privada del backup y comprobar el acceso SSH. Las claves no se suben a Git ni se muestran en comandos.

Para repetir la preparación desde el origen, los scripts disponibles son:

```bash
# Archivo privado con SOURCE_DATABASE_URL: conexión de sesión, no pool transacción.
node scripts/database/backup.cjs /ruta/privada/source.env /ruta/privada/corte/database
node scripts/database/verify-backup.cjs /ruta/privada/corte/database

# Archivo privado con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
# Lista Auth/Storage y descarga objetos; no modifica datos del proveedor.
node scripts/database/export-supabase-assets.cjs /ruta/privada/provider.env /ruta/privada/corte/provider
```

Si el verificador integral falla, el corte queda pendiente. `--application-only` sirve para ensayar la copia pública; no satisface el requisito de conservar todo el proyecto. Las APIs de Storage y Auth son inventarios adicionales, no sustituyen el dump integral. Los archivos y los usuarios están en carpetas privadas con manifiesto/hash.

Sobre una **copia nueva vacía** en loopback, inicializar roles, pasar `application.dump` por `/opt/finix/restore.sh` dentro del contenedor, comparar `validate.cjs` con el manifiesto del origen antes de transformar datos y ejecutar `permissions.sql`. Eso conserva el historial de 39 migraciones del origen; no lo reconstruye. Aplicar después la migración aditiva `20261007193000_external_identity`, ya revisada y probada, con `prisma migrate deploy` sobre esa copia. El SQL histórico SQLite no debe ejecutarse desde cero.

Preparar su `.env` privado con `FINIX_LOCAL_MODE=true`, NODE_ENV distinto de production, DATABASE_URL/DIRECT_URL de esa copia y rutas absolutas de archivos. Luego:

```bash
node scripts/database/install-supabase-assets.cjs /ruta/privada/copia.env /ruta/privada/corte/provider
node scripts/database/import-supabase-auth.cjs /ruta/privada/copia.env /ruta/privada/corte/provider/auth-users.json
```

El instalador verifica hashes, conserva archivos ya idénticos y detiene conflictos; coloca objetos públicos en uploads/supabase y privados fuera del directorio público. Reescribe sólo prefijos públicos Storage del proyecto; conserva el metadata original de ExternalIdentity. El importador preserva IDs de Finix y archiva el ID Auth; no reemplaza contraseñas existentes. Cuentas sin password Finix o sin hash importable necesitarán recuperación o vínculo Google verificado. Revisar referencias privadas/full URL del origen que no sigan el formato conocido. Validar las pantallas nuevamente y generar un **backup nativo final** de esa copia, con escritores detenidos.

Si desde ahora la base local pasa a ser el único origen de verdad y no hay nuevas escrituras remotas, el siguiente paso puede usar su backup nativo nuevo. Esa elección debe ser explícita al realizar el traslado.

## 4. Preparar acceso y dependencias del VPS

Entrar por el acceso SSH ya configurado. Usar un usuario de despliegue dedicado a Finix. Confirmar Ubuntu/CPU/RAM/disco, procesos existentes, puertos y configuración PM2/Nginx sin reiniciar otros sitios. No se verificaron otra vez los recursos actuales del VPS desde esta sesión.

Instalar si faltan Git, curl, tar, rsync, Node 22 LTS con un parche mantenido, npm, Docker Engine/Compose y PM2. Usar la documentación oficial de [Node](https://nodejs.org/en/download), [Docker para Ubuntu](https://docs.docker.com/engine/install/ubuntu/) y [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/). No hacer un upgrade general del sistema como parte del deploy de Finix.

Una vez Node está en el PATH del usuario del servicio:

```bash
npm install -g pm2
```

Preparar directorios inicialmente con el usuario de Finix (reemplazar finix por el real):

```bash
sudo install -d -o finix -g finix -m 755 /opt/finix
sudo install -d -o finix -g finix -m 700 /etc/finix /var/backups/finix
sudo install -d -o finix -g finix -m 755 /var/www/finix-web /var/www/finix-admin
```

Clonar el repositorio revisado en `/opt/finix/source` como ese usuario, seleccionar la rama/commit preparado y ejecutar:

```bash
cd /opt/finix/source
npm ci --no-audit --no-fund
bash ops/prepare-vps.sh --check
bash ops/prepare-vps.sh --prepare
```

`--check` muestra recursos, versiones y contenedores. `--prepare` genera sólo secretos faltantes, levanta PostgreSQL/Redis loopback y roles, y crea directorios persistentes. No elimina volúmenes ni instala/configura Nginx, certificados, SSH, firewall u otras aplicaciones. Si los puertos/directorios ya pertenecen a otro servicio, resolver la colisión antes de continuar. Requiere permisos del usuario para Docker y /opt/finix.

## 5. Copiar el respaldo final al VPS

En el origen nativo correcto, detener escritores del corte. La base y los archivos deben permanecer estables durante esta copia.

```bash
FINIX_API_ENV=/ruta/privada/origen-nativo.env \
FINIX_DB_CONTAINER=CONTENEDOR_NATIVO \
FINIX_SECRETS_DIR=/ruta/privada/database-secrets \
bash backup.sh /ruta/privada/corte-final
node scripts/database/verify-native-backup.cjs /ruta/privada/corte-final
```

El caso local corriente usa `npm run local:backup`. El backup comprobado en esta sesión quedó en `~/.local/share/finix-backups/20261007T192319Z-local-migration/vps-readiness/native-final-validated`; es un ensayo, no una autorización para reemplazar producción con él.

Copiar el backup final con SSH verificado, por ejemplo desde la computadora:

```bash
rsync -a --protect-args -e 'ssh -o StrictHostKeyChecking=yes' \
  /ruta/privada/corte-final/ finix@IP_DEL_VPS:/var/backups/finix/corte-final/
```

Conservar además una copia fuera del VPS. No cerrar Supabase ni borrar la copia local.

## 6. Restaurar únicamente en una base nueva vacía

En el VPS, generar URLs nuevas con los secretos del contenedor de destino:

```bash
cd /opt/finix/source
node scripts/database/create-local-env.cjs /etc/finix/restore-target.env 15432
```

Editar ese archivo privado y añadir:

```dotenv
UPLOADS_DIR=/opt/finix/shared/uploads
FINIX_PRIVATE_STORAGE_DIR=/opt/finix/shared/private/storage
```

Los directorios y el esquema deben estar vacíos. Si existe una base previa con datos, crear otro proyecto Compose, puerto y volumen; no resetearla ni limpiarla. La cuenta runtime debe tener permisos correctos en el destino, no privilegios de bootstrap.

```bash
FINIX_API_ENV=/etc/finix/restore-target.env \
FINIX_DB_CONTAINER=finix-production-db-1 \
bash restore.sh /var/backups/finix/corte-final --confirm-empty
```

El script verifica el manifiesto, restaura en una transacción y compara contenido/catálogo antes de permisos runtime y archivos. Se ensayó localmente este procedimiento exacto en el puerto 15533: 98 tablas, 31.497 filas y 44 archivos iguales por SHA256. Un destino poblado se rechaza. No significa que el backup futuro tendrá ese mismo total.

## 7. Preparar configuración de producción

Preparar `/etc/finix/api.env` a partir de las claves preservadas y de la nueva conexión, no mediante `source` del `.env` de aplicación. Tiene que ser modo 600 y legible por el usuario Finix. Copiar DATABASE_URL/DIRECT_URL del restore-target y completar:

```dotenv
NODE_ENV=production
FINIX_LOCAL_MODE=false
API_BIND_HOST=127.0.0.1
PORT=3010
REDIS_URL=redis://:CONTRASENA_PRIVADA_DEL_DESTINO@127.0.0.1:16379
UPLOADS_DIR=/opt/finix/shared/uploads
FINIX_PRIVATE_STORAGE_DIR=/opt/finix/shared/private/storage
FRONTEND_URL=https://finixarg.com
API_URL=https://finixarg.com
ADMIN_URL=https://admin.finixarg.com
ALLOWED_ORIGINS=https://finixarg.com,https://www.finixarg.com,https://admin.finixarg.com
JWT_SECRET=CLAVE_EXISTENTE
ADMIN_TOTP_ENCRYPTION_KEY=CLAVE_EXISTENTE_O_JWT_ANTERIOR
RESEND_API_KEY=CLAVE_EXISTENTE_VALIDADA
EMAIL_FROM="Finix <onboarding@finixarg.com>"
GOOGLE_CLIENT_ID=CLIENTE_REAL
GOOGLE_CLIENT_SECRET=SECRETO_REAL
GOOGLE_REDIRECT_URI=https://finixarg.com/api/auth/google/callback
```

Mantener las demás variables originales necesarias: admin owner/allowlist, claves de datos, mercado, pagos si corresponden y correo destinatario. Desactivar modo local reactiva cron y bootstrap de producción: revisar esos jobs y que el dueño/rol oficial configurados sean los correctos antes de arrancar. El perfil gratuito puede permanecer activo; no habilitar cobros hasta verificar claves/precios/webhooks.

Preparar `/etc/finix/web.env` con `VITE_API_URL=/api` y `/etc/finix/admin.env` con el base path público correcto. No incluir claves privadas ni variables Supabase en Vite. El proxy localhost del admin es para desarrollo.

```bash
install -m 600 ops/deploy.env.example /etc/finix/deploy.env
```

Editar rutas, rama, URLs health y contenedor/secrets. Si Google se deshabilitará deliberadamente, `FINIX_ALLOW_GOOGLE_DISABLED=true` permite continuar; eso no prueba Google. En el primer cambio de cwd PM2 legacy, preparar `FINIX_RECREATE_PM2_ONCE=true` sólo para el corte, luego false. Usar siempre el usuario/daemon PM2 correcto; detener la API Finix del usuario anterior durante mantenimiento si fuera necesario.

## 8. Revisar Nginx y preparar reversión

Comparar el vhost real con `deploy/nginx/finixarg.com.conf`, conservando certificados y otros sitios. Las raíces previstas son `/var/www/finix-web/current` y `/var/www/finix-admin/current`; /api, /uploads y /socket.io deben apuntar a 127.0.0.1:3010. /ready y /health también requieren proxy. El modelo ya tiene gzip, HTTP/2, keepalive, assets con hash e immutable, y HTML/service worker/release.json sin caché largo. No cachear respuestas privadas, auth ni cookies en Nginx.

Después de cambios revisados **sólo** al vhost Finix:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Verificar certificados/renovación y DNS reales; no copiar rutas TLS inexistentes ni reemplazar nginx.conf. El deploy no toca Nginx por sí mismo.

Antes de convertir directorios antiguos `current` a symlinks, conservar una release completa de reversión (API/dist/node_modules/config y frontends) y preparar los tres pointers; no borrar los directorios usados por procesos activos. La primera migración desde Supabase necesita también un plan de rollback de conexión/datos: una release nueva sin versión previa no ofrece rollback automático completo. Respaldar la configuración de Nginx/PM2 vigente de forma privada.

## 9. Ensayar el deploy y publicar durante el corte

```bash
cd /opt/finix/source
FINIX_DEPLOY_CONFIG=/etc/finix/deploy.env bash deploy.sh --dry-run
```

Corregir todos los bloqueos del preflight antes de avanzar. El siguiente comando realiza el despliegue real:

```bash
FINIX_DEPLOY_CONFIG=/etc/finix/deploy.env bash deploy.sh
```

Prepara release aislada, backup verificado, migrate deploy revisado, builds, publicación y health. Sólo afecta finix-api y sus pointers. Si falla el build, la release anterior sigue funcionando. Si falla health después de publicar, intenta restaurar el código previo; no restaura la DB automáticamente sobre escrituras nuevas.

El preflight exige una base restaurada. Las migraciones nuevas requieren su hash revisado en ops/database/reviewed-migrations.json y SQL no destructivo. Si alguna exige transformación incompatible, realizar un plan separado: no forzar el deploy con reset/db push.

## 10. Verificar y habilitar tráfico

```bash
curl -fsS http://127.0.0.1:3010/ready
curl -fsS http://127.0.0.1:3010/health
curl -fsS https://finixarg.com/release.json
curl -fsS https://admin.finixarg.com/release.json
node scripts/database/check-local.cjs /etc/finix/api.env
```

Verificar navegador web/admin, login/email/TOTP/Google, sesión tras recarga, recuperación, publicaciones/archivos privados, carteras, movimientos, saldo, watchlist, comunidades, mensajes, noticias, calendario, análisis, Socket.IO y configuración de pagos. Probar emails/Google reales con cuentas/destinatarios autorizados. Revisar tiempos/errores y jobs en una ventana controlada; las pruebas con emails/pagos simulados no reemplazan esos ensayos externos.

Guardar la configuración de arranque de PM2 después de un resultado correcto; revisar `pm2 startup` y `pm2 save` para el usuario seleccionado. Si comparte daemon, comprobar su lista antes de save; no usar restart/delete all. El ensayo de reboot del VPS queda pendiente.

Instalar los archivos `ops/finix-backup.service` y `.timer` con User/Group/WorkingDirectory correctos y ejecutar/verificar primero un backup manual del servidor. Activar después el timer:

```bash
sudo install -m 644 ops/finix-backup.service /etc/systemd/system/finix-backup.service
sudo install -m 644 ops/finix-backup.timer /etc/systemd/system/finix-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now finix-backup.timer
systemctl list-timers finix-backup.timer
```

Configurar FINIX_BACKUP_REMOTE y comprobar la copia externa. Restaurar regularmente en un destino vacío aislado y comparar el resultado; mantener monitor de disponibilidad, espacio y antigüedad de backup. Si se necesita rollback al origen remoto después de admitir escrituras, congelar ambos lados y reconciliar todos los registros nuevos antes de cambiar URLs. No eliminar Supabase hasta cerrar los pendientes y demostrar estabilidad/recuperación.
