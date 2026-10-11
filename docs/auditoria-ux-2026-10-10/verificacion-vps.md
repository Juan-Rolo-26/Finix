# Validación de integración y preparación del VPS — Finix

Fecha de trabajo: 10/10/2026 (Argentina). Este documento registra controles previos a la publicación; el resultado del despliegue y su commit exacto se guardan en el registro de entrega del workspace.

## Pruebas del coordinador

- API: compilación aprobada. Jest: 19/19; pruebas Node: 112/113 aprobadas, 1 omitida porque requiere la base PostgreSQL desechable de integración; libro financiero: 8/8. Sin fallos.
- Preferencias de campañas: 2/2 consultas simuladas. Las audiencias de todos los planes y PRO respetan las preferencias de suscripción, el estado activo y el correo verificado; excluyen cuentas de ensayo.
- Administrador: compilación TypeScript/Vite aprobada.
- Autenticación local: 7/7 aprobadas, incluida la restricción del modo local a una base local y un entorno no productivo. No se omitió OTP en producción.
- Despliegue: 3/3 pruebas aisladas de publicación, rollback y preservación de otros procesos.
- Migración educativa: siete tablas nuevas, dos enums y claves foráneas aditivas; SHA256 aprobado en el registro de migraciones. Ensayo en transacción revertida, sin escrituras persistentes. Detalles en migracion-educativa.md.

Las matrices UX y sus criterios por hallazgo se documentan en el informe final de integración. Los datos financieros, sesiones y operaciones utilizados en los fixtures de navegador son simulados; estas pruebas no confirman cotizaciones ni entrega real de correo.

## Comprobaciones del VPS

- Fuente canónica: /opt/finix/source. Versiones separadas con enlaces /opt/finix/current, /var/www/finix-web/current y /var/www/finix-admin/current.
- Node 22.23.3 preparado exclusivamente para Finix. La versión global y los procesos de las otras aplicaciones permanecen fuera de esta entrega.
- /ready respondió con PostgreSQL y Redis conectados. Configuración de producción y rol de aplicación restringido aprobados en el ensayo previo.
- La migración educativa aún no estaba aplicada antes de esta entrega. Los privilegios por defecto permiten el acceso del rol de aplicación a nuevas tablas y secuencias.
- Seguimiento estaba oculto por el valor predeterminado del build productivo. Para esta entrega se configuró VITE_ENABLE_WATCHLIST=true en el archivo privado web.env, con copia previa; no se alteraron los guards JWT ni el control de pertenencia del backend.
- Google está habilitado en el endpoint de proveedores; esto no demuestra una autenticación nueva completada.
- El titular autorizó verificar los tres proveedores. FMP (perfil BXP) y Finnhub (cotización BXP) respondieron HTTP 200 y coincidieron en USD 59,05. Las seis consultas de estados y ratios FMP usadas por el adaptador devolvieron HTTP 402 (restricción de plan); Finnhub devolvió HTTP 200 en perfil, 128 campos de métricas, 22 balances reportados y cuatro resultados trimestrales. Resend rechazó la clave API con HTTP 400 «API key is invalid» y la conexión SMTP con EAUTH/535. El 11/10 el titular facilitó una clave vigente: verificada contra Resend con HTTP 200 y dominio finixarg.com verificado. Se actualizó únicamente RESEND_API_KEY en /etc/finix/api.env, con copia privada previa y sin sobrescribir parámetros de producción. Falta activar la configuración al desplegar y verificar una entrega real autorizada. No se enviaron correos reales.

## Motor de IA

La configuración apuntaba a Ollama local, pero el servicio no existía. Se instaló el contenedor finix-ollama, imagen oficial fijada por digest, modelo phi3:mini, reinicio automático y puerto 11434 únicamente en 127.0.0.1. Límites: dos CPU, 4 GiB de memoria, una petición paralela y un modelo cargado.

La prueba local de respuesta devolvió OK. Una prueba del servicio de análisis con datos sintéticos devolvió los cinco campos estructurados en 56.67 segundos. El límite anterior de 45 segundos fallaba en este VPS de dos procesadores; se configuraron 120 segundos, con copia privada previa de api.env. El cambio entra en vigor cuando se reinicia Finix durante el despliegue. No se enviaron datos de usuarios a proveedores externos.

## Evidencia y límites

Los JSON, registros de controles y una selección de capturas finales de celular/escritorio se conservan en Git. La colección completa de capturas, incluidos ensayos previos, se guarda como archivo de evidencia en outputs/auditoria-finix-2026-10-10 del workspace.

Quedan separados de la aceptación local: entrega efectiva de correo, acceso nuevo por correo/Google, cotejo con proveedores financieros y prueba física en iOS/Android. No se inventaron datos de razón social, domicilio ni jurisdicción; se omitieron por instrucción del titular.
