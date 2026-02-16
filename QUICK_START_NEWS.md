# 🚀 Sistema de Noticias - Guía Rápida

## ✅ Lo que ya está funcionando

1. **Backend completo** con:
   - Servicio de noticias con múltiples fuentes RSS
   - Traducción automática (inglés → español)
   - Análisis de sentimiento
   - Categorización inteligente
   - Cron jobs cada 10 minutos
   - Base de datos configurada

2. **Frontend mejorado** con:
   - Filtros por categoría
   - Filtros por sentimiento
   - Badges de tickers relacionados
   - Indicador de traducción
   - Nivel de impacto
   - UI premium moderna

## 🎯 Cómo empezar

### 1. El backend ya está corriendo

El sistema de noticias se integrará automáticamente al backend existente.

### 2. Probar manualmente la obtención de noticias

```bash
# Desde el frontend, abrir la consola del navegador y ejecutar:
fetch('http://localhost:3001/news/fetch', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

O desde la terminal:
``bash
curl -X POST http://localhost:3001/news/fetch
```

### 3. Ver las noticias

Navega a: `http://localhost:5173/news`

## 📊 Endpoints disponibles

```bash
# Todas las noticias
GET http://localhost:3001/news

# Por categoría
GET http://localhost:3001/news?category=argentina

# Por sentimiento
GET http://localhost:3001/news?sentiment=positive

# Por ticker
GET http://localhost:3001/news/ticker/AAPL

# Trending
GET http://localhost:3001/news/trending

# Categorías
GET http://localhost:3001/news/categories

# Estadísticas
GET http://localhost:3001/news/stats

# Forzar fetch manual
POST http://localhost:3001/news/fetch
```

## 🔧 APIs Opcionales (para mejorar)

### GNews API (Opcional - 100 requests/día gratis)

1. Registrate en: https://gnews.io/
2. Obtén tu API key gratuita
3. Edita: `/home/juampi26/Finix/apps/api/src/news/news-fetcher.service.ts`
4. Reemplaza:
```typescript
private readonly GNEWS_API_KEY = 'TU_API_KEY_AQUI';
```

**Sin esta key, el sistema usa RSS feeds que funcionan perfectamente.**

## ⏰ Actualización Automática

El sistema actualiza noticias automáticamente cada **10 minutos** gracias a:

```typescript
@Cron(CronExpression.EVERY_10_MINUTES)
async fetchAndStoreNews() { ... }
```

Para cambiar la frecuencia, edita `/home/juampi26/Finix/apps/api/src/news/news.service.ts`:

```typescript
// Cambiar a cada 15 minutos:
@Cron('*/15 * * * *')

// O cada 30 minutos:
@Cron(CronExpression.EVERY_30_MINUTES)
```

## 🌍 Traducción Automática

El sistema detecta automáticamente noticias en inglés y las traduce usando:

1. **LibreTranslate** (gratis, sin límite)
2. **MyMemory** (fallback, 10k chars/día)

Las noticias traducidas muestran un badge "Traducido" en la UI.

## 📈 Características Avanzadas

### Análisis de Sentimiento

Cada noticia se analiza automáticamente:
- **Positivo** 📈: Ganancias, subas, récords
- **Neutral** ➖: Noticias informativas
- **Negativo** 📉: Pérdidas, caídas, crisis

### Extracción de Tickers

El sistema extrae automáticamente tickers mencionados:
- `$AAPL` → Apple
- `$BTC` → Bitcoin
- "Tesla" → TSLA
- "Mercado Libre" → MELI

### Nivel de Impacto

- **Alto**: Fusiones, crisis, IPOs, escándalos
- **Medio**: Earnings, proyecciones, ratings
- **Bajo**: Noticias regulares

## 📂 Estructura de Archivos

```
/home/juampi26/Finix/
├── apps/
│   ├── api/
│   │   └── src/
│   │       └── news/
│   │           ├── news.module.ts
│   │           ├── news.controller.ts
│   │           ├── news.service.ts                    # Servicio principal
│   │           ├── news-fetcher.service.ts            # Obtiene noticias
│   │           ├── news-translation.service.ts        # Traducciones
│   │           └── news-sentiment.service.ts          # Análisis
│   └── web/
│       └── src/
│           └── pages/
│               └── News.tsx                           # UI mejorada
└── NEWS_SYSTEM_README.md                             # Documentación completa
```

## 🐛 Resolución de Problemas

### Las noticias no aparecen
1. Ejecuta manualmente: `POST http://localhost:3001/news/fetch`
2. Espera 30 segundos
3. Refresca la página de noticias

### Error en traducción
- El sistema continúa con la noticia original
- No afecta el funcionamiento

### Base de datos vacía
- Ejecuta: `POST /news/fetch`
- El sistema comenzará a poblar automáticamente

## 📊 Monitoreo

Ver stats en: `GET http://localhost:3001/news/stats`

```json
{
  "totalNews": 150,
  "last24h": 45,
  "sentiment": {
    "positive": 60,
    "negative": 30,
    "neutral": 60
  }
}
```

## 🎨 Categorías Disponibles

1. **Empresas** - Apple, Tesla, Microsoft, etc.
2. **Argentina** - Noticias locales, YPF, BCRA
3. **Global** - Economía mundial, Fed, inflación
4. **Mercados** - Índices, trading, Wall Street
5. **Criptomonedas** - Bitcoin, Ethereum, crypto
6. **Real Estate** - Propiedades, inmobiliario
7. **Commodities** - Oro, petróleo, materias primas
8. **ETFs** - Fondos indexados

## 🚀 Para Producción

### Migrar a PostgreSQL

1. Instala PostgreSQL
2. Cambia `datasource db` en `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Actualiza `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/finix"
```

4. Ejecuta:
```bash
npx prisma migrate deploy
```

### Redis para Caché

```bash
npm install @nestjs/cache-manager cache-manager-redis-yet
```

## 📞 Soporte

- **Docs completas**: `/home/juampi26/Finix/NEWS_SYSTEM_README.md`
- **Logs backend**: Revisar terminal donde corre el backend
- **Logs frontend**: Console del navegador (F12)

---

**✨ El sistema ya está listo para usar!**

Simplemente navega a la sección de "Noticias" en tu aplicación Finix y disfruta de las noticias financieras con traducción automática y análisis de sentimiento.
