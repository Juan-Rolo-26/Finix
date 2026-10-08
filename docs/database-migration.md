# Migración de Finix: auditoría y ensayo de restauración

> Archivo histórico del 5 de octubre. Auth/SDK Supabase no describen el local actual. Ver [el paso a paso vigente](database-local-vps.md) y [la verificación actual](vps-readiness-2026-10-07.md).

Estado al 5 de octubre de 2026 (UTC): **la base de producción sigue en Supabase**. Se completó el respaldo de la aplicación y un ensayo aislado. El respaldo integral de Supabase está pendiente porque `finix_admin` no tiene acceso a `auth`. El requisito de respaldo completo previo impide instalar o cambiar la infraestructura de producción todavía.

## Evidencia y respaldos

- VPS: Ubuntu 24.04, 2 CPU, 7.940 MiB de RAM; aproximadamente 6.644 MiB disponibles al auditar. Disco virtual no rotacional de 100 GB, raíz con 78 GB libres, sin swap. Comparte recursos con otras aplicaciones.
- Origen: PostgreSQL 17.6, aproximadamente 46,6 MiB; 137 tablas entre los esquemas gestionados y la aplicación.
- Aplicación: 97 tablas públicas, 22.207 registros en la primera instantánea; 1.263 columnas, 232 constraints y 309 índices. Sin enums ni secuencias públicas. Una función propia; sin vistas ni triggers públicos propios. 17 tablas con RLS.
- Respaldo del VPS: `/var/backups/finix/database/20261005T0305Z/`, privado para root. Incluye proyecto, `.env`, Prisma, migraciones, Nginx y registro PM2. El archivo completo del proyecto pasó la lectura de su archivo tar.
- Respaldo fuera del VPS: `/home/juampi26/.local/share/finix-backups/20261005T030107Z/`. Incluye proyecto local, bundle Git, cambios pendientes y copia del dump de aplicación con SHA-256 verificado. La copia grande de `project-before.tar.gz.partial` está incompleta y **no cuenta como respaldo válido**.
- `source-initial/application.dump` se restauró sin errores en un PostgreSQL 18.6 aislado, accesible solamente por `127.0.0.1:55441` en el entorno local. Las 97 tablas y sus 22.207 registros coinciden mediante conteos y dos huellas de contenido; sin constraints ni índices inválidos. Informe privado: `restore-validation.json`.
- Las comparaciones de números de punto flotante normalizan `extra_float_digits`: el rol de Supabase usa por defecto 0, mientras que `pg_dump` conserva precisión completa. Esta diferencia de representación se corrigió en la validación, sin modificar datos.
- Segundo ensayo: `source-structural/application.dump` recoge las escrituras posteriores de noticias. Se copió fuera del VPS con checksum verificado y se restauró en otra base vacía, `finix_validation_final`, dentro del mismo contenedor aislado. **97 tablas y 22.231 registros coinciden**, junto con columnas, constraints, índices, enums, secuencias, triggers, vistas y configuración RLS. Informe privado: `restore-final-validation.json`. Ambos ensayos conservan sus bases y archivos separados.
- Los cinco tests de seguridad de `verify-backup.test.cjs` pasan: artefactos íntegros, corrupción, respaldo público incompleto, ausencia del dump total y ruta de archivo fuera del directorio. El flujo de respaldo completo se ejecutó además sobre el PostgreSQL de ensayo, sin errores.

## Resultado por los 20 puntos solicitados

