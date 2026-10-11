# FINIX-01 — selección y privacidad del correo

Fecha: 10 de octubre de 2026. Cambios locales; sin despliegue ni envío de correos reales.

## Causa demostrada en el código anterior

- `MailService` interpretaba `SMTP_PASS` como alternativa a `RESEND_API_KEY`, mandando una contraseña SMTP al endpoint de Resend. Tener credenciales SMTP no activaba un transporte SMTP real.
- Recargaba archivos `.env` con `override: true` dentro de un envío, alterando la configuración del proceso después del arranque.
- Un rechazo de Resend imprimía destinatario, asunto y cuerpo completo del correo, incluyendo códigos de acceso, incluso en producción. También imprimía antes de comprobar que el modo fuera local.
- Las claves de un proveedor real prevalecían sobre Mailpit, contradiciendo la documentación de ensayo local que exige correos únicamente en Mailpit.

Estos defectos explican un camino reproducible hacia rechazos de credenciales y exposición de códigos. No demuestran por sí solos cuál era el valor o la validez de la clave usada por el servidor desplegado.

## Corrección

`apps/api/src/mail/mail.service.ts` usa configuración ya cargada al arrancar. `MAIL_PROVIDER=resend` o `MAIL_PROVIDER=smtp` selecciona explícitamente el proveedor fuera del modo local; sin esa variable, detecta Resend por `RESEND_API_KEY` y luego SMTP por `SMTP_HOST`. Nunca convierte `SMTP_PASS` en una clave Resend. Una selección explícita incompleta falla, sin pasar silenciosamente a otro proveedor.

SMTP usa `SMTP_HOST`, `SMTP_PORT` (587 por defecto), `SMTP_SECURE` (465 implica TLS por defecto), `SMTP_USER` y `SMTP_PASS`; valida puerto, bandera TLS y pareja usuario/contraseña y conserva los timeouts de 15 segundos. Un transporte que resuelve con rechazo de destinatario también falla. No se añadieron credenciales ni se modificaron archivos `.env`.

En producción, ausencia de configuración o rechazo de cualquiera de los proveedores devuelve un error seguro; no se imprimen códigos, cuerpos, destinatarios, claves ni errores crudos del proveedor. No existe éxito simulado ni fallback a consola/otro proveedor después de un fallo real.

`isLocalMode()` mantiene sus protecciones de base de datos local y entorno no productivo. Cuando está habilitado, el envío usa exclusivamente Mailpit en loopback aunque haya configuración de proveedores reales. Se conserva el fallback documentado de consola únicamente en este modo local validado si Mailpit no está disponible. Nunca elude OTP ni cambia tiempos de expiración, comparación de códigos, sesiones o recuperación.

## Validación

- `scripts/mail-provider.test.cjs`: 12/12 pruebas aisladas aprobadas, con `fetch` y Nodemailer simulados en todos los casos; cero envíos reales. Incluyen selección, prioridad explícita, Resend HTTP 401, error de red, rechazo SMTP, configuración incompleta, conservación de reply-to/idempotencia Resend, privacidad, Mailpit y restricciones del modo local.
- Prueba dedicada reproducible: `npm run test:mail -w api`; también incorporada al conjunto habitual de pruebas de API.
- Compilación API aprobada y 7/7 regresiones de autenticación local aprobadas. La ejecución conjunta de correo, datos financieros y notificaciones aprobó 19/19 casos.

## Límite de la validación

El acceso del sitio publicado todavía requiere desplegar el cambio y comprobar configuración/entrega del proveedor en el servidor real. No se consultó el valor de secretos, no se verificó una clave real contra Resend y no se enviaron correos de prueba reales. El error HTTP seguro no equivale a un código efectivamente entregado: frente a un rechazo el flujo sigue fallando, sin prometer éxito.
