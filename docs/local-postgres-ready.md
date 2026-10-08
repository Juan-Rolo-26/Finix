# Finix local con PostgreSQL

Chequeo posterior de Google, Resend, admin, proveedores e IA:
[informe del 7 de octubre](configuration-audit-2026-10-07.md).

Preparación posterior de Redis, deploy y recuperación:
[verificación para VPS](vps-readiness-2026-10-07.md) y
[paso a paso actualizado](database-local-vps.md).

Estado del 7 de octubre de 2026. La API local usa PostgreSQL en esta computadora;
el VPS y la base remota de Supabase no se modificaron.

## Abrir y ejecutar

| Servicio | Dirección |
|---|---|
| Web | http://localhost:5173 |
| Admin | http://localhost:5147 |
| Correos de prueba | http://localhost:8025 |
| Disponibilidad de API y base | http://localhost:3010/ready |
| PostgreSQL | 127.0.0.1:15432, base `finix_prod` |

Desde la raíz del proyecto, cuando los procesos anteriores estén detenidos:

```bash
npm run local
```

El comando arranca PostgreSQL, Redis autenticado y Mailpit y ejecuta API, web y admin.
Ctrl+C detiene las aplicaciones. `npm run local:stop` detiene los contenedores,
conservando sus volúmenes. Nunca usar `down -v` para detener este entorno.

Las credenciales de una cuenta de demostración, creada por el chequeo de SMTP y
navegador, están en `.local/finix/demo-account.env`. No pertenecen a una cuenta real.
Los usuarios existentes conservan sus contraseñas locales y sus IDs. Para una
cuenta sin contraseña Finix, usar «Olvidé mi contraseña» y abrir el código en
Mailpit. Esto modifica únicamente la copia local de esa cuenta.

El admin conserva sus restricciones de propietario, contraseña y segundo factor.
Sus correos de verificación se reciben en Mailpit y el TOTP original sigue usando
las claves de cifrado anteriores. No se deshabilitó la autenticación admin.

## Qué se migró y comprobó

- Se tomó una instantánea nueva de las tablas de la aplicación desde la conexión
  de Supabase en modo sesión. Se restauraron **97 tablas y 31.467 filas** y se
  compararon conteos, huellas de contenido, columnas, constraints, índices y RLS,
  sin diferencias ni objetos inválidos antes de aplicar los cambios locales.
- Se conservó `_prisma_migrations`; las migraciones históricas con SQL de SQLite
  no se ejecutaron desde cero. Se agregó una migración PostgreSQL para
  `ExternalIdentity`. El destino tiene 98 tablas públicas, 97 modelos Prisma y
  40 migraciones aplicadas.
- Se exportaron y archivaron las cinco cuentas disponibles por la API de Supabase
  Auth. Dos tenían un ID de Auth distinto del ID de aplicación: se conservó el
  ID de Finix y se archivó el ID original, sin crear cuentas duplicadas ni cambiar
  contraseñas, roles o relaciones existentes.
- Se descargaron los 12 objetos disponibles en Storage, con inventario y SHA-256.
  Los objetos públicos están bajo `apps/api/uploads/supabase/`; los privados están
  bajo `.local/finix/private/storage/`, fuera del servidor de archivos públicos.
  El panel admin accede a documentos privados por un endpoint autenticado.
- Las ocho rutas de archivos locales encontradas en los datos están presentes.
  Las imágenes de proveedores externos conservan sus URLs y requieren Internet.
- La configuración original, código con cambios pendientes, uploads y secretos
  se respaldaron antes de cambiar `.env`. `JWT_SECRET` y claves de cifrado
  existentes se conservaron.
- El esquema local de ejecución usa `finix_app`, sin superusuario, creación de
  bases/roles ni bypass RLS. Las políticas del backend permiten acceder a las
  tablas protegidas sin desactivar RLS.

Los números originales corresponden a la instantánea restaurada. El total actual
incluye la nueva migración, el archivo de identidades, la cuenta demo y cualquier
operación posterior realizada en esta copia.

## Servicios externos durante el ensayo

