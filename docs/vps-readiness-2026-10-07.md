# Finix: verificación local y preparación para VPS

Auditoría del 7 de octubre de 2026 en `/home/juampi26/Finix`. No se hizo SSH, transferencia, deploy, cambio de DNS/Nginx ni prueba de carga sobre el VPS. El backend local usa PostgreSQL nativo; los navegadores no hicieron llamadas a Supabase durante el smoke.

## Resultado

- PostgreSQL 18.6, Redis autenticado y Mailpit sólo en loopback. Web 5173, admin 5147, API 3010. /ready devuelve PostgreSQL y Redis connected.
- Rol runtime finix_app sin superuser, create DB/role o bypass RLS; 98 tablas, 97 modelos y 40 migraciones, ninguna pendiente ni objeto inválido.
- Suite backend: 19 tests Jest, 100 Node y 8 de ledger aprobados; 1 condicional omitido. Builds API/web/admin aprobados.
- Integración: **138 comprobaciones** de API/pantallas/permisos/acciones/admin, sin fallos; escrituras revertidas y servicios externos deshabilitados sólo en esa prueba.
- Smoke real: **7 comprobaciones**, login por código en Mailpit, sesión tras recarga, pantallas y admin; **0 requests Supabase**, sin excepciones de navegador.
- **7 tests de operaciones**: Redis/coalescing/TTL/fallback, commit/rollback callback/array, privacidad del ranking, dry run sin mutaciones, switch/rollback real en PM2 aislado conservando otro proceso, y flujo bash con fallos simulados de build/health/publicación correcta.
- Backup nativo final completo, 24 artefactos con SHA256; restauración en volumen nuevo/puerto **15534**: **98 tablas y 31.500 filas**, sin diferencias de contenido/catálogo. Incluye 1 función(es) y 22 políticas en la comparación. El ensayo del puerto 15533 comparó además **41 archivos públicos y 3 privados**, todos iguales por SHA256. Los volúmenes de ensayo se conservan y se detienen al terminar.
- Restauración sobre destino poblado: rechazada. Retención: dry run conserva archivos, selecciona 7 períodos diarios/4 semanales/3 mensuales y bloquea borrado si el backup retenido está incompleto.
- Exportador reproducible de Supabase: 5 usuarios, 2 buckets, 12 objetos con hashes. Instalación en copia aislada sin conflictos; importación no creó cuentas duplicadas y preservó los 2 IDs Auth distintos de Finix.

La instantánea original tenía 97 tablas y 31.467 filas. El total actual incluye ExternalIdentity, demo, sesiones y operaciones locales. No equivale a una instantánea final de producción.

## Cambios

Deploy usa releases completas y ya no borra el dist del proceso activo. El dry run anterior podía hacer fetch/pull; el nuevo valida y lee. Mantiene Nginx y otros servicios. Lock propio, backup antes de migrate deploy, SQL pendiente con SHA256 revisado y bloqueo de SQL destructivo. Falla antes de publicar: código anterior intacto. Falla health después de publicar: repone pointers y solicita recarga del código previo; no restaura la DB sobre escrituras nuevas.

El ensayo real detectó que PM2 conservaba el cwd físico de la release anterior. Se corrigió usando `/opt/finix/current/apps/api` estable y cambio atómico del symlink. La primera conversión de un cwd legacy requiere FINIX_RECREATE_PM2_ONCE=true durante mantenimiento; afecta sólo finix-api. Hay un proceso: puede interrumpir brevemente. Los frontends públicos reciben permisos de lectura para Nginx y los .env siguen 600. Se probó además que la configuración de la release reemplaza valores viejos del entorno PM2/shell.

Se quitaron los dos PrismaService adicionales de Alerts/Watchlist: una instancia, pool 10. Se reemplazó el timeout Promise.race que no cancelaba escrituras por el límite real PostgreSQL de 30 segundos. Se eliminó el caché viejo del ranking para aplicar cambios de privacidad inmediatamente. Redis se usa en dashboard público con TTL 5 segundos, fallback e invalidación tras commit; no cachea ledger ni permisos. Los parámetros financieros no se añadieron a los logs de diagnóstico.

El catálogo de backup/validación ahora compara funciones y políticas, además de tablas, columnas, constraints, índices, triggers, vistas y RLS. El dump completo conserva también el resto del esquema nativo; no importa indiscriminadamente roles privilegiados del proveedor a la aplicación.

## Mediciones

8 SELECT 1 secuenciales por conexión persistente, desde esta computadora, sólo lectura y sin carga remota. No son tiempos de consultas de negocio ni un benchmark del VPS.

