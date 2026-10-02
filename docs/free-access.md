# Etapa gratuita de Finix

La opción del servidor `FINIX_FREE_ACCESS_ENABLED=true` habilita temporalmente
las funciones de PRO y Creator para todas las cuentas autenticadas y pausa las
nuevas compras. Si la variable no existe, el valor predeterminado es `true`.
Las credenciales de Mercado Pago y Stripe, los precios, la sección de planes,
los webhooks y las suscripciones existentes se conservan.

## Publicación

Desplegar el cambio con el procedimiento habitual de Finix. En el `.env` de la
API del VPS, mantener `FINIX_FREE_ACCESS_ENABLED=true` y recargar la API con el
ecosistema de PM2 habitual. No hace falta cambiar variables del frontend.

Comprobar `https://finixarg.com/api/mercadopago/config`: debe devolver
`freeAccessEnabled: true`, `purchasesPaused: true` y `checkoutReady: false`.
Ingresar con una cuenta básica y comprobar PRO, Creator, listas de seguimiento
y finanzas personales. Las páginas de planes muestran acceso gratuito y sus
botones llevan a las funciones o al registro, sin crear un checkout.

## Qué se pausa

- Las compras nuevas de PRO y Creator en Mercado Pago y Stripe.
- Los pagos nuevos por comunidades: el ingreso es gratuito durante la etapa.
- Los bloqueos y límites comerciales de funciones de la plataforma.

El cambio no edita masivamente el plan ni el rol guardado de los usuarios.
Las comunidades privadas conservan las solicitudes de ingreso, y administrar
una comunidad sigue requiriendo ser su dueño o contar con permisos de esa
comunidad. El modo gratuito no concede permisos de administración de Finix.

Las membresías temporales a planes de comunidad que normalmente requieren pago
se identifican con `paymentStatus=FREE_ACCESS`. No se registran cobros ficticios
ni ingresos, y dejan de conceder acceso pago cuando termina esta etapa. Las
membresías pagas existentes no se reemplazan al ingresar durante el modo gratis.

## Renovaciones existentes

Pausar un checkout de Finix **no pausa automáticamente** las renovaciones ya
programadas en Mercado Pago o Stripe. Deben revisarse en cada proveedor antes
de anunciar que no habrá más cobros. El historial y las opciones de cancelación
siguen disponibles en Configuración. Los webhooks continúan acreditando los
pagos reales que ya estaban en proceso.

## Volver a planes pagos

Cambiar `FINIX_FREE_ACCESS_ENABLED=false` en la API, recargarla y actualizar la
página del navegador. Vuelven los precios, las compras y los permisos por plan
guardados. No hace falta migrar usuarios ni reconstruir el frontend.
Las renovaciones pausadas en los proveedores deben reanudarse por separado,
según la decisión comercial y la autorización de los suscriptores.

## Validación

```bash
npm run build -w api
node --test scripts/free-access.test.cjs
npm run build -w web
# Con Vite escuchando en 127.0.0.1:5178:
node scripts/free-access.browser.cjs
```

Las pruebas de modo gratuito usan proveedores y respuestas simuladas: no crean
pagos, no envían emails y no modifican una base de datos real.