`FINIX_LOCAL_MODE=true` requiere una base en loopback y un entorno distinto de
producción. Desactiva cron/intervalos y precargas de inicio; evita el ajuste de
roles al arrancar. Todos los correos se envían al SMTP local de Mailpit, incluidos
registro, recuperación y admin. Las credenciales de pagos y push reales se
retiraron de la configuración local y se conservaron en el respaldo privado.

Las consultas a proveedores de mercado y las imágenes externas siguen necesitando
Internet. No se simulan cobros reales. Las compras están pausadas por el acceso
gratuito del entorno local.

## Google sin Supabase

El frontend ya no incluye el SDK de Supabase ni lo usa para restaurar o cerrar
sesiones. La API valida tokens Finix y tiene un flujo Google directo con la
biblioteca oficial, state, nonce, PKCE y verificación del ID token. Las cuentas
vinculadas se identifican por el subject estable del proveedor.

Falta proporcionar un cliente OAuth de Google. Configurar en `apps/api/.env`:

```dotenv
GOOGLE_CLIENT_ID=cliente-de-google
GOOGLE_CLIENT_SECRET=secreto-privado
GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/google/callback
```

Registrar esa URI exacta como redirección autorizada en Google Cloud y reiniciar
la API. El secreto nunca se coloca en Vite ni en Git. Mientras falten las
credenciales, el botón informa que Google no está configurado; email y recuperación
funcionan independientemente. El acceso real a Google no puede probarse sin ellas.

El inventario de Auth exportado no incluyó identidades Google. Para una cuenta
existente sin vínculo importado, ingresar con contraseña o recuperación y usar
«Vincular mi cuenta de Google» en Ajustes → Seguridad cuando Google esté configurado.
No se vincula silenciosamente otra identidad por coincidencia de email.

## Comprobaciones y backups

```bash
npm run local:check
npm run local:test
npm run local:backup
```

`local:test` usa el build de la API y ejecuta las pruebas de autenticación y una
integración con escrituras revertidas, incluyendo el flujo admin de email y TOTP.
Después de cambiar el backend, construirlo primero con `npm run build -w api`.
Las pruebas de navegador necesitan las dependencias de Chromium del entorno.

`local:backup` utiliza el cliente PostgreSQL dentro del contenedor, comprueba el
dump integral local y agrega uploads, almacenamiento privado, configuración y
secretos. Guarda el resultado bajo `.local/finix/backups/` con permisos privados.
Copiar esos respaldos fuera de esta computadora. Se comprobó una restauración
del respaldo posterior a la migración en otro volumen y puerto 55443, sin diferencias.

Los informes de esta migración están en el directorio privado:

`/home/juampi26/.local/share/finix-backups/20261007T192319Z-local-migration/`

La prueba funcional original pasó 105 comprobaciones, incluidas pantallas en
navegador, permisos y escrituras revertidas. La integración ampliada pasó 75
comprobaciones de API, incluido login admin con email y TOTP, datos administrativos
y protección de archivos privados. El smoke real confirmó login por
código SMTP, persistencia tras recarga y pantallas principales, sin peticiones a
Supabase. Los builds de API, web y admin y los tests existentes del backend pasan.
React Doctor informa advertencias anteriores en otros componentes; no se hizo un
rediseño adicional para esta migración.

## Antes del VPS

No confundir el backup local completo con un backup integral del proyecto remoto:
el dump de los esquemas gestionados de Supabase todavía falla por permisos sobre
`auth`. El export de su API conserva la información que devuelve, pero no incluye
hashes de contraseñas ni todas las tablas internas. El origen permanece intacto.

Para el corte del VPS hace falta resolver ese respaldo integral, configurar y
probar Google si se conservará ese acceso, tomar una instantánea final con todos
los escritores detenidos, migrar los archivos y reconciliar los datos creados
durante las pruebas locales. No sobrescribir producción con la copia de ensayo.
Desactivar modo local en producción y configurar allí los servicios de correo,
pagos y las URLs públicas. El despliegue ya comprueba `/ready` y no exige Supabase.