| Conexión | p50 | Media |
|---|---:|---:|
| Supabase, sesión | 205.18 ms | 230.21 ms |
| PostgreSQL loopback | 0.37 ms | 0.41 ms |

Comparación de servicios contra commit **4a1625db**, mismo dataset local. Incluye optimizaciones ya presentes antes de esta revisión; no se atribuyen todas al cambio de base.

| Lectura | SQL antes → después | Condición |
|---|---|---|
| Noticias ETF, primera lectura | 4 → 2 | 10 slots y 10.277 bytes en ambos |
| Noticias ETF, caliente | 4 → 0 | ~5,90 → ~0,01 ms en esta muestra |
| Feed reciente, limit 20 | 1 → 1 | ~18,73 → ~5,97 ms; mismo contenido/tamaño |
| Comunidades admin | 3 → 2 | Dataset real vacío; no representa comunidades grandes |

Fixture de 20 comunidades: 43 → 3 operaciones Prisma, ~64,70 → ~16,28 ms con demora DB simulada de 5 ms. Cotizaciones: 31 → 1 llamada al proveedor simulado para 30 peticiones concurrentes y una lectura posterior. Son fixtures, no proveedores reales.

Ensayo de índices con 50.000 usuarios y 100.000 posts/follows: ranking ~5,48–6,89 → ~0,14–0,15 ms y follows ~9,59–12,74 → ~1,51–2,07 ms. Se probaron índices ya existentes; no se agregaron duplicados al destino. EXPLAIN real confirmó índices de Post.communityId, Portfolio.userId y Transaction.portfolioId. Ranking ~0,024 ms y cartera por usuario ~0,017 ms en esta base pequeña; un Seq Scan puede ser correcto con pocas filas.

Carga local aislada: tres rondas de 10/25/50/100 peticiones simultáneas a feed, noticias y leaderboard; **1.665 respuestas HTTP 200**, ninguna escritura o red externa. Throttling se omite sólo en ese proceso. La aplicación normal conserva 429 para ráfagas por IP. Resultados con 100 simultáneas:

| Ruta | p95 | SQL en 300 requests |
| /api/posts/feed?limit=20 | 213.10 ms | 300 |
| /api/news?limit=20 | 68.89 ms | 0 |
| /api/users/ranking/leaderboard | 217.27 ms | 600 |

RSS del proceso de ensayo hasta ~314.0 MB. La API normal tenía 5 conexiones idle después de las pruebas; no es una medida del pico. Los TTL explican algunos casos con cero SQL. Esto no garantiza capacidad de 100 usuarios en el VPS.

Diez rutas HTTP reales con sesión demo, tres muestras calientes y pausas de 3,6 segundos: todas 200. Tres muestras no ofrecen percentiles robustos. Algunos ensayos compartieron recursos con builds/pruebas; el primer benchmark rápido recibió 429 y se descartó como prueba de rendimiento.

## Cobertura y pendientes

| Área solicitada | Estado |
|---|---|
| Arquitectura/inventario/esquema/roles/RLS/historial | Verificado local; React/Vite y Nest, no Next.js |
| IDs/relaciones/archivos/claves | Preservados en copia y backup, comparaciones registradas |
| Auth nativo/email local/admin/TOTP/refresh/logout | Integración y navegador aprobados |
| Google directo | Credenciales locales configuradas; providers google:true y redirección inicial HTTP 302 comprobados; falta autorizar callback en Google Cloud y probar login real |
| Resend | Clave/dominio/DKIM/sending verificados en lectura en auditoría previa; falta entrega real del VPS |
| Backup integral Supabase | API exportado; esquemas gestionados aún bloqueados por permisos SQL sobre auth |
| PostgreSQL/tuning/pg_stat_statements | Seguro y probado con perfil conservador; tuning VPS pendiente de medir recursos actuales |
| Pool/PgBouncer | Una instancia/pool 10; no se instaló pooler sin presión demostrada |
| getTopTraders/POST_INCLUDE/índices | Revisados y limitados; índices solicitados ya existentes |
| Todas las consultas/N+1/select/paginación | Inventarios generados y rutas principales perfiladas; árboles/exportaciones/carteras grandes pendientes; ledger no truncado |
| Redis/TTL/invalidación/fallback | Dashboard público probado; cachés existentes en otras lecturas conservados |
| Frontend/carga/navegación | Builds y pantallas comprobadas; no hubo rediseño adicional |
| Bash/lock/releases/review/rollback/health | Ensayos locales aprobados; VPS/health público reales pendientes |
| PM2/Socket.IO/jobs | Una instancia; PM2 aislado probado; jobs/broadcasts/reboot VPS pendientes |
| Nginx/gzip/keepalive/TLS/assets | Modelo revisado; vhost/certificados VPS no cambiados ni verificados ahora |
| Backup/restore/retención/replicación | Local probado; timer/rsync preparados, instalación/destino externo pendientes |
| Logs/EXPLAIN/antes-después/carga | Mediciones locales completadas; monitor/alertas/capacidad VPS pendientes |
| Pagos/push/IA | Compras pausadas; Stripe/VAPID incompletos; MP/mercado responden en lectura; IA local probada, VPS pendiente |
| Corte/rollback al origen | Documentado; exige copia final, escritores detenidos y reconciliación de datos nuevos |

