# FINIX — Architecture Overview

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| UI | Radix UI + shadcn/ui + Framer Motion |
| State | Zustand + React Hook Form + Zod |
| Charts | TradingView Lightweight Charts |
| Backend | NestJS + TypeScript |
| DB ORM | Prisma 5 |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (frontend) + JWT validation (backend) |
| Realtime | Socket.IO |
| Email | Nodemailer via Resend SMTP |
| AI | Ollama (local LLM) |
| Payments | Stripe |
| Storage | Local filesystem uploads → planned R2/S3 migration |
| CDN/Proxy | Cloudflare + Nginx |
| Process Manager | PM2 |
| CI/CD | GitHub Actions |

---

## Infrastructure Diagram

```
User
  │
  ▼
Cloudflare (DNS + CDN + WAF)
  │
  ▼
VPS (finixarg.com)
  │
  ├── Nginx (port 80/443)
  │     ├── /                → /var/www/finix/dist (React SPA)
  │     ├── /api/*           → PM2: NestJS (port 3010)
  │     ├── /socket.io/*     → PM2: NestJS WebSockets
  │     └── /health          → PM2: Health probe
  │
  └── PM2
        └── finix-api (NestJS)
              ├── PrismaService → Supabase PostgreSQL
              ├── MailService   → Resend SMTP
              ├── StripeService → Stripe API
              ├── MarketService → FMP / Finnhub / Alpha Vantage
              ├── AiModule      → Ollama (local)
              └── Socket.IO     → WebSocket events
```

---

## Request Flow

```
Browser → Cloudflare → Nginx → NestJS API → Supabase DB
                              ↓
                          JWT Validation (Supabase JWKS or HS256)
                              ↓
                          Authorization (role/ownership checks)
                              ↓
                          Business Logic
                              ↓
                          Prisma ORM → PostgreSQL
```

---

## Auth Flow

```
User signs in via Supabase Auth (email/password or OAuth)
  → Supabase issues JWT (RS256 or HS256)
  → Browser stores JWT in localStorage/memory
  → API requests include JWT in Authorization: Bearer header
  → NestJS JwtStrategy validates JWT via Supabase JWKS
  → Validated user payload attached to request
  → Guards check roles/permissions
```

---

## Monorepo Structure

```
finix/
├── apps/
│   ├── api/          # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── posts/
│   │   │   ├── market/
│   │   │   ├── user/
│   │   │   ├── messages/
│   │   │   ├── notifications/
│   │   │   ├── communities/
│   │   │   ├── portfolio/
│   │   │   ├── news/
│   │   │   ├── stripe/
│   │   │   ├── ai/
│   │   │   └── ...
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   ├── web/          # React frontend (Vite)
│   │   └── src/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── stores/
│   │       ├── lib/
│   │       └── layouts/
│   └── admin/        # Admin panel
├── packages/
│   └── shared/       # Shared types/utils
├── ops/
│   ├── nginx/        # Nginx configs
│   └── scripts/      # Deploy/rollback scripts
├── docs/             # Documentation
└── .github/
    └── workflows/    # CI/CD pipelines
```

---

## Environments

| Environment | URL | DB | Branch |
|---|---|---|---|
| Development | localhost:5173 / localhost:3010 | Local Docker or Supabase dev | any |
| Staging | staging.finixarg.com | Supabase staging project | `staging` |
| Production | finixarg.com | Supabase production project | `main` |

---

## Known Limitations / Planned Improvements

1. **Storage**: Uploads are stored on local filesystem. Should migrate to Cloudflare R2 or AWS S3 for horizontal scaling and redundancy.
2. **Redis**: Not yet integrated. Rate limiting currently relies on in-memory state which doesn't scale across multiple instances.
3. **BullMQ**: Job queue not yet implemented. Email sending is synchronous. Should move to async workers.
4. **Testing**: Very few unit/integration tests. E2E suite is skeletal.
5. **Monitoring**: No Sentry integration yet. Error tracking is only via PM2 logs.
6. **Notifications**: Email notifications not implemented — only in-app.