| Punto | Resultado comprobado o trabajo pendiente |
|---|---|
| 1. Arquitectura anterior | React/Vite servido por Nginx → NestJS/Prisma → Supabase remoto. OAuth de Google utiliza Supabase Auth; también hay JWT y sesiones propias. El frontend existente no es Next.js. |
| 2. Arquitectura nueva | Preparada: React/Vite + NestJS → PostgreSQL local; Redis local cuando haya evidencia de beneficio. Supabase Auth sigue disponible. Cambio de producción pendiente. |
| 3. Problemas | 137 ms de latencia media para `SELECT 1` desde el VPS al origen; dos procesos PM2 con cachés y tareas locales; respaldos históricos de 20 bytes; conexión sin permisos sobre Auth. |
| 4. Migración | Ensayo completo del esquema público restaurado y validado. No se realizó el corte de producción. |
| 5. Queries | Auditoría estática: 804 llamadas Prisma, 88 `findMany` sin `take` directo, 47 llamadas dentro de loops. Son candidatos, no 135 defectos confirmados: varios usan conjuntos `IN`, lotes, ventanas temporales o comprobaciones necesarias. |
| 6. Índices | Inventariados 309. Los índices de ranking público y seguidores entrantes ya existen en el trabajo previo; no se agregaron índices sin medición. Comparación estructural automatizada preparada. |
| 7. N+1 | Revisados candidatos: carga de respuestas agrupada por nivel, importaciones de calendario y notificaciones. Las comprobaciones de baja de emails y de entrega de notificaciones no se eliminaron. No se atribuye una eliminación nueva a esta fase. |
| 8. Cachés | Ya existen cachés locales con TTL, deduplicación de cargas e invalidación. Redis aún no está instalado. No se sustituyó una caché local eficaz por una conexión adicional sin benchmark. |
| 9. PostgreSQL | Configuración propuesta abajo; no aplicada al VPS. |
| 10. Redis | Puerto local y memoria limitada previstos; despliegue e integración pendientes. |
| 11. Nginx | Configuración vigente respaldada; ya tiene HTTP/2, gzip y caché de assets. Comparte servidor con otras aplicaciones. No se reinició. |
| 12. Prisma | Instancia persistente y normalización del pool Supabase ya presentes. URL nativa y credenciales separadas pendientes. |
| 13. NestJS | Se conservaron los cambios previos y la autenticación. Auditoría automatizada disponible; no se desplegaron cambios de backend en esta fase. |
| 14. Frontend | React/Vite con carga diferida y prefetch existente. Rediseño local de seguimiento realizado en la tarea anterior; no desplegado durante la migración. |
| 15. Backups | Respaldos actuales y herramientas comprobables creados. Respaldo total gestionado, programación diaria/semanal y destino externo recurrente pendientes. |
| 16. Seguridad | Archivos privados, secretos fuera de Git y argumentos de procesos. PostgreSQL y Redis no escuchan actualmente en el VPS. Firewall activo; acceso root con contraseña y actualizaciones pendientes auditados. No se cambió el acceso SSH. |
| 17. Benchmark | Medición real del origen y HTTP inicial; no existe aún un después comparable en producción. |
| 18. CPU/RAM | RAM del VPS al auditar: 1.296 MiB usados. Los dos procesos Finix rondaban 240 y 267 MiB. Sin medición posterior de producción. |
| 19. Queries | 20 muestras de `SELECT 1`: media 137,368 ms, p95 138,289 ms. No se confunde la latencia de red con el tiempo de ejecución SQL. |
| 20. Pendientes | Acceso administrador al origen, respaldo total verificable, restauración compatible de esquemas gestionados, preparación del VPS, ensayo backend autenticado, corte final, Redis si mejora medible, monitoreo y pruebas de carga. |

## Dependencias de Supabase

El código usa Supabase Auth para OAuth de Google, lectura de sesión y cierre/actualización de sesión. NestJS acepta tokens propios y de Supabase y sincroniza el mismo ID con `User`. Esos servicios deben seguir activos tras mover las tablas públicas.

No se encontraron llamadas `.storage`, `.from`, `.channel`, `.rpc` o `.functions` del SDK en el código inspeccionado. Los archivos y Socket.IO tienen implementación propia. Esto no demuestra que el proyecto remoto carezca de objetos Storage o Edge Functions: su inventario operativo permanece pendiente del acceso administrador. No se eliminó ningún servicio Supabase.

El dump público puede restaurarse en PostgreSQL nativo. El dump integral incluye componentes gestionados de Supabase, entre ellos Vault/Auth, y requiere un entorno compatible para comprobar una restauración integral; no deben copiarse indiscriminadamente sus roles privilegiados a la base de aplicación.

## Parámetros de destino preparados

Para este VPS compartido, el punto de partida conservador es un solo proceso Finix y un pool Prisma de 10 conexiones, con `max_connections=40`. PostgreSQL escucha en `127.0.0.1`; DB `finix_prod`, UTF-8 y UTC. Separar el propietario de migraciones `finix_owner` del usuario de ejecución `finix_app`, sin superusuario, creación de bases/roles ni bypass RLS.

Reservar aproximadamente 256 MiB de `shared_buffers` (RAM/32), 2 GiB de `effective_cache_size` como estimación del cache disponible, `work_mem=4MB` y `maintenance_work_mem=128MB`. Mantener WAL/checkpoints/autovacuum con valores conservadores hasta medir la carga local; no cambiar costos del planner por asumir que un disco virtual tiene rendimiento de NVMe. Activar `pg_stat_statements` antes de la puesta en marcha. Timeout SQL del usuario de aplicación y límite de transacciones ociosas deben acompañar al timeout HTTP.

Las tablas con RLS requieren una política explícita para el rol confiable del backend, preservando las políticas anteriores. Dar CRUD a `finix_app` sin esa política bloquearía el acceso porque este rol no es propietario. Validar los permisos con el usuario real de ejecución; no usar superusuario para las pruebas finales.