No se afirma que Google, entrega de correo, cobros, jobs de producción, monitor externo o reboot estén aprobados con estas pruebas locales. No se eliminó Supabase. Sigue pendiente conservar íntegramente sus esquemas gestionados: la exportación API no incluye hashes ni todas las tablas Auth. Quedan warnings anteriores de frontend/lint descritos en la auditoría previa; no se promete un lint completamente limpio.

## Evidencia

- [Paso a paso del primer traslado](database-local-vps.md).
- [Operación y deploy](../PRODUCTION.md).
- [PostgreSQL](../POSTGRESQL.md).
- [Google/Resend/proveedores/IA](configuration-audit-2026-10-07.md).

Scripts: deploy.sh, backup.sh/restore.sh, ops/prepare-vps.sh, ops/deploy.env.example, ops/finix-backup.*, scripts/database, scripts/performance y tests de operaciones.

Reportes completos, claves y backups privados: `/home/juampi26/.local/share/finix-backups/20261007T192319Z-local-migration/vps-readiness/`. Backup final `native-final-validated/`; validación `final-restore.log` y `restore-validation-finix-vps-final-check-db-1.json` dentro del backup. Este documento no publica registros privados.

## Rechequeo de usuarios y puerto de desarrollo

El rechequeo posterior confirmó los **9 usuarios de Finix** del dump original (son distintos del inventario de 5 cuentas de Supabase Auth), sus IDs, emails, nombres, hashes de contraseña, roles, estados y TOTP sin cambios. Se localizaron los **31.467 registros originales de las 97 tablas** por sus claves primarias, sin registros faltantes; los datos financieros originales comparados no cambiaron. El destino incorpora filas nuevas de migración/demo/sesiones.

La API en ejecución tiene sockets hacia 127.0.0.1:15432 y /ready confirma PostgreSQL/Redis. El error de frontend en 5173 se debía a la instancia de la prueba anterior: se cerró esa copia y su watcher API duplicado, conservando el backend del usuario y el admin. El puerto quedó disponible para `cd frontend && npm run dev`. No iniciar a la vez ese comando y otro `npm run local` que también levante el frontend.

Chequeo de preservación reproducible (sólo lectura, no publica registros privados):

```bash
node scripts/database/check-preservation.cjs apps/api/.env /ruta/al/source-session /ruta/privada/preservation.json
```

Evidencia privada: `vps-readiness/preservation-recheck.json` dentro del directorio de respaldos.

## Retiro de historias

Se retiraron el carrusel, el editor y el visor de historias, la opción de crearlas en Explorar y las tarjetas/adjuntos de historias del chat. El backend ya no registra el módulo ni sus seis rutas; las solicitudes antiguas devuelven 404. Los adjuntos retirados se rechazan tanto por REST como por Socket.IO, sin crear mensajes. El historial de navegación de clientes anteriores tampoco puede reabrirlos. Las publicaciones normales continúan disponibles.

Los mensajes antiguos conservan su texto y muestran un aviso genérico si tenían un adjunto retirado. Las tablas Story/StoryView/StoryLike, sus archivos y las migraciones históricas se conservan como archivo, sin aplicar DROP, DELETE ni migraciones destructivas. Al eliminar explícitamente una cuenta desde admin, las relaciones históricas siguen la eliminación en cascada de sus claves foráneas.

Validación: builds de API y web aprobados; 93 comprobaciones de integración con rollback y servicios externos bloqueados; 8 comprobaciones en navegador a 1535 y 390 píxeles, sin consultas a historias, dos publicaciones normales simuladas y cero escrituras en la base real. React Doctor mantiene 8 advertencias de archivos preexistentes; no se afirma una auditoría global sin warnings.

El chequeo de preservación volvió a confirmar los 9 usuarios originales, los 31.467 registros de las 97 tablas, cero filas faltantes y ningún cambio en los campos protegidos de usuarios ni en los datos financieros originales. Evidencia privada: `vps-readiness/stories-removal-preservation.json`. Regresiones: `scripts/stories-removed.browser.cjs` y `scripts/full-web.integration.cjs`.
