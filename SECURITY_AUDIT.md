# Finix Security Audit

## Resumen ejecutivo

Se realizó una revisión estática de frontend, API NestJS, autenticación, Prisma, pagos, WebSockets, uploads, Nginx, Docker, variables de entorno y dependencias. Se corrigieron hallazgos de alto impacto que podían explotarse directamente sin cambiar el modelo funcional de la aplicación.

Estado: **mejorado, pero requiere validación operativa antes de declarar producción segura**.

## Hallazgos corregidos

### Alta: sincronización de noticias sin autorización

- Ubicación: `apps/api/src/news/news.controller.ts`
- Riesgo: cualquier visitante podía ejecutar el fetch de noticias y consumir recursos o disparar efectos administrativos.
- Corrección: el endpoint exige JWT y rol `ADMIN`.

### Alta: exposición de estado de pagos por ID

- Ubicación: `apps/api/src/mercadopago/mercadopago.controller.ts`, `mercadopago.service.ts`
- Riesgo: el endpoint aceptaba un `paymentId` sin autenticar y devolvía metadatos del pago.
- Corrección: exige autenticación y verifica que `external_reference` pertenezca al usuario autenticado.

### Alta: acceso WebSocket a conversaciones ajenas

- Ubicación: `apps/api/src/events.gateway.ts`
- Riesgo: un socket autenticado podía solicitar entrar directamente a cualquier room `conv:<id>`.
- Corrección: solo se une al room si el usuario autenticado figura entre los participantes.

### Alta: secreto JWT inseguro de fallback

- Ubicación: `apps/api/src/news/news.module.ts`
- Riesgo: `admin-secret` permitía una configuración accidentalmente débil.
- Corrección: se eliminó el fallback; producción debe proveer `JWT_SECRET`.

### Media: exposición de JWT en logs

- Ubicación: `apps/api/src/auth/jwt.strategy.ts`
- Riesgo: se imprimían header y payload completos del token.
- Corrección: se eliminó el log sensible.

### Media: validación insuficiente de uploads

- Ubicación: `apps/api/src/posts/posts.controller.ts`
- Riesgo: el MIME declarado por el cliente podía no corresponder al contenido real.
- Corrección: se validan firmas mágicas de JPEG, PNG, GIF, WebP, MP4/MOV y WebM; los archivos inválidos se eliminan.

### Media: hardening de proxy

- Ubicación: `ops/nginx/finixarg.com.conf`, `apps/web/nginx.conf`
- Corrección: se agregaron `server_tokens off`, bloqueo de backups/logs/certificados/configuraciones sensibles, COOP, CORP y Permissions-Policy.

## Controles existentes confirmados

- Contraseñas gestionadas con Argon2.
- DTOs y `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`.
- Admin con sesiones persistidas, expiración, revocación, MFA y `AdminGuard`.
- CORS basado en allowlist.
- Helmet habilitado en la API.
- Rate limiting global con `@nestjs/throttler` y limitación adicional en Nginx.
- Cookies admin `HttpOnly`/`Secure`/`SameSite` en el flujo admin.
- Stripe valida firma del webhook usando body crudo.
- Docker runtime de API usa usuario no root.
- `.env`, logs y uploads locales están ignorados por Git.

## Riesgos pendientes antes de producción

### Alta: token de usuario en localStorage

`apps/web/src/stores/authStore.ts` persiste el access token en `localStorage`. Esto aumenta el impacto de cualquier XSS. Migrar el flujo de usuario a cookie `HttpOnly` con refresh token rotatorio, revocación por sesión y protección CSRF/origin.

### Alta: WebSocket con token en query string

El gateway acepta `handshake.query.token`. Los tokens en URL pueden terminar en logs o telemetría. Mantener exclusivamente `handshake.auth` o cookie segura y rechazar sockets no autenticados si el evento es privado.

### Alta: Mercado Pago webhook

Debe confirmarse en producción la validación de firma/notificación del proveedor y una estrategia idempotente contra replay. No declarar pagos aprobados por datos del frontend.

### Alta: dependencias

`npm audit` detectó vulnerabilidades transitivas en API/frontend/admin, incluyendo `undici`, `ws`, `socket.io-parser`, `postcss`, `react-router` y tooling de Vite. Algunas soluciones automáticas implican upgrades major. Actualizar en una rama separada, ejecutar tests/build y revisar breaking changes antes de desplegar.

### Media: CSP

La CSP actual permite `unsafe-inline`, `unsafe-eval` y fuentes HTTPS amplias por compatibilidad con TradingView. Debe endurecerse con nonces/hashes y una allowlist exacta después de probar widgets, Supabase, fuentes, imágenes y WebSockets.

### Media: base de datos y Supabase

Verificar en el panel de Supabase que RLS esté activo en todas las tablas expuestas, que `service_role` solo exista en backend y que el usuario de runtime tenga mínimo privilegio. Esto no puede confirmarse únicamente leyendo este repositorio.

### Media: backups

No hay evidencia suficiente en el repositorio de backups cifrados, retención, restauración probada ni separación fuera del web root. Validar el procedimiento operativo.

## Secretos

No se encontraron claves reales de proveedor en el escaneo actual, pero sí scripts de desarrollo con contraseñas de prueba y `.env` locales presentes en el workspace. Aunque están ignorados por Git, deben mantenerse fuera de imágenes, artefactos y repositorio. Si cualquier valor real llegó a Git o logs, debe rotarse; borrarlo del archivo actual no basta.

## Validaciones ejecutadas

- Build API: OK.
- Build frontend: OK.
- Build admin: OK.
- `npm audit --omit=dev --audit-level=high`: reporta vulnerabilidades pendientes.
- Tests automatizados de seguridad: no existe una suite suficiente en el repositorio; deben añadirse pruebas de autorización, IDOR, rate limit, XSS, uploads y pagos antes del release.

## Checklist de producción

- [ ] `NODE_ENV=production`.
- [ ] `JWT_SECRET` aleatorio de al menos 32 bytes y sin fallback.
- [ ] Rotar cualquier secreto expuesto históricamente.
- [ ] Verificar dominio y `EMAIL_FROM` en Resend.
- [ ] HTTPS activo y redirección HTTP configurada.
- [ ] Revisar `nginx -t` y bloquear archivos sensibles.
- [ ] Confirmar RLS, SSL de PostgreSQL y mínimo privilegio.
- [ ] Configurar Redis compartido si se requiere rate limiting multi-instancia.
- [ ] Configurar backups cifrados y probar restore.
- [ ] Confirmar firmas e idempotencia de webhooks Stripe/Mercado Pago.
- [ ] Completar migración de tokens de usuario fuera de `localStorage`.
- [ ] Actualizar dependencias en rama controlada y repetir auditoría.
