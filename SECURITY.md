# Finix — seguridad

Se aplican validación estricta de DTOs, Argon2, JWT, guardias de autorización, rate limiting, CORS por lista permitida, Helmet, HSTS, uploads limitados y migraciones Prisma versionadas.

Antes de producción: rotar todas las credenciales expuestas, usar secretos fuera de Git, configurar HTTPS, firewall, SSH por clave, Fail2ban, webhooks firmados y probar backup/restore. La auditoría del VPS, DNS y certificados requiere acceso al servidor y no puede certificarse desde el repositorio.
