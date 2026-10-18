# Acceso y suscripciones de Finix

`FINIX_FREE_ACCESS_ENABLED` permite habilitar temporalmente el acceso gratis y pausar las compras. Por defecto queda desactivado (`false`). Pro y Creador requieren un plan activo; sus checkouts ofrecen una prueba gratuita de 2 días y luego cobran el importe mensual con renovación automática.

## Publicación

Para habilitar ventas en producción, mantener `FINIX_FREE_ACCESS_ENABLED=false` en la API y desplegar con el procedimiento habitual de Finix.

Comprobar `https://finixarg.com/api/mercadopago/config`: debe devolver `freeAccessEnabled: false` y permitir el checkout si Mercado Pago está configurado. Verificar la prueba de 2 días y el precio mensual en las pantallas previas al checkout.

## Pruebas gratuitas

Stripe inicia el período en estado de prueba mediante `trial_period_days=2`. Mercado Pago activa la membresía al autorizar la suscripción y usa el siguiente cobro como vencimiento del período de dos días. Si no llega un pago al vencer, la conciliación expira el acceso. El usuario puede cancelar desde Configuración antes del primer cobro.

## Renovaciones existentes

Pausar un checkout de Finix **no pausa automáticamente** las renovaciones ya
programadas en Mercado Pago o Stripe. Deben revisarse en cada proveedor antes
de anunciar que no habrá más cobros. El historial y las opciones de cancelación
siguen disponibles en Configuración. Los webhooks continúan acreditando los
pagos reales que ya estaban en proceso.

## Modo gratuito temporal

Para volver a habilitar temporalmente el acceso sin costo, definir `FINIX_FREE_ACCESS_ENABLED=true` en la API. Esto pausa las compras de los planes y habilita los permisos generales del lanzamiento.

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
