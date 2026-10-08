# Chequeo de Finix — 7 de octubre de 2026

Web, API, admin, PostgreSQL y correo funcionan localmente. Se corrigieron fallas
encontradas durante el chequeo. Google tiene credenciales locales configuradas y
redirección inicial comprobada; falta autorizar el callback en Google Cloud y
probar consentimiento real. Compras, campañas
automáticas y push siguen desactivados en el ensayo. No se publicó en el VPS ni
se modificó la base original de Supabase.

| Área | Comprobación | Pendiente o alcance |
|---|---|---|
| PostgreSQL | 98 tablas, 97 modelos, 40 migraciones y 31.496 filas visibles; sin índices, constraints o migraciones inválidos | Incluye demo, sesiones y cachés. La restauración inicial conservó las 31.467 filas originales |
| Web/API | Build, disponibilidad, páginas, CRUD y permisos aprobados | Web: localhost:5173; API: 127.0.0.1:3010 |
| Registro y recuperación | Email, contraseña Argon2/bcrypt, refresh, revocación y sesión al recargar aprobados | Correos en Mailpit: localhost:8025 |
| Admin | Contraseña + email + Authenticator y todas sus páginas comprobados | La cuenta original conserva rol ADMIN, contraseña Argon2 y secreto TOTP descifrable; la prueba interactiva utilizó una cuenta temporal con rollback |
| Google | Credenciales guardadas en el env privado de la API; providers devuelve google:true; frontend redirige HTTP 302 a Google con callback local y PKCE/state/nonce | Autorizar exactamente el callback local en Google Cloud y probar consentimiento/login real; no se verificó el intercambio de código/token |
| Resend | API key original válida, dominio finixarg.com verificado, envío habilitado; DKIM y CNAME verificados | Local usa Mailpit; no se envió ningún correo real por Resend; entrega/spam pendientes de prueba |
| Mercado Pago | Credencial original válida en consulta de lectura HTTP 200 | Local sin cobros. Checkout, renovación y recepción real de webhooks no probados |
| Stripe | Credenciales y precios originales son valores de ejemplo | Necesita claves, webhook e IDs reales si se quiere activar; compras pausadas |
| Proveedores financieros | Finnhub, Alpha Vantage y FMP devolvieron datos | Prueba con AAPL; no garantiza todos los instrumentos ni futuras cuotas |
| Mercado/calendario | Cotización, seis tipos de dólar, dashboard y semana HTTP 200; fuente económica READY | Requieren Internet; cron desactivados en local |
| IA | Ollama phi3:mini disponible; análisis fundamental HTTP 200 con cinco campos JSON completos, unos 61 segundos | Timeout local aumentado a 90 segundos; las dos rutas de IA con búsqueda web no se probaron de extremo a extremo |
| Archivos | Migrados previamente con SHA-256; documentos privados y permisos conservados | Imágenes de terceros requieren Internet; no hay URLs de Storage Supabase en los datos operativos |
| Notificaciones | Sockets y notificaciones internas cubiertos | Push sin VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_SUBJECT tanto en original como local |
| Automatizaciones | Pausadas por FINIX_LOCAL_MODE=true y EMAIL_SEND_ENABLED=false | El flag de email afecta campañas; el correo transaccional sigue funcionando |

## Fallas corregidas

- El navegador del admin usaba el destino del proxy Vite y omitía `/api`.
- El código de email admin podía completar una sesión sin el Authenticator
  configurado. Ahora cada etapa exige su token específico y se solicita TOTP.
- Se bloqueó reemplazar un Authenticator existente desde el login, saltar email
  con un token de otra etapa y reutilizar un código de email consumido.
- Los errores al enviar el código admin se devuelven al cliente. El código ya no
  aparece en logs y el destinatario sigue la configuración del propietario.
- Una respuesta 429 consultando la sesión admin ya no equivale a sesión inválida.
  Se ajustó el límite de esa consulta para las verificaciones del navegador.
- FMP pasó de endpoints legacy con 403 a `stable`, campos actuales y cinco
  períodos permitidos por la cuenta. Se conservan ratios cero y se distingue P/E
  de PEG. Sus siete consultas devolvieron datos después de la corrección.
- Se desactivó la compilación incremental del backend para evitar reconstruir
  solo una parte de `dist`. `local:test` ahora compila antes de probar.
- `local` transmite SIGINT/SIGTERM al grupo de procesos API/web/admin.

## Activar Google local

