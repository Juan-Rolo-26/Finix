export type NewsUpdateFrequency = 'DAILY' | 'WEEKLY' | 'MANUAL';

export const NEWS_TIME_ZONE = 'America/Argentina/Cordoba';

export interface DefaultNewsCategory {
    name: string;
    slug: string;
    color: string;
    icon: string;
    displayOrder: number;
    updateFrequency: NewsUpdateFrequency;
    updateHour: number;
    updateMinute: number;
    updateDayOfWeek: number;
}

export interface SourceCategoryPolicy {
    priority: number;
    reliabilityScore: number;
    isActive: boolean;
}

export interface DefaultNewsSource {
    name: string;
    baseUrl: string;
    rssUrl?: string;
    apiUrl?: string;
    country: string;
    language: string;
    priority: number;
    reliabilityScore: number;
    categories: string[];
    categoryPolicies: Record<string, SourceCategoryPolicy>;
    legacyNames?: string[];
}

const policies = (
    categories: string[],
    priority: number,
    reliabilityScore: number,
    overrides: Record<string, Partial<SourceCategoryPolicy>> = {},
) => Object.fromEntries(categories.map((slug) => [slug, {
    priority: overrides[slug]?.priority ?? priority,
    reliabilityScore: overrides[slug]?.reliabilityScore ?? reliabilityScore,
    isActive: overrides[slug]?.isActive ?? true,
}])) as Record<string, SourceCategoryPolicy>;

export const DEFAULT_NEWS_CATEGORIES: DefaultNewsCategory[] = [
    { name: 'Argentina', slug: 'argentina', color: '#3b82f6', icon: 'DollarSign', displayOrder: 1, updateFrequency: 'DAILY', updateHour: 8, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'Mercados', slug: 'mercados', color: '#ef4444', icon: 'BarChart3', displayOrder: 2, updateFrequency: 'DAILY', updateHour: 8, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'Commodities', slug: 'commodities', color: '#eab308', icon: 'TrendingUp', displayOrder: 3, updateFrequency: 'DAILY', updateHour: 8, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'Empresas', slug: 'empresas', color: '#10b981', icon: 'Building2', displayOrder: 4, updateFrequency: 'DAILY', updateHour: 8, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'Criptomonedas', slug: 'cripto', color: '#f59e0b', icon: 'Bitcoin', displayOrder: 5, updateFrequency: 'DAILY', updateHour: 8, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'Global', slug: 'global', color: '#06b6d4', icon: 'Globe', displayOrder: 6, updateFrequency: 'DAILY', updateHour: 8, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'Startups', slug: 'startups', color: '#8b5cf6', icon: 'Rocket', displayOrder: 7, updateFrequency: 'WEEKLY', updateHour: 9, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'Economía', slug: 'economia', color: '#14b8a6', icon: 'TrendingUp', displayOrder: 8, updateFrequency: 'WEEKLY', updateHour: 9, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'Acciones', slug: 'acciones', color: '#a855f7', icon: 'BarChart2', displayOrder: 9, updateFrequency: 'WEEKLY', updateHour: 9, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'ETFs', slug: 'etfs', color: '#6366f1', icon: 'PieChart', displayOrder: 10, updateFrequency: 'WEEKLY', updateHour: 9, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'Real Estate', slug: 'real-estate', color: '#64748b', icon: 'Home', displayOrder: 11, updateFrequency: 'WEEKLY', updateHour: 9, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'Finanzas Personales', slug: 'finanzas-personales', color: '#0f766e', icon: 'Wallet', displayOrder: 12, updateFrequency: 'WEEKLY', updateHour: 9, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'Inteligencia Artificial', slug: 'ai', color: '#ec4899', icon: 'Cpu', displayOrder: 13, updateFrequency: 'WEEKLY', updateHour: 9, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'Tecnología', slug: 'tecnologia', color: '#0891b2', icon: 'Laptop', displayOrder: 14, updateFrequency: 'WEEKLY', updateHour: 9, updateMinute: 0, updateDayOfWeek: 0 },
    { name: 'Fintech', slug: 'fintech', color: '#0d9488', icon: 'CreditCard', displayOrder: 15, updateFrequency: 'WEEKLY', updateHour: 9, updateMinute: 0, updateDayOfWeek: 0 },
];

