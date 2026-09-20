# Finix Security Checklist

## Cada release

- [ ] Revisar `git diff` y ejecutar escaneo de secretos.
- [ ] Ejecutar `npm audit` en API, web y admin.
- [ ] Ejecutar lint, TypeScript, tests y builds.
- [ ] Probar acceso anónimo, usuario Basic, Pro y Admin.
- [ ] Probar ownership cambiando IDs de recursos.
- [ ] Probar payloads XSS en posts, comentarios, perfiles y comunidades.
- [ ] Probar uploads con MIME falso, extensión doble, archivo grande y path traversal.
- [ ] Confirmar que respuestas no contienen hashes, tokens ni secretos.
- [ ] Verificar expiración, logout y revocación de sesiones.
- [ ] Verificar rate limit en login, registro, códigos, uploads y contenido.
- [ ] Revisar logs para asegurar que no incluyan tokens, contraseñas o headers.

## Antes de producción

- [ ] `NODE_ENV=production` y secretos solo por secret manager/environment.
- [ ] HTTPS, HSTS, CORS allowlist y Nginx validados.
- [ ] PostgreSQL privado, SSL, pool y mínimo privilegio configurados.
- [ ] RLS y Storage policies revisadas en Supabase.
- [ ] Webhooks con firma, idempotencia y protección contra replay.
- [ ] Backups cifrados, retenidos fuera del web root y restauración probada.
- [ ] Docker ejecuta como usuario no root y sin puertos innecesarios.
- [ ] Dependencias críticas sin vulnerabilidades sin aceptar excepciones no documentadas.
- [ ] Plan de rotación de claves y respuesta a incidentes documentado.