Las credenciales facilitadas por el propietario ya están configuradas en `apps/api/.env`, con permisos 600 y exclusión de Git. El backend se recargó; PostgreSQL y Redis siguieron disponibles. No se publican aquí los valores. La URL de Supabase proporcionada no se utiliza en este flujo directo. Los pasos de consola y consentimiento siguen pendientes.

1. Abrir [Google Auth Platform](https://console.cloud.google.com/auth/overview).
   Configurar aplicación, soporte y audiencia. Revisar usuarios de prueba si se
   usa Testing.
2. Crear un cliente OAuth **Aplicación web** para desarrollo.
3. Registrar exactamente la redirección autorizada:
   `http://localhost:5173/api/auth/google/callback`.
4. Guardar sus valores reales en `apps/api/.env`:

   ```dotenv
   GOOGLE_CLIENT_ID=el_id_real.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=el_secreto_real
   GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/google/callback
   ```

5. Reiniciar la API después de cambiar el env; `/api/auth/providers` debe informar `google:true`. Si se usa `npm run local`, detener su instancia anterior antes de iniciarlo nuevamente.
   Probar consentimiento, callback, recarga y logout. No poner el secreto en
   variables VITE ni publicarlo en el chat/repositorio.
6. Para una cuenta existente sin identidad Google vinculada, entrar primero con
   email/recuperación y usar Ajustes → Seguridad → Vincular mi cuenta de Google.
   Esto conserva ID, datos y relaciones.

Google exige coincidencia exacta de la URI y admite localhost para ensayos.
Para el VPS usar un cliente separado de producción con
`https://finixarg.com/api/auth/google/callback` y revisar audiencia/publicación.
Ver [flujo oficial](https://developers.google.com/identity/protocols/oauth2/web-server)
y [políticas de producción](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance).

## Resend y VPS posterior

No hace falta crear otro dominio ni clave por esta migración: los actuales están
verificados. La configuración original se conserva en el respaldo privado fuera
del repositorio. Al preparar el VPS, recuperar `RESEND_API_KEY`, usar
`EMAIL_FROM=Finix <onboarding@finixarg.com>` y configurar URLs públicas de
web/admin y destinatario administrativo. Local continúa enviando a Mailpit.

La implementación productiva utiliza la API de Resend con `RESEND_API_KEY` o su
alias legado `SMTP_PASS`; los parámetros SMTP no activan ese envío.
`EMAIL_SEND_ENABLED=true` habilita campañas y no es necesario para autenticación.
No necesita el SMTP de Supabase. Ver [dominios de Resend](https://resend.com/docs/dashboard/domains/introduction).

No se encontraron MX para finixarg.com. El envío saliente no los necesita, pero
recibir mensajes en buzones de ese dominio requiere un proveedor y MX adecuados.
El contacto/admin original utiliza Gmail. La recepción entrante no se comprobó.

## Pruebas y pendientes técnicos

- Backend: **127 pruebas aprobadas** (19 Jest, 100 Node, 8 finanzas), una Node
  omitida por su condición interna; cero fallas.
- Integración: **138 comprobaciones aprobadas**, incluyendo web, admin, móvil,
  login, recarga, permisos, CRUD y sockets. Escrituras revertidas; correo y red
  externa simulados durante esa integración.
- SMTP/navegador sobre servicios locales: siete comprobaciones aprobadas, cero
  llamadas a Supabase y cero excepciones JavaScript.
- Consultas externas separadas comprobaron proveedores, mercado, calendario e
  IA según la tabla. No se realizaron pagos ni envíos externos.
- Build/TypeScript de API, web y admin aprobados. React Doctor: ocho advertencias
  en componentes existentes, 52/100; no se afirma que el código no tenga deuda.
- **ESLint no aprobado:** al admin le faltan `eslint-plugin-react-refresh` y
  `typescript-eslint` usados en su configuración; a la web le falta un
  `eslint.config.*`. Hay que corregir el entorno y luego revisar sus resultados.
- Nuevo backup local completo de base, archivos, configuración y secretos,
  verificado. Un backup nativo anterior se restauró en otra instancia aislada;
  el backup nuevo no se restauró de nuevo.
- El dump de esquemas internos gestionados de Supabase sigue limitado por
  permisos. Se preservaron las tablas Finix, el archivo de Auth y Storage; el
  origen permanece intacto. Resolver/revisar este punto antes del corte definitivo.

Evidencias privadas:
`/home/juampi26/.local/share/finix-backups/20261007T192319Z-local-migration/`.
Nuevo backup: `configuration-audit-final-backup/`.
Repetir base/API con `npm run local:check` y `npm run local:test`.
Operación y navegador: [guía local](local-postgres-ready.md).