Redis previsto: loopback, ACL/credencial privada, namespace `finix:*`, límite inicial de 128 MiB. Elegir qué respuestas públicas almacenar mediante medición. Mantener datos privados fuera de claves compartidas y verificar invalidación tras cada escritura. No habilitar cluster PM2 mientras jobs y Socket.IO dependan del proceso.

## Herramientas y controles

Desde la raíz del repositorio, con dependencias instaladas y clientes PostgreSQL compatibles:

```bash
# Archivo privado con SOURCE_DATABASE_URL del administrador del origen.
node scripts/database/backup.cjs /root/finix-migration-source.env /var/backups/finix/database/FECHA-UTC
node scripts/database/verify-backup.cjs /var/backups/finix/database/FECHA-UTC

# Solo sobre un destino de ensayo ya restaurado; no escribe en la base.
node scripts/database/validate.cjs /ruta/privada/destino.env /ruta/backup/manifest.json /ruta/privada/validacion.json

# Catálogo y candidatos de consultas; reportes sin publicar datos de usuarios.
node scripts/database/audit.cjs apps/api/.env /ruta/privada/catalogo.json
node scripts/database/code-audit.cjs /ruta/privada/auditoria-codigo.json
node scripts/performance/api-latency.cjs http://127.0.0.1:3010 /ruta/privada/http.json
node --test scripts/database/verify-backup.test.cjs
```

El respaldo conserva una instantánea consistente para los datos, esquema y conteos públicos. Registra checksum, tamaño, precisión y catálogo. Rechaza sobrescribir un directorio existente. Los errores están en archivos privados. El verificador rechaza un respaldo incompleto aunque el dump público sea válido; `--application-only` sirve exclusivamente para el ensayo. Una lectura de TOC y checksum no sustituyen la restauración comprobada.

La validación compara todas las tablas públicas, cuenta filas y contrasta contenido; los manifiestos nuevos incluyen columnas, constraints, índices, enums, secuencias, triggers, vistas y RLS. Los constraints NOT NULL añadidos al catálogo por PostgreSQL 18 se contrastan mediante las columnas para permitir la comparación con PostgreSQL 17. Las secuencias requieren detener escritores durante el corte: sus valores no están sujetos a la instantánea MVCC.

El benchmark HTTP excluye 401, 429 y otros errores de sus estadísticas de éxito. Rankings/comunidades necesitan una sesión legítima. Los resultados iniciales incluyeron throttling y no son un benchmark de carga válido. Noticias, feed y calendario tuvieron primeras respuestas de aproximadamente 1,42 s, 1,94 s y 3,12 s; no se atribuyen íntegramente a PostgreSQL. Las pruebas de 10/50/100 usuarios se ejecutarán en un backend aislado con credenciales de prueba, evitando activar emails, pagos y jobs externos.

## Corte y rollback

1. Obtener el respaldo total, verificar artefactos y restauraciones antes de cambios de infraestructura.
2. Preparar PostgreSQL local privado, roles mínimos y `pg_stat_statements`; restaurar el primer dump público, comparar datos/catálogo y probar Auth/lecturas/escrituras con el rol de aplicación.
3. Medir backend antes/después en condiciones equivalentes. Revisar índices con `EXPLAIN (ANALYZE, BUFFERS)` y optimizar solamente rutas con problemas comprobados.
4. Abrir una ventana de mantenimiento limitada a Finix. Detener sus dos procesos y cualquier otro escritor identificado; bloquear tráfico que escriba, incluidos Socket.IO y jobs.
5. Generar dump final y validación de origen detenido, restaurar y validar destino. Actualizar de forma atómica las URLs privadas. Arrancar únicamente Finix con un proceso; comprobar health, sesión nativa/OAuth, CRUD, feed, calendario, noticias y portafolio antes de habilitar tráfico.
6. Si falla antes de reabrir tráfico: recuperar `.env` y registro PM2 previos, arrancar Finix contra Supabase y comprobarlo. No tocar los otros servicios del VPS.
7. Si ya hubo escrituras en PostgreSQL local: cerrar nuevamente el tráfico y reconciliar esas escrituras antes de regresar. Cambiar solamente la URL perdería datos nuevos; no constituye un rollback seguro.
8. Registrar ventana y resultados, habilitar backups diarios/semanales con restauración periódica y una copia fuera del VPS. Mantener Supabase operativo durante la validación posterior.

Documentación primaria: [versiones PostgreSQL](https://www.postgresql.org/support/versioning/), [pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html), [pg_stat_statements](https://www.postgresql.org/docs/17/pgstatstatements.html), [restauración de Supabase](https://supabase.com/docs/guides/self-hosting/restore-from-platform).
