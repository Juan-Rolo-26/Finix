# Optimización de rendimiento de Finix

Fecha: 4 de octubre de 2026. Comparación contra `4a1625db`. Cambios implementados en el repositorio, sin commit, push ni despliegue en el VPS.

## Resultado y alcance

La auditoría encontró carga inicial innecesaria, consultas repetidas de membresías, mantenimiento de noticias ejecutado durante lecturas, llamadas externas duplicadas y animaciones que retrasaban el siguiente pintado. Se corrigieron esos recorridos y se añadieron paginación, cachés limitadas, carga progresiva y configuración de producción.

Finix utiliza **React 18 + Vite 5, NestJS 10 y Prisma 5 sobre PostgreSQL/Supabase**. No utiliza Next.js. Se conservó esta arquitectura; Server Components, ISR y `next/image` requerirían una migración ajena a esta optimización. La SPA mantiene sus rutas, metadatos y permisos.

Las mejoras están medidas con builds de producción y pruebas locales. **No representan métricas de la nueva versión en producción ni datos de usuarios reales.** El VPS sigue sirviendo el commit inicial: `/health` respondió `environment: production` y `status: ok`.

## Auditoría previa

Se inventariaron las consultas Prisma, loops, `findMany` sin `take`, llamadas externas y configuración de Vite, Nginx y PM2 antes de modificar el código. La inspección posterior enumera 402 rutas de controladores. El análisis estático inicial encontró 501 sitios de consultas Prisma, 10 sitios dentro de loops, 93 candidatos sin límite explícito y 15 llamadas `fetch` sin una señal explícita. Son candidatos, no una lista automática de defectos: incluye tests, historiales necesarios para contabilidad, búsquedas por conjuntos acotados y consultas por nivel de árboles.

El N+1 principal de comunidades era indirecto: cada tarjeta volvía a consultar el usuario y su membresía dentro de un helper. Una búsqueda de loops por sí sola no lo detectaba. `getTopTraders()` ya consultaba diez usuarios mediante una consulta y una caché de cinco minutos; se conservó su cálculo y se invalidó esa caché al editar el perfil.

Las lecturas reales de la base mostraron que la latencia entre este equipo y Supabase dominaba. PostgreSQL ejecutó las consultas pequeñas de feed y ranking en aproximadamente 1,4 ms y 0,073 ms, respectivamente, mientras los recorridos del servicio tardaban segundos. Se distinguió ejecución SQL de tiempo de red/cliente para evitar atribuir todo a los índices.

| Problema | Causa | Cambio |
|---|---|---|
| Comunidades con N+1 | Actor y membresía consultados por tarjeta | Actor autorizado una vez y membresías/planes en lote; sin `COUNT` que la respuesta no utiliza |
| Noticias lentas aunque estuvieran completas | Contar, verificar y reparar slots en cada lectura | Leer primero, reparar sólo huecos reales; caché pública e invalidación editorial |
| Importación de noticias con búsquedas por artículo | Dedupe por hash y categorías repetidas | Hashes en lotes de 500, categorías una vez y fuentes reutilizadas por lote |
| Requests de cotizaciones simultáneos | Sin compartir consultas al proveedor | Caché por símbolo y solicitudes pendientes compartidas; endpoint batch |
| Historiales y movimientos excesivos en el navegador | Actividad completa para mostrar unas filas | Cursor de movimientos, primera página de 12; resumen de perfil de 6; CSV completo sólo al exportar |
| Feed sin continuación real | Primera descarga y caché de sesión sin aislamiento adecuado | Páginas de 20, cursor, sentinel y botón; memoria limitada por cuenta, cancelación y reintento |
| Contadores duplicados | Navegación de escritorio/móvil con pollers independientes | Un poller por cuenta y recurso, pausa al ocultar la pestaña y refresh al volver |
| SDK, modales y pestañas incluidos temprano | Imports estáticos y componentes montados estando cerrados | OAuth, buscador, historias, diálogos y pestañas secundarias bajo demanda |
| Configuración de build distinta de la revisada | `vite.config.js` antiguo tenía prioridad sobre `.ts` | Scripts web/admin seleccionan explícitamente `vite.config.ts` |
| Muchos chunks pequeños tras dividir código | Iconos y motion fragmentados | Chunks compartidos explícitos de React, iconos y motion, comprobados en navegador |
| Interacción lenta al cambiar tema y ancho | Transiciones para todos los descendientes y animación de layout | Transiciones por control; ancho/padding inmediatos, animaciones de progreso con transform |
| Validación de upload bloqueante | Leer el archivo completo de forma síncrona para inspeccionar la firma | Leer asíncronamente sólo los primeros 16 bytes y cerrar el descriptor |
| Procesos duplicando jobs/broadcasts | Dos workers con Socket.IO, cachés y cron locales | Un proceso por defecto; escalar requiere coordinación compartida |

