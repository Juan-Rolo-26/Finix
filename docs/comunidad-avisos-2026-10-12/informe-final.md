# FINIX — Comunidad, avisos oficiales e imágenes

Implementación local en `/home/juampi26/Finix`, revisada el 12 de octubre de 2026.

## Resultado

- Avisos automáticos al crear una publicación pública de la cuenta oficial: texto, primera imagen y enlace a la publicación. La cuenta se identifica por su ID estable (`FINIX_OFFICIAL_USER_ID`), no por un nombre que otro usuario pueda adoptar.
- Campañas persistentes y sin duplicados, con reintentos y preferencias de baja. Destinatarios: usuarios activos con correo verificado que permiten comunicaciones de producto y marketing. No se envían avisos de otros autores ni de publicaciones privadas de comunidades.
- Comunidad: solicitudes privadas, aprobación/rechazo, invitaciones con límites opcionales, recursos, eventos, planes, comentarios y guardados conectados a la API.
- Membresías y cupos controlados en transacciones. Invitaciones pagas habilitan la elección de un plan, sin crear pagos ficticios. El checkout privado exige aprobación, incluido Mercado Pago.
- Creadores y administradores tienen herramientas de acceso y contenido. Moderadores ven las tareas permitidas. Se preservan roles al reingresar y se impiden modificaciones de contenido perteneciente a otra comunidad.
- Guardados persistentes; al perder acceso se muestra una tarjeta restringida y se permite quitarla. Se respetan comentarios desactivados y se muestran errores al publicar.
- Eventos guardan la fecha elegida y se muestran con horario argentino. Planes aceptan importes decimales y actualizan su lista al guardar.
- Los 12 artículos de análisis técnico tienen portadas y una imagen real dentro del contenido. Se agregaron siete ilustraciones en seis archivos, con autor, fuente y licencia. La ilustración de VWAP muestra precio y volumen; su epígrafe aclara que no incluye una línea VWAP.
- Se evitó recortar los ejes de los gráficos y repetir sus epígrafes. Verificación móvil y temas claro/oscuro.

## Verificación

- Compilación API: correcta.
- Compilación web y TypeScript: correcta.
- 26 comprobaciones funcionales de API: correctas, con datos temporales y correo simulado.
- Prueba de texto, enlaces y créditos educativos: correcta.
- En la web se verificaron aprobación de solicitud, creación de invitación, ingreso desde su enlace, creación de recurso, evento con fecha correcta, plan con decimales, comentario y guardado persistente al recargar.
- Las 12 portadas cargaron; no hubo desbordamiento horizontal en los tamaños revisados.
- La comunidad y el usuario temporal creados para comprobar la interfaz fueron eliminados. Se conservó la cuenta local original.
- Antigravity recibió la revisión desde su ventana abierta y generó `revision-antigravity.md`. Se resolvieron sus hallazgos aplicables. Para invitaciones pagas se eligió un checkout real en lugar de registrar un pago sin cobrar.

## Estado de producción

Los cambios y la configuración de cuenta oficial están en local. No se desplegó esta entrega en el VPS, no se enviaron correos reales y no se realizaron cobros.

Para activar los avisos en producción, el despliegue debe incluir API, web e imágenes; verificar el ID de la cuenta oficial existente en esa base; configurar `FINIX_OFFICIAL_USER_ID`, `FRONTEND_URL=https://finixarg.com`, el proveedor de correo con el remitente de FINIX, y `EMAIL_SEND_ENABLED=true`. Las credenciales no están incluidas en este informe. Las pruebas de proveedores de pago fueron de permisos y flujos internos; no hubo una transacción real con Stripe o Mercado Pago.

La automatización cubre publicaciones públicas de la cuenta oficial. No interpreta una modificación de código ni cualquier cambio de la web como una publicación.
