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
ALLOWED_ORIGINS=https://finixarg.com,https://www.finixarg.com
```

## Build

```bash
npm install
npm run build -w api
npm run build -w web
```

## Nginx

- Usá `deploy/nginx/finixarg.com.conf`
- Apuntá `root` al build real del frontend
- Proxy `127.0.0.1:3001` para `/api`, `/socket.io` y `/uploads`

## Auth

- El login/registro web usa Supabase
- Agregá en Supabase estas redirects:
  - `https://finixarg.com/auth/callback`
  - `https://finixarg.com/reset-password`

## Mail

- La app ya no muestra “modo prueba”
- Para correos propios del backend, falta terminar Resend/dominio
