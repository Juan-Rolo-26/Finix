# Sistema de Noticias Financieras - Finix

## 📰 Descripción General

Sistema completo de noticias financieras con múltiples fuentes, traducción automática al español, análisis de sentimiento y categorización inteligente.

## 🏗️ Arquitectura

### Backend (NestJS)
- **NewsService**: Servicio principal que orquesta el sistema completo
- **NewsFetcherService**: Obtiene noticias de múltiples APIs y RSS feeds
- **NewsTranslationService**: Traducción automática de inglés a español
- **NewsSentimentService**: Análisis de sentimiento y extracción de tickers

### Base de Datos (SQLite/PostgreSQL)
- **News**: Noticias almacenadas con traducciones y análisis
- **NewsSource**: Fuentes de noticias configuradas
- **NewsCategory**: Categorías de noticias

## 🔌 APIs Integradas

### Fuentes de Noticias
1. **RSS Feeds** (Gratuitos)
   - Yahoo Finance
   - NASDAQ
   - Ámbito Financiero (Argentina)
   - El Cronista (Argentina)
   - Infobae (Argentina)

2. **GNews API** (Opcional)
   - 100 requests/día gratuito
   - Multi-idioma
   - Imágenes incluidas

### Servicios de Traducción
1. **LibreTranslate** (Gratuito)
   - Instancia comunitaria
   - Sin límite estricto

2. **MyMemory** (Fallback)
   - 10,000 caracteres/día
   - Completamente gratuito

## 📡 Endpoints de API

### Obtener Noticias Generales
```
GET /news?category=empresas&limit=50&offset=0
```

**Query Parameters:**
- `category` (opcional): Slug de categoría
- `source` (opcional): Nombre de fuente
- `sentiment` (opcional): positive/neutral/negative
- `limit` (opcional): Número de resultados (default: 50)
- `offset` (opcional): Offset para paginación

### Obtener Noticias por Ticker
```
GET /news/ticker/AAPL?limit=20
```

**Parámetros:**
- `ticker` (path): Símbolo del ticker (ej: AAPL, TSLA, BTC)
- `limit` (query): Número de resultados

### Obtener Noticias por Categoría
```
GET /news/category/cripto?limit=50
```

**Categorías disponibles:**
- `empresas` - Noticias de empresas
- `argentina` - Noticias de Argentina
- `global` - Economía global
- `mercados` - Mercados financieros
- `cripto` - Criptomonedas
- `real-estate` - Bienes raíces
- `commodities` - Commodities
- `etfs` - ETFs

### Noticias Trending
```
GET /news/trending?limit=10
```

### Obtener Categorías
```
GET /news/categories
```

### Obtener Fuentes
```
GET /news/sources
```

### Estadísticas
```
GET /news/stats
```

Retorna:
- Total de noticias
- Noticias de últimas 24h
- Distribución de sentiment

### Trigger Manual Fetch (Admin)
```
POST /news/fetch
```

Fuerza la obtención de noticias inmediatamente.

## ⏰ Actualización Automática

El sistema usa **Cron Jobs** para actualizar noticias automáticamente:

- **Frecuencia**: Cada 10 minutos
- **Limpieza**: Noticias más antiguas de 30 días se eliminan automáticamente

```typescript
@Cron(CronExpression.EVERY_10_MINUTES)
async fetchAndStoreNews() {
    // Código de actualización
}
```

## 🌐 Traducciones

### Detección de Idioma
El sistema detecta automáticamente si una noticia está en inglés usando indicadores comunes.

### Proceso de Traducción
1. Detectar idioma original
2. Si es inglés:
   - Intentar LibreTranslate
   - Si falla, usar MyMemory
   - Si ambos fallan, mantener original
3. Guardar ambas versiones (original + traducida)
4. Marcar `wasTranslated = true`

### Campos Traducidos
- `title` → `titleEs`
- `summary` → `summaryEs`
- `content` → `contentEs`

## 🎭 Análisis de Sentimiento

### Keywords de Sentimiento

**Positivos:**
- Spanish: gana, sube, crece, récord, mejora, alcista
- English: gain, surge, rise, growth, bullish, rally

**Negativos:**
- Spanish: pierde, cae, crisis, riesgo, bajista, recesión
- English: loss, fall, decline, crisis, bearish, crash