## Frontend y navegación

- Un error de una página se resetea al navegar a otra; respuestas incompletas del tablero de mercado conservan el último estado válido o muestran recuperación.
- El layout y su `Outlet` tienen límites de Suspense separados: un cambio de página no desmonta toda la navegación mientras descarga código.
- Prefetch de código al apuntar/enfocar enlaces de secciones principales, incluidas las rutas reales de Seguimiento y alias de Calendario; se omite en `Save-Data` y conexiones 2G. No solicita datos privados de otras páginas.
- Mercados carga las pestañas secundarias y TradingView cuando se utilizan. Portafolio carga el modal de transacción y métricas avanzadas al abrirlos.
- Métricas y primera página de movimientos se muestran independientemente. Una respuesta tardía de otra cuenta o cartera se descarta.
- Feed y stories usan claves por cuenta, cachés breves y cancelación. La denegación del feed limpia sus datos guardados. Las suscripciones compartidas se eliminan al desmontar.
- Se conserva el SDK de OAuth para su flujo, sin descargarlo al restaurar una sesión JWT nativa de Finix. Un fallo de descarga del SDK no impide cerrar la sesión local.
- Las noticias de demostración quedan limitadas a desarrollo con `VITE_ENABLE_DEMO_DATA=true`; en producción `/news` y `/news/slots` consultan el backend real. No se presentan muestras como información reciente.
- Admin carga páginas y layout por separado y conserva el guard de sesión, incluyendo redirección por 401 y rechazo por 403.
- Inter variable Latin normal/italic se sirve localmente, con `font-display: swap`, archivos con hash y licencia OFL. Se mantiene Inter y sus pesos. Caracteres fuera del subconjunto Latin utilizan fuentes de respaldo.
- El logo pequeño pasó de 106.886 a 6.846 bytes en WebP sin pérdida; se generaron iconos PWA de tamaños correctos. Imágenes del feed fuera de pantalla usan carga diferida.

## Endpoints y consultas

Prefijo público habitual: `/api`.

