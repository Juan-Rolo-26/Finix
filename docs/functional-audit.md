# Verificación funcional de Finix

Fecha: 6 de octubre de 2026. Rama: `main`. Cambios y verificación locales.

## Correcciones

- «Cerrar todas las sesiones» revoca las sesiones guardadas, invalida su renovación y desconecta los mensajes en tiempo real de esa cuenta. Las otras cuentas conservan su sesión.
- Configuración, onboarding y acciones de comunidades comprueban la respuesta del servidor antes de confirmar un cambio. Ante una falla, conservan el estado y permiten reintentar.
- Las notificaciones distinguen una falla de carga de una lista vacía. Marcar como leídas requiere confirmación del servidor y respeta la categoría seleccionada. Las respuestas tardías de otros filtros no reemplazan el filtro actual.
- Las cuentas creadas mediante OAuth reciben una explicación para crear su contraseña, en vez de un error interno al intentar cambiarla. El formulario de ingreso exige los mismos ocho caracteres que la API.
- Los archivos de publicaciones que no se pueden cargar muestran un estado recuperable. Se recuperaron ocho archivos originales de Finix del servidor público: las ocho referencias locales detectadas en la copia de la base tienen ahora su archivo. Las imágenes de medios externos se contabilizaron por separado.
- La navegación de escritorio queda centrada y compacta; el avatar tiene una alternativa cuando la imagen falla. Se preserva la navegación móvil.
- La disponibilidad de Stripe comprueba sus credenciales mediante una consulta sin cobro, con tiempo límite y caché. Una clave inválida no habilita ese medio de pago. Durante la etapa gratuita no realiza esa consulta ni habilita compras.
- Se reparó la ejecución de `npm test`: dependencias de Jest, configuración y compilación previa. Los casos de calendario y ranking se ajustaron al comportamiento vigente sin modificar los criterios del producto para hacer pasar las pruebas.

## Resultados

| Verificación | Resultado |
| --- | --- |
| `npm test` | 119 aprobadas, 1 omitida, 0 fallidas: 19 de Jest, 92 de Node y 8 del libro de finanzas personales. |
| Integración con API Nest y PostgreSQL local | 105 comprobaciones, 0 fallas; todas las escrituras revertidas. |
| Recorrido incluido en la integración | 36 pantallas con sesión: inicio, explorar, mercados, seguimiento, rendimientos, calendario, noticias, análisis, portafolio, perfiles, configuración, planes, mensajes, notificaciones, comunidades, finanzas personales y páginas informativas. Sin páginas vacías, errores de JavaScript ni enlaces internos a rutas inexistentes detectados. |
| Autenticación y permisos | Registro, código de email, recuperación de contraseña, ingreso, sesión persistente tras recargar, cierre global, aislamiento entre usuarios y permisos de plan. Los emails del ensayo se capturan localmente. |
| Operaciones de usuario | Perfil, privacidad, preferencias, avatar con entrega del archivo, publicaciones, comentarios, likes, guardados, portafolio, compra, venta y rechazo de venta excesiva, listas, ingresos, edición y exportación de finanzas personales, mensajes, edición, lectura y comunidades. |
| Recuperación ante fallas en navegador | 7 comprobaciones de notificaciones, cambio rápido de filtros, comunidades y onboarding. Sin errores de JavaScript. |
| Portafolio en navegador | Recuperación automática y manual, conservación de datos ante una actualización fallida y distinción entre error y cuenta vacía. |
| Planes en navegador | Catálogo servido por la API, etapa gratuita, errores y reintentos de proveedores, ambas modalidades de renovación, retorno verificado, gestión y cancelación; 20 comprobaciones de navegación y ancho. Los cobros se simulan. |
| Buscador | Seis vistas de escritorio, modos claro y oscuro, navegación, búsquedas recientes, atajos y acciones. |
| Calendario | Actualización programada, cambio de semana, foco, reconexión, recuperación, datos y monedas de balances; títulos y descripciones en español en escritorio y móvil. |
| PostgreSQL local | 97 tablas, 22.231 filas visibles, 96 modelos legibles, 39 migraciones aplicadas; sin migraciones pendientes, índices inválidos ni restricciones inválidas. Rol de aplicación sin privilegios de superusuario. |
| React Doctor | Sin errores; 8 advertencias, puntuación 52/100. Señala complejidad de componentes, transiciones generales y una exportación. La advertencia de notificaciones sobre `finally` es un falso positivo: el restablecimiento está dentro de `finally`, protegido contra respuestas antiguas. |

La prueba omitida es la integración condicional de consultas SQL, que exige una base descartable llamada `finance_test` mediante `DATA_LOADING_TEST_DATABASE_URL`. Los flujos de API y permisos se probaron por separado contra la copia local. `npm run build` terminó correctamente para API, web, administración y paquetes compartidos.

## Configuración externa

La consulta de solo lectura al proveedor **Stripe respondió 401**. Para habilitar cobros por Stripe, reemplazar `STRIPE_SECRET_KEY` por una clave válida de la cuenta correspondiente en el entorno privado de la API y reiniciar la API. No guardar esa clave en Git. La clave rechazada no se puede reparar desde el código. La etapa gratuita vigente mantiene las compras pausadas.

La configuración de Google responde habilitada, el proveedor de email informa un dominio verificado y Mercado Pago responde a la consulta de cuenta con secreto de webhook configurado. Estas consultas no prueban la autorización final del usuario en Google, la entrega a una casilla particular ni un pago real. No se enviaron emails de prueba ni se ejecutaron cobros o cancelaciones reales.

La API habitual sigue usando la conexión configurada anteriormente; la copia local se utilizó para validar y aislar las escrituras. Esta revisión no migra el VPS. La instalación de PostgreSQL con Docker, permisos, respaldos y los pasos de migración están en [database-local-vps.md](database-local-vps.md).

Los recorridos comprueban las pantallas y operaciones indicadas. La disponibilidad futura de cotizaciones, noticias, OAuth, emails y cobros también depende de sus proveedores; las pruebas aisladas no certifican esa disponibilidad ni equivalen a una prueba exhaustiva de todas las combinaciones posibles.

## Repetir las comprobaciones

Desde la raíz del repositorio, con Node y las dependencias instaladas:

```bash
npm test
npm run build
```

Para el recorrido de navegador, iniciar la web en otra terminal:

```bash
npm run dev --workspace web -- --port 4173
```

Usar exclusivamente una copia PostgreSQL local aislada. El archivo privado debe contener su `DATABASE_URL`; el ensayo rechaza conexiones remotas y el puerto PostgreSQL habitual. Construir primero la API mediante los comandos anteriores:

```bash
FINIX_AUDIT_DATABASE_ENV=/ruta/privada/copia-local.env \
FINIX_AUDIT_BROWSER=true \
node scripts/full-web.integration.cjs
```

El ensayo usa una transacción con reversión obligatoria, reemplaza el envío de emails, elimina las claves de cobro del proceso, bloquea consultas externas mediante `fetch`, deshabilita tareas de inicio y cron y borra sus archivos temporales. No cambia las variables del proceso de API habitual. Requiere Chromium de Playwright y sus bibliotecas del sistema.

Comprobaciones específicas con respuestas controladas de API:

```bash
node scripts/functional-actions.browser.cjs
node scripts/portfolio-loading.browser.cjs
node scripts/plans.browser.cjs
node scripts/global-search.browser.cjs
node scripts/calendar-auto-refresh.test.cjs
node scripts/calendar-spanish-browser.test.cjs
```
