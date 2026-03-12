# Finix Admin

## Como funciona

El panel admin es una SPA React/Vite ubicada en `apps/admin`.

- UI admin: `apps/admin`
- API admin: `apps/api/src/admin`
- Login: `POST /api/admin/auth/login`
- Verificacion 2FA: `POST /api/admin/auth/verify-2fa`
- Sesion actual: `GET /api/admin/auth/me`

El flujo es este:

1. El usuario entra al panel admin.
2. Envía email y password contra `/api/admin/auth/login`.
3. El backend valida:
   - password del usuario
   - rol `ADMIN` o `SUPER_ADMIN`
   - `ADMIN_OWNER_EMAIL` o `ADMIN_OWNER_USER_ID` si estan configurados
   - `ADMIN_ALLOWLIST`
   - `ADMIN_IP_ALLOWLIST`
4. Si el usuario no tiene 2FA admin activo, el backend devuelve un secreto TOTP temporal para configurarlo.
5. El usuario valida el codigo de 6 digitos.
6. El backend emite cookies `httpOnly` de acceso y refresh para `/api`.
7. Las vistas protegidas del admin consultan `/api/admin/auth/me`. Si la sesion expiro, el frontend intenta `POST /api/admin/auth/refresh`.

## Requisitos para poder entrar

La cuenta que vaya a entrar al admin debe cumplir todo esto:

- existir en la tabla `User`
- tener `role = ADMIN` o `role = SUPER_ADMIN`
- tener `status = ACTIVE`
- coincidir con `ADMIN_OWNER_EMAIL` o `ADMIN_OWNER_USER_ID` si esos env estan definidos
- estar incluida en `ADMIN_ALLOWLIST` si la allowlist no esta vacia
- entrar desde una IP permitida si `ADMIN_IP_ALLOWLIST` esta definida
- tener password cargado en Finix

En este repo, el backend ya usa estas variables en `apps/api/.env.example`:

- `ADMIN_OWNER_EMAIL`
- `ADMIN_ALLOWLIST`
- `ADMIN_IP_ALLOWLIST`
- `ADMIN_TOTP_ENCRYPTION_KEY`
- `JWT_SECRET`

## Desarrollo local

1. API:

```bash
npm run dev -w api
```

2. Admin:

```bash
cp apps/admin/.env.example apps/admin/.env
npm run dev -w admin
```

3. Abrir:

```text
http://localhost:5147
```

El admin proxya `/api` a `VITE_ADMIN_API_PROXY_TARGET`, que por defecto apunta a `http://localhost:3010`.

## Hosting

Hay dos formas validas:

### Opcion A: subdominio dedicado

Ejemplo: `https://admin.finixarg.com`

- usar `VITE_ADMIN_BASE_PATH="/"`
- servir `apps/admin/dist` desde la raiz del host
- configurar `ADMIN_URL="https://admin.finixarg.com"` en la API

### Opcion B: subruta

Ejemplo: `https://finixarg.com/admin/`

- usar `VITE_ADMIN_BASE_PATH="/admin/"`
- servir el build respetando esa subruta
- el router del admin ya toma el basename desde `BASE_URL`

Build:

```bash
npm run build -w admin
```

El ejemplo de Nginx esta en `ops/nginx/admin.finix.com.conf.example`.

## Acceso admin inicial

Si una cuenta ya existe pero no tiene rol admin, promovela con Prisma o con el script:

```bash
cd apps/api
node update_admin.js
```

Despues el usuario entra con su email y password normales de Finix. En el primer ingreso, el sistema le pedira configurar TOTP y validar el codigo.

## Que hace cada pantalla

- `Dashboard`: KPIs generales
- `Users`: listado de usuarios y moderacion
- `Posts`: listado de publicaciones y moderacion
- `Reports`: reportes abiertos y resolucion

## Si algo falla

- `401` en el admin: casi siempre falta login valido o refresh expiro
- `403` en el admin: rol, owner email, allowlist o IP no autorizada
- login que nunca responde en local: revisar que la API este en `3010` o ajustar `VITE_ADMIN_API_PROXY_TARGET`
- assets rotos en produccion: revisar `VITE_ADMIN_BASE_PATH`