| Recorrido | Optimización / contrato |
|---|---|
| `GET /communities`, comunidades del usuario y detalle | Autorización vigente; actor reutilizado y membresías en lote; límite de descubrimiento conservado |
| `GET /posts/feed` | Límite 1–50, orden estable fecha/ID, filtro de seguidos en PostgreSQL, caché 15 s y payload del gráfico sin su estado congelado completo |
| Feed de comunidades | Conserva su recorrido con permisos; las publicaciones de comunidades no se mezclan en el feed general |
| `GET /notifications` | Límite 1–50; cursor en el último registro entregado, evitando saltar un elemento |
| `GET /market/quotes?symbols=...` | Nuevo batch de hasta 100 símbolos; Sidebar reúne sus cotizaciones en una sola petición |
| Cotizaciones, velas y búsqueda de mercado | Trabajo concurrente compartido, TTL y tamaño máximo; respuestas sin velas no se guardan |
| `GET /news/slots/categories`, `/category/:slug`, `/headlines` | Caché 60/15/15 s; headlines limitado a 20; invalidación en edición/publicación/despublicación, relleno y sync |
| `GET /calendar/home` | Caché 15 s por semana vigente; se invalida por creación/edición/eliminación manual |
| `GET /portfolios/:id/movements` y movimiento público | Cursor fecha/ID, límite máximo 100; `pagination=true` entrega movimientos/cursor/continuación; clientes anteriores reciben un array limitado |
| `GET /portfolios/:id/performance` | Comparte sólo trabajo simultáneo; comprueba propietario en cada solicitud; no guarda valoraciones privadas terminadas |
| `GET /users/search` y rankings | Caché de búsqueda limitada; invalidación al editar perfil; índice que coincide con ranking público |
| Uploads web/admin y proxy de imagen | Firma con lectura parcial asíncrona; timeout de proxy; mismas validaciones de contenido |
| TradingView/Finviz, análisis y Mercado Pago | Deadlines explícitos: 6 s para consultas de datos, 8 s para proxy, 15 s para proveedor de pagos; sin reintento automático de mutaciones |

Se conservaron los historiales completos **internos del servidor** utilizados para rendimiento, aportes/retiros, conversiones y contabilidad. Limitarlos habría alterado resultados financieros. La exportación de CSV recorre todas las páginas solicitadas expresamente por el usuario.

## Política de caché

| Datos | TTL / alcance | Invalidación y límites |
|---|---|---|
| Feed API | 15 s; por parámetros/usuario | 300 entradas; mutaciones existentes invalidan; una lectura pendiente no repuebla tras invalidar |
| Primera página del feed web | 15 s; cuenta y pestaña | 12 entradas; memoria; cancelar/reintentar, limpiar por denegación y al agregar publicaciones |
| Stories web | 30 s; cuenta | Estado aislado por cuenta y descarte de respuestas antiguas |
| Cotizaciones | 15 s; símbolo | 2.000 entradas; indisponibilidad sólo 2 s; se conserva la fecha original del proveedor |
| Velas | 60 s | 200 entradas por capa; no cachear vacío y compartir misses |
| Dólar | 60 s existente | Misses compartidos; indicador de antigüedad preservado |
| Búsqueda de mercado | 24 h | 300 entradas |
| Noticias | Categorías 60 s, slots/headlines 15 s | 1/40/20 entradas; edición y jobs invalidan |
| Calendario de Inicio | 15 s | 2 semanas; clave cambia al iniciar la nueva semana; edición manual invalida |
| Búsqueda pública de usuarios | 60 s | 200 entradas; edición de perfil invalida |
| Rankings de usuarios | 5 min existente | Edición de perfil invalida; no caché de permisos |
| Performance privada | Sólo concurrencia, TTL 0 | Propietario validado por solicitante; no reutilización de valoraciones terminadas |
| Assets con hash | 1 año immutable | Nombre cambia con contenido; recursos sin versión revalidan después de 1 h |

`TtlCache` limita entradas mediante LRU, comparte loaders simultáneos, no guarda errores y utiliza una generación para impedir que una respuesta antigua restaure datos después de invalidar. Es local al proceso. No hay caché HTTP compartida para datos financieros privados ni permisos.

## Índices

Se agregaron exclusivamente:

1. `User_public_ranking_idx`: `(isProfilePublic, showStats, totalReturn DESC)`. Coincide con los filtros de visibilidad/estadísticas y orden del ranking de diez usuarios.
2. `Follow_following_follower_idx`: `(followingId, followerId)`. La PK existente está en el orden inverso; este índice ayuda a buscar seguidores entrantes y al filtro de usuarios seguidos.

El índice compuesto propuesto para el feed fue **descartado**: en la prueba PostgreSQL eligió el índice existente por fecha y no hubo ganancia. No se añadió su costo de mantenimiento.

