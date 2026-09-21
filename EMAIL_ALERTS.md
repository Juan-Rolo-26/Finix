# Email, analisis PRO y push

## Funcionamiento

- El editor utiliza TradingView Lightweight Charts con velas de la API de mercado.
  La captura incluye ticker y fecha, se convierte a PNG y se guarda en uploads/email.
  No se captura un iframe de TradingView ni se usan precios sinteticos.
- Seleccionar un analisis agrega las secciones publicadas al HTML del correo:
  empresa, crecimiento, rentabilidad, balance, valuacion, tecnico, riesgos y escenarios.
  Se respetan las secciones ocultas. Los datos se toman de la base, no del navegador.
- Vista previa y envio usan el mismo renderizador. Enviar prueba no crea campanas.
- La primera publicacion de un analisis crea la campana dentro de la misma
  transaccion. Editar o republicar no vuelve a anunciarlo. La migracion marca los
  analisis ya publicados para evitar un envio masivo retroactivo.
- Destinatarios: PRO activos, email verificado y consentimiento de inversion.
  Se comprueban nuevamente las preferencias antes de enviar.
- La cola prepara audiencias en lotes de 500 y envia lotes de 5. Las reservas
  persistentes evitan que dos instancias PM2 procesen el mismo destinatario.
  Reintentos exponenciales, maximo 5. Despues de 23 horas de un intento incierto,
  requiere conciliacion manual, porque Resend conserva idempotencia por 24 horas.
- La baja usa un enlace firmado y confirmacion POST; los escaneres de enlaces
  no cancelan una suscripcion por abrir un GET.
- Push consulta las notificaciones persistentes, no requiere una pestaña abierta.
  Cada dispositivo tiene su suscripcion; no se pueden reasignar endpoints a otra
  cuenta. Los avisos en pantalla bloqueada son genericos por privacidad.

## Activacion en el servidor

1. Respaldar la base y aplicar la migracion con el deploy habitual:
   `npx prisma migrate deploy --schema apps/api/prisma/schema.prisma`.
2. Mantener inicialmente `EMAIL_SEND_ENABLED=false`. Revisar las campanas
   pendientes antes de habilitar envios: las antiguas programadas tambien pueden
   procesarse al activar la cola.
3. Configurar `RESEND_API_KEY`, dominio verificado en `EMAIL_FROM`,
   `FRONTEND_URL` y `API_URL` (origen publico sin sufijo /api).
4. Generar VAPID una sola vez con `npx web-push generate-vapid-keys`.
   Guardar `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y
   `VAPID_SUBJECT=mailto:contacto@tu-dominio` en el entorno del backend.
   No regenerar las claves en cada deploy.
5. Reiniciar/reload API con entorno actualizado. Confirmar que /uploads/email
   apunta al almacenamiento persistente de apps/api/uploads.
6. Probar un email de prueba; despues habilitar `EMAIL_SEND_ENABLED=true`
   cuando corresponda. Los emails de autenticacion conservan su flujo actual.
7. En Configuracion > Notificaciones activar este dispositivo y enviar prueba.
   En iPhone/iPad se requiere una web app agregada a la pantalla de inicio y
   iOS/iPadOS 16.4 o posterior. HTTPS es obligatorio excepto localhost.

## Verificacion aislada

No usa Supabase ni Resend real:

```bash
docker run --rm -d --name finix-email-tests -e POSTGRES_PASSWORD=local-test-only -e POSTGRES_DB=finix_test -p 127.0.0.1:55439:5432 postgres:16-alpine
npm run build -w api
node --test scripts/email-delivery.test.cjs
docker stop finix-email-tests
```

El test borra SOLAMENTE el schema de esa base temporal fija, instala el schema
del HEAD anterior y aplica la nueva migracion SQL. No apuntarlo a datos reales.

## Limites y operacion

- SENT significa aceptado por el proveedor, no entrega/apertura comprobada.
  No se muestran aperturas o clicks inventados; requiere integrar eventos del
  proveedor para esas metricas.
- El widget completo de TradingView y Lightweight Charts son productos distintos.
  Este editor permite zoom/desplazamiento y captura de velas, no todas las
  herramientas de dibujo del widget.
- El sistema push necesita permiso del usuario y conectividad; el sistema
  operativo decide la presentacion. No se garantiza entrega inmediata.
- Un dispositivo deshabilitado tras 5 fallos puede reactivarse desde Configuracion.
- No hay automatizaciones ficticias para Daily, earnings ni calendario.

Referencias: [captura de graficos](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi),
[idempotencia Resend](https://resend.com/changelog/idempotency-keys),
[Web Push iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).
