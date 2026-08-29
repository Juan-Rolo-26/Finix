# FINIX — Red Social Financiera

Una plataforma social para inversores que combina posts, análisis de mercado, portfolios, comunidades y educación financiera.

🌎 **Producción**: https://finixarg.com

---

## Stack

| Área | Tech |
|------|------|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | NestJS + TypeScript |
| Base de datos | PostgreSQL (Supabase) |
| Auth | Supabase Auth + JWT |
| Realtime | Socket.IO |
| Pagos | Stripe |
| IA | Ollama (LLM local) |

---

## Inicio rápido (desarrollo)

### Requisitos previos
- Node.js 20+
- npm 9+
- Docker + Docker Compose (recomendado para DB + Redis)

### Setup

```bash
git clone git@github.com:tuorg/finix.git
cd finix

# 1. Copiar y completar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 2. Instalar dependencias
npm install

# 3. Iniciar servicios (PostgreSQL + Redis)
docker compose up -d db redis

# 4. Aplicar migrations
cd apps/api && npx prisma migrate dev && cd ../..

# 5. Iniciar desarrollo
npm run dev
```

Accesos:
- Frontend: http://localhost:5173
- API: http://localhost:3010/api
- Health: http://localhost:3010/health

---

## Estructura

```
finix/
├── apps/api/       # NestJS backend
├── apps/web/       # React frontend
├── packages/       # Shared code
├── ops/            # Nginx, PM2, scripts de deploy
├── docs/           # Documentación
└── .github/        # CI/CD pipelines
```

---

## Scripts

```bash
npm run dev         # Inicia API + Web en modo desarrollo
npm run build       # Build de todos los workspaces
npm run test        # Tests en todos los workspaces
```

---

## Deploy

El deploy se ejecuta automáticamente via GitHub Actions al hacer push a `main`.

Para deploy manual o rollback, ver [docs/runbook.md](docs/runbook.md).

---

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [docs/architecture.md](docs/architecture.md) | Arquitectura del sistema |
| [docs/runbook.md](docs/runbook.md) | Operaciones y resolución de incidentes |
| [apps/api/.env.example](apps/api/.env.example) | Variables de entorno del backend |
| [apps/web/.env.example](apps/web/.env.example) | Variables de entorno del frontend |

---

## Seguridad

¿Encontraste una vulnerabilidad? Contactar directamente a juanpablorolo2007@gmail.com.  
**No crear issues públicos con detalles de seguridad.**