Las migraciones `20261004010000_public_ranking_index` y `20261004010100_incoming_follows_index` contienen una sentencia concurrente cada una. Se separaron porque PostgreSQL ejecuta múltiples sentencias enviadas juntas en una transacción implícita y `CREATE INDEX CONCURRENTLY` requiere ejecutarse fuera de una transacción. [Documentación de PostgreSQL](https://www.postgresql.org/docs/18/protocol-flow.html#PROTOCOL-FLOW-MULTI-STATEMENT), [CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html).

Se probaron en PostgreSQL 16 desechable, con Prisma Migrate y con repetición idempotente. **No se aplicaron en Supabase de producción.** Planes y tiempos están en [indexes.json](performance/2026-10-04/indexes.json).

EXPLAIN ANALYZE en PostgreSQL local con 100.000 posts, 50.000 usuarios y 100.000 relaciones, mediana de tres ejecuciones sobre datos sintéticos calientes:

| Consulta | Antes | Después | Plan final |
|---|---:|---:|---|
| Ranking público | 4,299 ms | 0,165 ms | Index Scan del índice nuevo |
| Seguidores entrantes | 6,968 ms | 2,337 ms | Index Only Scan del índice nuevo |
| Feed (control, sin índice nuevo) | 0,219 ms | 0,189 ms | Índice existente por fecha |

Son planes de una estructura mínima con los mismos predicados, no un pronóstico de la base de producción. Prisma Migrate aplicó ambas migraciones y una segunda ejecución no encontró pendientes; ambos índices resultaron `indisvalid=true` e `indisready=true`. [Log de migración](performance/2026-10-04/migration-validation.txt).

## Mediciones antes/después

Condiciones y las tres repeticiones están en [metrics.json](performance/2026-10-04/metrics.json). Se utilizaron los mismos datos sintéticos y servidor fixture para ambas versiones: 45 posts de texto, primera página de 20, JWT nativo de prueba, API a 40 ms y configuración de acceso a 250 ms. Medianas de tres ejecuciones por versión.

### Lighthouse 12.8.2, móvil con throttling simulado

| Métrica | Antes | Después |
|---|---:|---:|
| Performance | 66 | 76 |
| LCP | 11.789 ms | 4.302 ms |
| FCP | 2.421 ms | 2.535 ms |
| TBT | 280 ms | 286,5 ms |
| CLS | 0 | 0 |

LCP mejoró aproximadamente 64%. **FCP móvil no mejoró en esta serie**: aumentó unos 114 ms. TBT permanece próximo al inicial. El LCP final todavía supera 2,5 s en estas condiciones; no se declara que todos los Core Web Vitals estén aprobados.

### Navegador de escritorio, sin throttling

| Métrica | Antes | Después |
|---|---:|---:|
| Primera publicación visible | 1.162 ms | 483 ms |
| LCP | 1.464 ms | 984 ms |
| FCP | 324 ms | 268 ms |
| TTFB del servidor local | 1,0 ms | 1,0 ms |
| CLS | 0 | 0,0013 |
| Requests iniciales | 54 | 36 |
| Requests de JavaScript | 32 | 20 |
| JavaScript gzip descargado | 275.633 bytes | 199.929 bytes |

La publicación apareció aproximadamente 58% antes; requests bajaron 33% y JavaScript transferido 27%. CLS fue 0,0013 en la versión nueva, siempre por debajo de 0,1 en estas tres ejecuciones. **El TTFB local no demuestra mejora del VPS ni de Supabase.**

### Navegación entre secciones

Se recorrieron Mercado, Portafolio, Noticias, Análisis, Calendario, Comunidades y Seguimiento con el build de producción, primero con código frío y luego caliente. El fixture usa datos vacíos y una falla 503 de mercado, por lo que se mide el shell y recuperación, no carga completa de información financiera.

| Mediana del recorrido | Antes | Después |
|---|---:|---:|
| Shell con código frío, incluido wait de 200 ms | 225 ms | 248 ms |
| Shell con código caliente, incluido wait de 200 ms | 231 ms | 232 ms |
| Frames muestreados con Sidebar oculta durante las siete transiciones frías | 39 | 0 |

El tiempo frío puede aumentar al diferir código; el tiempo caliente permanece parecido. La mejora comprobada es que la navegación permanece visible durante la carga y el prefetch por intención puede anticipar ese código. No se promete que la información remota llegue instantáneamente. [Detalle de navegación](performance/2026-10-04/navigation.json).

### Interacción

INP medido con `web-vitals` 4.2.4: tres sesiones independientes, CPU ×4, doce clics de tema/Sidebar y apertura del buscador. Mediana **2.776 → 512 ms**, aproximadamente 82% menos. Son interacciones reales de Chromium en laboratorio; no es INP de campo ni TBT renombrado. El resultado final todavía necesita trabajo para alcanzar 200 ms con CPU ×4; el pintado del cambio de tema fue el caso más lento.

### Bundles de producción

| Gzip | Antes | Después |
|---|---:|---:|
| Web: entry + imports estáticos | 204.755 bytes | 77.163 bytes |
| Admin: entry + imports estáticos | 179.651 bytes | 57.759 bytes |
| Web: todo el JavaScript de todas las rutas | 822.765 bytes | 817.125 bytes |
| Admin: todo el JavaScript de todas las rutas | 179.651 bytes | 207.807 bytes |

Se distingue entry de dependencias y de código cargado por la ruta. La aplicación completa no perdió funcionalidades para reducir su entry: el total web permanece parecido y el total comprimido admin creció al comprimir chunks separados. La mejora es entregar cada parte cuando se necesita. [Detalle de bundles](performance/2026-10-04/bundles.json).

### Backend

Servicios de las dos revisiones ejecutados en este equipo contra **la misma base remota**, sin escrituras, con instrumentación real de eventos SQL de Prisma. Los tiempos incluyen red, pool y cliente; son muestras individuales, no percentiles de carga. El fixture de noticias desactiva traducción/escritura para medir exclusivamente lectura de cinco slots completos.

| Servicio | SQL antes → después | Tiempo antes → después |
|---|---:|---:|
| Noticias ETF, primera lectura | 18 → 10 | 4.140 → 2.539 ms |
| Noticias ETF, segunda lectura | 18 → 0 | 5.079 → 0,01 ms |
| Feed reciente, seis posts existentes | 8 → 8 | 2.343 → 2.336 ms |
| Comunidades admin, sin comunidades en DB | 12 → 8 | 4.023 → 1.787 ms |

No se atribuye una ganancia al feed frío: número de SQL y tiempo se mantienen. La base real pequeña tampoco demuestra el N+1 con veinte comunidades; se midió aparte mediante un fixture controlado.

| Fixture determinista | Antes | Después |
|---|---:|---:|
| 20 comunidades, operaciones Prisma, pool de 4 y demora de 5 ms | 43 / 65,8 ms | 3 / 16,7 ms |
| 30 peticiones concurrentes de cotizaciones + una caliente | 31 llamadas externas | 1 llamada externa |
| Cotizaciones calientes | 30,3 ms | 0,056 ms |

Las 43/3 son **operaciones Prisma**, no sentencias SQL. [Datos de backend](performance/2026-10-04/backend.json). Las primeras lecturas HTTP de la versión desplegada se registraron como contexto, pero no se compararon con tiempos de servicio como si fueran el mismo ensayo.

## Producción

- Nginx de VPS y contenedor validaron sintaxis con Nginx 1.24. La prueba del VPS utilizó certificados desechables y rutas/puertos locales equivalentes.
- Se habilitó HTTP/2, keep-alive y gzip de nivel 4 con mínimo de 1 KB. Gzip de respuestas JSON ya estaba activo en el VPS; se conserva.
- Sólo assets/font con hash son `immutable`. Chunks inexistentes devuelven 404. HTML, service worker y release continúan sin caché permanente; logos y manifiestos sin hash pueden actualizarse.
- Proxies API y WebSocket conservan su configuración; no se introdujo caché compartida de datos privados.
- PM2 queda en un proceso, con `NODE_ENV=production` y límites de memoria existentes. Evita cron duplicado y broadcasts aislados. Redis/adapter de Socket.IO, coordinación de jobs y caché distribuida son requisitos para aumentar workers con seguridad.
- `deploy.sh` ya valida `NODE_ENV`, aplica migraciones, carga el ecosystem y prueba Nginx. No se ejecutó durante este trabajo.

## Validación funcional

- Builds de producción: web, API y admin aprobados; TypeScript de web/admin incluido.
- Prisma: schema válido y las nuevas migraciones aplicadas en una base desechable con `prisma migrate deploy`.
- 68 pruebas Node: caché/concurrencia/invalidation, permisos, cursores, datos financieros faltantes, proveedor de pagos, localización, noticias/imágenes, envíos idempotentes y uploads parciales.
- 21 pruebas contables/integración con PostgreSQL desechable, JWT real y API Nest local: ARS/USD, cuotas, reintegros, importación, privacidad y planes. La prueba de bloqueo FREE se ejecuta expresamente con acceso gratuito desactivado.
- Navegador: recuperación del tablero incompleto y navegación a otra sección después de un error de render; feed con 45 filas sin duplicados, cambio de cuenta, cancelación, recuperación tras errores, revocación, pollers y logout aun sin SDK; acceso gratuito y restauración de modo pago; noticias completas y fotos de respaldo en escritorio/móvil; calendario semanal y español; seguimiento y gráficos por activo; benchmark y resumen de portafolio; admin con páginas lazy y guard 401/403.
- Claro/oscuro, móvil y respuestas tardías se cubrieron en las suites de navegador pertinentes. Las mediciones de bundles también se abrieron en Chromium para detectar ciclos de inicialización.
- React Doctor se ejecutó sobre cambios y sobre los archivos seleccionados completos. La segunda modalidad pasó de 39 a 56 puntos y de 27 errores a un diagnóstico de cleanup. Se corrigieron hooks bajo retorno condicional, timers y animaciones de layout. El diagnóstico restante corresponde al listener compartido de `useUnreadCount`: su cleanup vive en `state.stop()` y se invoca al salir el último suscriptor, comprobado con la prueba de desmontaje. No se ocultó con configuración. La última revisión dirigida de Markets/layout/prefetch no encontró errores (83 puntos sobre esos tres archivos). Persisten advertencias de complejidad, accesibilidad y almacenamiento JWT ya presentes, que no equivalen a una aprobación global del analizador.

Las últimas mediciones Lighthouse oscilaron entre 72 y 79 puntos y TBT entre 214,5 y 413 ms; se informan medianas, sin seleccionar la mejor corrida.

Un script antiguo de email del admin (`email-editor.browser.cjs`) usa etiquetas de una interfaz anterior y falla antes de abrir el editor. No se presenta como aprobado: se añadió una prueba de humo vigente para las páginas admin modificadas; las pruebas de entrega/email del backend pasan. No se hicieron envíos reales, operaciones de pago ni publicaciones en producción.

## Pendientes y límites prácticos

1. Desplegar y aplicar las **dos** migraciones en el VPS; después comprobar índices `indisvalid`, PM2 con una instancia, `/health`, rutas y headers. La versión pública todavía no incluye estos cambios.
2. Medir en el VPS con el volumen real: latencias p50/p95 de HTTP/SQL, memoria, CPU y WebSockets. Este trabajo mide concurrencia controlada, no demuestra capacidad con miles de usuarios.
3. Añadir RUM de LCP/INP/CLS cuando se defina su persistencia/consentimiento; datos de laboratorio no reemplazan Core Web Vitals de usuarios reales. Priorizar pintado del tema en dispositivos lentos y carga crítica móvil (FCP/LCP aún mejorables).
4. Resolver la latencia regional VPS–Supabase y evaluar agrupación de las consultas relacionales de Prisma. No se habilitó una opción experimental de joins globalmente para cambiar cientos de consultas sin pruebas específicas.
5. Coordinar Socket.IO, cron y caches con servicios compartidos antes de escalar horizontalmente. Un solo proceso preserva coherencia, pero limita paralelismo de CPU.
6. El análisis estático todavía señala 93 `findMany` sin `take`. Varios están acotados por conjuntos/rangos o son cálculos internos completos; otros, como snapshots grandes, conexiones del perfil y grandes listados de seguimiento, requieren paginación de producto o agregados del servidor antes de poder recortarlos sin pérdida funcional.
7. El cron macro mantiene su búsqueda legacy de deduplicación por evento; agruparla requiere conservar la coincidencia aproximada y concurrencia con edición manual. Comprobaciones de consentimiento/envío y colisiones de slug siguen por operación por su semántica. Las respuestas de comunidades y la deduplicación de noticias, principales N+1 de lectura/importación medidos, sí se agruparon.
8. Componentes grandes, editor admin antiguo y ciertas advertencias de accesibilidad quedan identificados. No se reescribieron pantallas completas sólo para mejorar un score estático.

## Archivos y reproducción

[Inventario completo](performance/2026-10-04/modified-files.txt), [auditoría previa](performance/2026-10-04/audit-before.json), [auditoría posterior con rutas](performance/2026-10-04/audit-after.json), [validaciones](performance/2026-10-04/validation.txt).

Los cambios principales se encuentran en `apps/api/src/{communities,posts,news,market,portfolio,user,calendar,notifications}`, `common/ttl-cache.ts`, `uploads/read-file-header.ts`; los hooks `useCursorFeed`, `useUnreadCount`, `usePortfolioDetails`; layout/App/auth/API web; páginas Dashboard/Markets/Portfolio; App/layout admin; CSS, fuentes y logos; las dos migraciones; Vite/package scripts; Nginx y ecosystem de PM2. El inventario enumera también cada sustitución de logo.

Herramientas reproducibles en `scripts/performance/`:

- `audit.cjs`: inventario estático sin conectar a DB.
- `backend-benchmark.cjs 4a1625db /tmp/backend.json`: fixtures sin DB. `--database` añade lecturas con guard que rechaza escrituras y sin imprimir credenciales ni parámetros.
- `bundle-benchmark.cjs <web-anterior> <web-actual> <admin-anterior> <admin-actual> /tmp/bundles.json`: entry y cierre de imports estáticos, además del total.
- `fixture-server.cjs <dist-absoluto> <puerto>` y `load-benchmark.cjs <puerto> <prefijo-salida>`: API sintética identificada para comparar bundles. El fixture nunca debe publicarse ni usarse como API real.
- `interaction-benchmark.cjs <url-fixture-local> <web-vitals.iife.js> /tmp/inp.json`: interacciones con CPU ×4; `web-vitals` se usa sólo en laboratorio y no se agregó como dependencia de producción.
- `index-benchmark.cjs finix-performance-postgres /tmp/indexes.json`: exclusivamente contenedor desechable, datos sintéticos y EXPLAIN ANALYZE; no acepta una conexión de producción.
- `navigation-browser.cjs <salida-json> <url-fixture-local>`: rutas principales frías/calientes y permanencia del Sidebar.
- `admin-browser.cjs`: prueba de humo con requests interceptados, sin email ni publicaciones.

Para Lighthouse: versión 12.8.2, Chromium headless, performance móvil con throttling simulado, tres ejecuciones por revisión. Para validar funcionalmente, ejecutar API build **antes** de las pruebas que importan `dist`; no construir API en paralelo a esos tests porque Nest vacía esa carpeta durante el build. Los procesos, perfiles de Chromium y PostgreSQL creados para el laboratorio se limpian al finalizar.
