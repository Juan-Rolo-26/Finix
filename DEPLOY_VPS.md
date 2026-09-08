# Deploy VPS `finixarg.com`

## URLs de producción

- Frontend: `https://finixarg.com`
- API: `https://finixarg.com/api`
- WebSockets: `https://finixarg.com/socket.io`

## Variables mínimas

### `apps/web/.env`

```env
VITE_API_URL=/api
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### `apps/api/.env`

```env
NODE_ENV=production
PORT=3001
API_URL=https://finixarg.com
FRONTEND_URL=https://finixarg.com
APP_URL=https://finixarg.com
ALLOWED_ORIGINS=https://finixarg.com,https://www.finixarg.com,https://admin.finixarg.com

# Integración Oficial de Emails (Resend)
RESEND_API_KEY=re_ejemplo_aqui
EMAIL_FROM=Finix <onboarding@finixarg.com>
CONTACT_EMAIL_TO=tucorreo@finixarg.com
```

### `apps/admin/.env`
*(Crearlo para el panel de administración)*
```env
VITE_ADMIN_API_PROXY_TARGET=https://finixarg.com/api
```

## Build

```bash
npm install
npm run build -w api
npm run build -w web
```

## Nginx

- Usá `deploy/nginx/finixarg.com.conf` (podés crear uno propio si preferís configurarlo suelto)
- Apuntá `finixarg.com` al build del frontend web (`apps/web/dist`)
- Apuntá `admin.finixarg.com` al build del admin (`apps/admin/dist`)
- Proxy `127.0.0.1:3001` para todo lo que sea `/api`, `/socket.io` y `/uploads`

## Auth

- El login/registro web usa Supabase
- Agregá en Supabase estas redirects:
  - `https://finixarg.com/auth/callback`
  - `https://finixarg.com/reset-password`

## Mail (Resend)

- Todo el motor de Resend ya viene nativo en `apps/api/src/mail/mail.service.ts`.
- Basta con poner tu `RESEND_API_KEY` en el `.env` del backend para enviar Auth, 2FA, OTPs y Notificaciones.
- Recordá agregar los registros DNS que te da Resend dentro del panel de tu dominio (en Namecheap, Cloudflare o el registrador que uses para `finixarg.com`) para validar la autoridad de envío y evitar caer en SPAM.