// Seeds only: all source fields and category policies remain editable in Admin.
export const DEFAULT_NEWS_SOURCES: DefaultNewsSource[] = [
    { name: 'Reuters', legacyNames: ['Reuters Business'], baseUrl: 'https://www.reuters.com', rssUrl: 'https://feeds.reuters.com/reuters/businessNews', country: 'US', language: 'en', priority: 100, reliabilityScore: 95, categories: ['mercados', 'global', 'empresas', 'commodities', 'economia'], categoryPolicies: policies(['mercados', 'global', 'empresas', 'commodities', 'economia'], 95, 95, { mercados: { priority: 100 }, global: { priority: 100 } }) },
    { name: 'Bloomberg', baseUrl: 'https://www.bloomberg.com', rssUrl: 'https://feeds.bloomberg.com/markets/news.rss', country: 'US', language: 'en', priority: 100, reliabilityScore: 94, categories: ['mercados', 'global', 'empresas', 'commodities', 'economia', 'acciones', 'etfs'], categoryPolicies: policies(['mercados', 'global', 'empresas', 'commodities', 'economia', 'acciones', 'etfs'], 100, 94) },
    { name: 'CNBC', baseUrl: 'https://www.cnbc.com', rssUrl: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', country: 'US', language: 'en', priority: 90, reliabilityScore: 88, categories: ['mercados', 'empresas', 'acciones', 'global', 'economia'], categoryPolicies: policies(['mercados', 'empresas', 'acciones', 'global', 'economia'], 90, 88) },
    { name: 'Financial Times', baseUrl: 'https://www.ft.com', rssUrl: 'https://www.ft.com/?format=rss', country: 'UK', language: 'en', priority: 95, reliabilityScore: 92, categories: ['global', 'economia', 'empresas', 'mercados', 'commodities'], categoryPolicies: policies(['global', 'economia', 'empresas', 'mercados', 'commodities'], 95, 92) },
    { name: 'The Wall Street Journal', legacyNames: ['Wall Street Journal'], baseUrl: 'https://www.wsj.com', rssUrl: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', country: 'US', language: 'en', priority: 95, reliabilityScore: 90, categories: ['empresas', 'mercados', 'economia', 'global', 'tecnologia'], categoryPolicies: policies(['empresas', 'mercados', 'economia', 'global', 'tecnologia'], 95, 90) },
    { name: 'Yahoo Finance', baseUrl: 'https://finance.yahoo.com', rssUrl: 'https://finance.yahoo.com/news/rssindex', country: 'US', language: 'en', priority: 85, reliabilityScore: 80, categories: ['mercados', 'acciones', 'etfs', 'empresas', 'finanzas-personales'], categoryPolicies: policies(['mercados', 'acciones', 'etfs', 'empresas', 'finanzas-personales'], 85, 80) },
    { name: 'Investing.com', baseUrl: 'https://www.investing.com', rssUrl: 'https://www.investing.com/rss/news.rss', country: 'US', language: 'en', priority: 85, reliabilityScore: 78, categories: ['mercados', 'commodities', 'acciones', 'cripto', 'etfs', 'economia'], categoryPolicies: policies(['mercados', 'commodities', 'acciones', 'cripto', 'etfs', 'economia'], 85, 78) },
    { name: 'Morningstar', baseUrl: 'https://www.morningstar.com', country: 'US', language: 'en', priority: 90, reliabilityScore: 90, categories: ['acciones', 'etfs', 'finanzas-personales', 'empresas'], categoryPolicies: policies(['acciones', 'etfs', 'finanzas-personales', 'empresas'], 90, 90) },
    { name: 'Ámbito Financiero', baseUrl: 'https://www.ambito.com', rssUrl: 'https://www.ambito.com/rss/economia.xml', country: 'AR', language: 'es', priority: 90, reliabilityScore: 86, categories: ['argentina', 'mercados', 'economia', 'commodities', 'empresas'], categoryPolicies: policies(['argentina', 'mercados', 'economia', 'commodities', 'empresas'], 90, 86, { argentina: { priority: 100 } }) },
    { name: 'El Cronista', baseUrl: 'https://www.cronista.com', rssUrl: 'https://www.cronista.com/rss/economia/', country: 'AR', language: 'es', priority: 90, reliabilityScore: 84, categories: ['argentina', 'mercados', 'economia', 'empresas', 'finanzas-personales'], categoryPolicies: policies(['argentina', 'mercados', 'economia', 'empresas', 'finanzas-personales'], 90, 84, { argentina: { priority: 100 } }) },
    { name: 'Bloomberg Línea', baseUrl: 'https://www.bloomberglinea.com', rssUrl: 'https://www.bloomberglinea.com/arc/outboundfeeds/rss/', country: 'AR', language: 'es', priority: 90, reliabilityScore: 86, categories: ['argentina', 'global', 'economia', 'mercados', 'empresas'], categoryPolicies: policies(['argentina', 'global', 'economia', 'mercados', 'empresas'], 90, 86, { argentina: { priority: 100 }, global: { priority: 95 } }) },
    { name: 'BAE Negocios', baseUrl: 'https://www.baenegocios.com', rssUrl: 'https://www.baenegocios.com/rss', country: 'AR', language: 'es', priority: 80, reliabilityScore: 78, categories: ['argentina', 'economia', 'empresas'], categoryPolicies: policies(['argentina', 'economia', 'empresas'], 80, 78) },
    { name: 'iProUP', baseUrl: 'https://www.iproup.com', rssUrl: 'https://www.iproup.com/rss', country: 'AR', language: 'es', priority: 80, reliabilityScore: 76, categories: ['argentina', 'startups', 'empresas', 'tecnologia', 'cripto', 'ai'], categoryPolicies: policies(['argentina', 'startups', 'empresas', 'tecnologia', 'cripto', 'ai'], 80, 76) },
    { name: 'DATAFIN', baseUrl: 'https://datafin.com.ar', country: 'AR', language: 'es', priority: 80, reliabilityScore: 72, categories: ['argentina', 'mercados', 'acciones', 'cripto', 'startups', 'fintech'], categoryPolicies: policies(['argentina', 'mercados', 'acciones', 'cripto', 'startups', 'fintech'], 80, 72) },
    { name: 'Buenos Aires Herald', baseUrl: 'https://www.buenosairesherald.com', country: 'AR', language: 'en', priority: 80, reliabilityScore: 76, categories: ['argentina', 'economia', 'mercados', 'global'], categoryPolicies: policies(['argentina', 'economia', 'mercados', 'global'], 80, 76) },
    { name: 'TechCrunch', baseUrl: 'https://techcrunch.com', rssUrl: 'https://techcrunch.com/feed/', country: 'US', language: 'en', priority: 90, reliabilityScore: 90, categories: ['startups', 'empresas', 'ai', 'tecnologia'], categoryPolicies: policies(['startups', 'empresas', 'ai', 'tecnologia'], 90, 90, { startups: { priority: 100 }, ai: { priority: 100 }, tecnologia: { priority: 100 } }) },
    { name: 'The Information', baseUrl: 'https://www.theinformation.com', country: 'US', language: 'en', priority: 90, reliabilityScore: 90, categories: ['empresas', 'startups', 'ai', 'tecnologia'], categoryPolicies: policies(['empresas', 'startups', 'ai', 'tecnologia'], 90, 90, { startups: { priority: 100 }, ai: { priority: 100 }, tecnologia: { priority: 100 } }) },
    { name: 'CanalAR', baseUrl: 'https://www.canal-ar.com.ar', rssUrl: 'https://www.canal-ar.com.ar/rss.xml', country: 'AR', language: 'es', priority: 80, reliabilityScore: 76, categories: ['argentina', 'tecnologia', 'empresas', 'ai'], categoryPolicies: policies(['argentina', 'tecnologia', 'empresas', 'ai'], 80, 76, { tecnologia: { priority: 100 }, argentina: { priority: 90 } }) },
    { name: 'CoinDesk', baseUrl: 'https://www.coindesk.com', rssUrl: 'https://coindesk.com/arc/outboundfeeds/rss/', country: 'US', language: 'en', priority: 90, reliabilityScore: 84, categories: ['cripto', 'mercados', 'global'], categoryPolicies: policies(['cripto', 'mercados', 'global'], 90, 84, { cripto: { priority: 100 } }) },
    { name: 'The Block', baseUrl: 'https://www.theblock.co', rssUrl: 'https://www.theblock.co/rss.xml', country: 'US', language: 'en', priority: 90, reliabilityScore: 84, categories: ['cripto', 'mercados', 'empresas', 'global'], categoryPolicies: policies(['cripto', 'mercados', 'empresas', 'global'], 90, 84, { cripto: { priority: 100 } }) },
    { name: 'CoinTelegraph', baseUrl: 'https://cointelegraph.com', rssUrl: 'https://cointelegraph.com/rss', country: 'US', language: 'en', priority: 75, reliabilityScore: 78, categories: ['cripto'], categoryPolicies: policies(['cripto'], 75, 78) },
    { name: 'Decrypt', baseUrl: 'https://decrypt.co', rssUrl: 'https://decrypt.co/feed', country: 'US', language: 'en', priority: 68, reliabilityScore: 74, categories: ['cripto', 'ai'], categoryPolicies: policies(['cripto', 'ai'], 68, 74) },
    { name: 'CryptoNews', baseUrl: 'https://cryptonews.com', rssUrl: 'https://cryptonews.com/news/feed/', country: 'US', language: 'en', priority: 60, reliabilityScore: 70, categories: ['cripto'], categoryPolicies: policies(['cripto'], 60, 70) },
    { name: 'NASDAQ', baseUrl: 'https://www.nasdaq.com', rssUrl: 'https://www.nasdaq.com/feed/rssoutbound?category=Stocks', country: 'US', language: 'en', priority: 78, reliabilityScore: 82, categories: ['mercados', 'acciones', 'empresas'], categoryPolicies: policies(['mercados', 'acciones', 'empresas'], 78, 82) },
    { name: 'MarketWatch', baseUrl: 'https://www.marketwatch.com', rssUrl: 'https://feeds.marketwatch.com/marketwatch/topstories', country: 'US', language: 'en', priority: 72, reliabilityScore: 76, categories: ['mercados', 'acciones', 'global'], categoryPolicies: policies(['mercados', 'acciones', 'global'], 72, 76) },
    { name: 'BBC Business', baseUrl: 'https://www.bbc.com', rssUrl: 'https://feeds.bbci.co.uk/news/business/rss.xml', country: 'UK', language: 'en', priority: 82, reliabilityScore: 86, categories: ['global', 'empresas', 'economia'], categoryPolicies: policies(['global', 'empresas', 'economia'], 82, 86) },
    { name: 'NYT Economy', baseUrl: 'https://www.nytimes.com', rssUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml', country: 'US', language: 'en', priority: 84, reliabilityScore: 86, categories: ['global', 'economia'], categoryPolicies: policies(['global', 'economia'], 84, 86) },
    { name: 'Infobae', baseUrl: 'https://www.infobae.com', rssUrl: 'https://www.infobae.com/feeds/rss/', country: 'AR', language: 'es', priority: 78, reliabilityScore: 76, categories: ['argentina', 'global', 'empresas'], categoryPolicies: policies(['argentina', 'global', 'empresas'], 78, 76) },
    { name: 'La Nación', baseUrl: 'https://www.lanacion.com.ar', rssUrl: 'https://feeds.lanacion.com.ar/lanacion/economia', country: 'AR', language: 'es', priority: 84, reliabilityScore: 82, categories: ['argentina', 'economia'], categoryPolicies: policies(['argentina', 'economia'], 84, 82) },
    { name: 'iProfesional', baseUrl: 'https://www.iprofesional.com', rssUrl: 'https://www.iprofesional.com/feed', country: 'AR', language: 'es', priority: 72, reliabilityScore: 74, categories: ['argentina', 'economia', 'empresas'], categoryPolicies: policies(['argentina', 'economia', 'empresas'], 72, 74) },
    { name: 'Ámbito Finanzas', baseUrl: 'https://www.ambito.com/finanzas', rssUrl: 'https://www.ambito.com/rss/finanzas.xml', country: 'AR', language: 'es', priority: 86, reliabilityScore: 84, categories: ['argentina', 'mercados', 'commodities'], categoryPolicies: policies(['argentina', 'mercados', 'commodities'], 86, 84, { argentina: { priority: 100 } }) },
];

export const NEWS_CATEGORY_KEYWORDS: Record<string, string[]> = {
    argentina: ['argentina', 'banco central', 'milei', 'peso argentino', 'buenos aires', 'ypf', 'vaca muerta'],
    mercados: ['mercado', 'bolsa', 'índice', 'indice', 'bono', 'tasa', 'fed', 'wall street', 'dow jones', 'nasdaq', 's&p 500'],
    commodities: ['petróleo', 'petroleo', 'oil', 'oro', 'gold', 'soja', 'trigo', 'maíz', 'maiz', 'cobre', 'commodity'],
    empresas: ['empresa', 'acciones', 'shares', 'earnings', 'resultados', 'revenue', 'nvidia', 'apple', 'microsoft', 'tesla', 'amazon', 'mercado libre'],
    cripto: ['bitcoin', 'ethereum', 'crypto', 'cripto', 'blockchain', 'stablecoin', 'token', 'etf de bitcoin'],
    global: ['global', 'internacional', 'world', 'china', 'europa', 'unión europea', 'union europea', 'geopolítica', 'geopolitica'],
    startups: ['startup', 'start-up', 'venture capital', 'ronda', 'seed', 'serie a', 'emprendedor'],
    economia: ['economía', 'economia', 'inflación', 'inflacion', 'pib', 'empleo', 'desempleo', 'recesión', 'recesion'],
    acciones: ['acción', 'accion', 'acciones', 'stock', 'shares', 'cotización', 'cotizacion', 'ticker'],
    etfs: ['etf', 'fondo cotizado', 'index fund'],
    'real-estate': ['real estate', 'inmobiliario', 'vivienda', 'hipoteca', 'property', 'housing'],
    'finanzas-personales': ['finanzas personales', 'ahorro', 'presupuesto', 'tarjeta', 'jubilación', 'jubilacion', 'crédito', 'credito'],
    ai: ['inteligencia artificial', 'artificial intelligence', 'machine learning', 'openai', 'modelo de lenguaje', 'chip de ia'],
    tecnologia: ['tecnología', 'tecnologia', 'technology', 'software', 'hardware', 'smartphone', 'internet', 'ciberseguridad'],
    fintech: ['fintech', 'pagos digitales', 'banca digital', 'wallet', 'neobanco', 'billetera virtual'],
};