### Score de Sentimiento
- Rango: -1.0 a 1.0
- Categorías:
  - **Positive**: score > 0.2
  - **Neutral**: -0.2 ≤ score ≤ 0.2
  - **Negative**: score < -0.2

### Nivel de Impacto

**High Impact** keywords:
- record, breakthrough, crisis, crash, merger, IPO, scandal

**Medium Impact** keywords:
- earnings, revenue, guidance, analyst rating

**Low Impact**: Todo lo demás

## 🎯 Extracción de Tickers

El sistema extrae automáticamente tickers relacionados de:
1. Patrón $TICKER (ej: $AAPL)
2. Nombres de empresas conocidas

**Mapeo de Empresas:**
```typescript
{
  'apple': 'AAPL',
  'tesla': 'TSLA',
  'microsoft': 'MSFT',
  'bitcoin': 'BTC',
  'ypf': 'YPF',
  'mercado libre': 'MELI',
  // ... más empresas
}
```

## 📂 Estructura de Respuesta

```json
{
  "id": "uuid",
  "title": "Título en Español",
  "titleOriginal": "Original Title (if translated)",
  "summary": "Resumen en español...",
  "content": "Contenido completo...",
  "url": "https://...",
  "image": "https://...",
  "source": "Yahoo Finance",
  "category": "Empresas",
  "categorySlug": "empresas",
  "author": "Author Name",
  "sentiment": "positive",
  "sentimentScore": 0.75,
  "impactLevel": "high",
  "tickers": ["AAPL", "MSFT"],
  "publishedAt": "2026-02-12T10:00:00Z",
  "wasTranslated": true
  "language": "en"
}
```

## 🔧 Configuración

### Variables de Entorno

Crear API keys para servicios opcionales:

```env
# Backend .env
GNEWS_API_KEY=tu_api_key_aqui  # Opcional - Get at https://gnews.io
```

### Configurar Fuentes

Para añadir nuevas fuentes RSS, editar `news-fetcher.service.ts`:

```typescript
private readonly RSS_FEEDS = [
    { 
        url: 'https://example.com/rss', 
        name: 'Source Name', 
        country: 'AR' 
    },
    // ... más fuentes
];
```

## 🚀 Escalabilidad

### Para Producción (50,000 usuarios)

1. **Migrar a PostgreSQL**
   - Mejor performance con índices
   - Soporte de arrays nativos

2. **Implementar Redis Cache**
   ```
   npm install @nestjs/cache-manager cache-manager-redis-yet
   ```

3. **Rate Limiting**
   - Limitar requests por usuario
   - Implementar throttle en endpoints

4. **CDN para Imágenes**
   - Cachear imágenes de noticias
   - Usar servicios como CloudFlare

5. **Background Jobs**
   - Usar Bull Queue para procesamiento
   - Separar fetch de noticias en workers

## 📊 Monitoreo

### Métricas Importantes
- Total de noticias en base de datos
- Noticias procesadas por hora
- Tasa de éxito de traducción
- Distribución de sentimiento
- Categorías más populares

### Logs
```
[NewsService] Starting news fetch...
[NewsService] Fetched 45 raw news items
[NewsFetcher] Total news fetched: 45
[NewsService] Processed: 42, Skipped: 3 (duplicates)
[NewsService] Deleted 15 old news items > 30 días
```

## 🐛 Troubleshooting

### Las noticias no se actualizan

1. Verificar que el cron job esté activo
2. Revisar logs del backend
3. Probar endpoint manual: `POST /news/fetch`

### Traducciones fallan

1. Verificar conectividad a APIs de traducción
2. Revisar límites de rate (MyMemory: 10k chars/día)
3. Sistema continuará con original si falla

### Duplicados de noticias

El sistema usa `urlHash` (MD5) para evitar duplicados automáticamente.

## 📝 Próximas Mejoras

- [ ] Guardar noticias favoritas por usuario
- [ ] Sistema de notificaciones por ticker
- [ ] Análisis de sentiment más avanzado (IA)
- [ ] Personalización por portafolio del usuario
- [ ] Noticias similares/relacionadas
- [ ] Búsqueda full-text
- [ ] API de webhooks para noticias
- [ ] Dashboard de analytics

## 👥 Soporte

Para problemas o preguntas, revisar:
1. Logs del backend en `apps/api`
2. Browser console para errores frontend
3. Documentación de Prisma

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2026  
**Desarrollado para**: Finix - Plataforma de Finanzas Sociales
