import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface FinvizBaseNode {
    name: string;
    description?: string;
    value?: number;
    children?: FinvizBaseNode[];
}

interface FinvizPerfResponse {
    nodes?: Record<string, number>;
    subtype?: string;
}

export interface NewsItem {
    title: string;
    link: string;
    publishedAt: string;
    source: string;
    summary: string;
    image?: string;
}

export interface MarketQuote {
    inputSymbol: string;
    symbol: string;
    price: number | null;
    change: number | null;
    updatedAt: string;
    unavailable: boolean;
}

interface ScannerQuote {
    price: number;
    change: number | null;
}

interface FinvizTickerNode {
    name: string;
    description: string;
    industry: string;
    sector: string;
    value: number;
    perf: number;
}

interface FinvizSectorNode {
    name: string;
    value: number;
    perf: number;
    children: FinvizTickerNode[];
}

interface MarketNewsFeed {
    url: string;
    bucket: 'argentina' | 'global';
}

type DashboardValueFormat = 'currency' | 'number' | 'percent';

interface MarketDashboardAssetDefinition {
    id: string;
    symbol: string;
    label: string;
    description: string;
    format: DashboardValueFormat;
    currency?: 'ARS' | 'USD';
}

export interface MarketDashboardAsset extends MarketDashboardAssetDefinition {
    price: number | null;
    change: number | null;
    updatedAt: string;
    unavailable: boolean;
}

export interface MarketDollarRate {
    id: string;
    label: string;
    buy: number;
    sell: number;
    spreadPct: number;
    updatedAt: string;
}

export interface MarketCommunityTrend {
    symbol: string;
    label: string;
    mentions: number;
    engagement: number;
    price: number | null;
    change: number | null;
    updatedAt: string;
}

export interface MarketDashboardPayload {
    updatedAt: string;
    pulse: {
        label: string;
        tone: 'positive' | 'neutral' | 'negative';
        summary: string;
        advancing: number;
        declining: number;
        unchanged: number;
    };
    currencyGap: {
        label: string;
        gapPct: number;
        gapValue: number;
        officialSell: number;
        blueSell: number;
    } | null;
    dollars: MarketDollarRate[];
    sections: {
        argentina: MarketDashboardAsset[];
        global: MarketDashboardAsset[];
        crypto: MarketDashboardAsset[];
        commodities: MarketDashboardAsset[];
        indicators: MarketDashboardAsset[];
    };
    leaders: {
        gainers: MarketDashboardAsset[];
        losers: MarketDashboardAsset[];
    };
    community: MarketCommunityTrend[];
}

@Injectable()
export class MarketService {
    private finvizBaseCache: { data: FinvizBaseNode; fetchedAt: number } | null = null;
    private finvizHeatmapCache = new Map<string, { data: unknown; fetchedAt: number }>();
    private marketNewsCache: { data: NewsItem[]; fetchedAt: number } | null = null;
    private readonly finvizBaseTtlMs = 6 * 60 * 60 * 1000;
    private readonly finvizHeatmapTtlMs = 60 * 1000;
    private readonly marketNewsTtlMs = 5 * 60 * 1000;
    private readonly finvizDefaultBaseScript = '/assets/dist-legacy/map_base_sec.v1.6b264ef1.js';

    constructor(private prisma: PrismaService) { }

    private stripHtml(value: string) {
        return value.replace(/\u003c[^\u003e]*\u003e/g, '').trim();
    }

    private mockTickers = [
        { symbol: 'BTC', price: 42000, change: 2.5 },
        { symbol: 'ETH', price: 2200, change: 1.2 },
        { symbol: 'AAPL', price: 175, change: -0.5 },
        { symbol: 'TSLA', price: 210, change: 3.1 },
        { symbol: 'SPY', price: 490, change: 0.8 },
    ];

    private readonly marketDashboardCatalog = {
        argentina: [
            {
                id: 'merval',
                symbol: 'BCBA:IMV',
                label: 'S&P Merval',
                description: 'Indice lider de la bolsa argentina',
                format: 'number',
            },
            {
                id: 'arg-general',
                symbol: 'BCBA:IAB',
                label: 'Argentina General',
                description: 'Indice amplio del mercado local',
                format: 'number',
            },
            {
                id: 'arg-energy',
                symbol: 'BCBA:SPBYUEAP',
                label: 'BYMA Utilities & Energy',
                description: 'Utilities y energia en Argentina',
                format: 'number',
            },
            {
                id: 'arg-financials',
                symbol: 'BCBA:SPBYMAIG40',
                label: 'BYMA Financials',
                description: 'Sector financiero argentino',
                format: 'number',
            },
        ],
        global: [
            {
                id: 'sp500',
                symbol: 'AMEX:SPY',
                label: 'S&P 500',
                description: 'Proxy del mercado accionario de EE. UU.',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'nasdaq100',
                symbol: 'NASDAQ:QQQ',
                label: 'Nasdaq 100',
                description: 'Tecnologia y crecimiento global',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'nikkei225',
                symbol: 'TVC:NI225',
                label: 'Nikkei 225',
                description: 'Bolsa de Japon',
                format: 'number',
            },
            {
                id: 'hang-seng',
                symbol: 'TVC:HSI',
                label: 'Hang Seng',
                description: 'Mercado de Hong Kong',
                format: 'number',
            },
        ],
        crypto: [
            {
                id: 'btc',
                symbol: 'CRYPTO:BTCUSD',
                label: 'Bitcoin',
                description: 'Referencia principal del mercado cripto',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'eth',
                symbol: 'CRYPTO:ETHUSD',
                label: 'Ethereum',
                description: 'Infraestructura y smart contracts',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'sol',
                symbol: 'BINANCE:SOLUSDT',
                label: 'Solana',
                description: 'Actividad y velocidad de red',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'xrp',
                symbol: 'BINANCE:XRPUSDT',
                label: 'XRP',
                description: 'Pagos y liquidez',
                format: 'currency',
                currency: 'USD',
            },
        ],
        commodities: [
            {
                id: 'gold',
                symbol: 'OANDA:XAUUSD',
                label: 'Oro',
                description: 'Activo refugio global',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'soybeans',
                symbol: 'CBOT:ZS1!',
                label: 'Soja',
                description: 'Clave para la economia argentina',
                format: 'number',
            },
            {
                id: 'wheat',
                symbol: 'CBOT:ZW1!',
                label: 'Trigo',
                description: 'Agricolas y exportaciones',
                format: 'number',
            },
            {
                id: 'natgas',
                symbol: 'NYMEX:NG1!',
                label: 'Gas natural',
                description: 'Energia y costos globales',
                format: 'number',
            },
        ],
        indicators: [
            {
                id: 'bcra-rate',
                symbol: 'ECONOMICS:ARINTR',
                label: 'Tasa BCRA',
                description: 'Tasa de referencia en Argentina',
                format: 'percent',
            },
            {
                id: 'us10y',
                symbol: 'TVC:US10Y',
                label: 'Bono 10Y EE. UU.',
                description: 'Rendimiento del treasury a 10 anos',
                format: 'percent',
            },
            {
                id: 'dxy',
                symbol: 'TVC:DXY',
                label: 'Indice Dolar',
                description: 'Fortaleza global del USD',
                format: 'number',
            },
            {
                id: 'vix',
                symbol: 'TVC:VIX',
                label: 'VIX',
                description: 'Volatilidad implicita del mercado',
                format: 'number',
            },
        ],
    } satisfies Record<string, MarketDashboardAssetDefinition[]>;

    // Expanded catalog with more assets
    private symbolCatalog = [
        // US Stocks - Tech
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:TSLA', name: 'Tesla Inc', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:NVDA', name: 'NVIDIA Corp', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:MSFT', name: 'Microsoft Corp', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:GOOGL', name: 'Alphabet Inc', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:META', name: 'Meta Platforms Inc', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:AMZN', name: 'Amazon.com Inc', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:NFLX', name: 'Netflix Inc', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:AMD', name: 'Advanced Micro Devices', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:INTC', name: 'Intel Corporation', type: 'stock', exchange: 'NASDAQ' },

        // US Stocks - Finance
        { symbol: 'NYSE:JPM', name: 'JPMorgan Chase & Co', type: 'stock', exchange: 'NYSE' },
        { symbol: 'NYSE:BAC', name: 'Bank of America Corp', type: 'stock', exchange: 'NYSE' },
        { symbol: 'NYSE:WFC', name: 'Wells Fargo & Company', type: 'stock', exchange: 'NYSE' },
        { symbol: 'NYSE:V', name: 'Visa Inc', type: 'stock', exchange: 'NYSE' },
        { symbol: 'NYSE:MA', name: 'Mastercard Inc', type: 'stock', exchange: 'NYSE' },

        // ETFs
        { symbol: 'NYSE:SPY', name: 'SPDR S&P 500 ETF', type: 'etf', exchange: 'NYSE' },
        { symbol: 'NASDAQ:QQQ', name: 'Invesco QQQ Trust', type: 'etf', exchange: 'NASDAQ' },
        { symbol: 'NYSE:VNQ', name: 'Vanguard Real Estate ETF', type: 'etf', exchange: 'NYSE' },
        { symbol: 'NYSE:GLD', name: 'SPDR Gold Trust', type: 'etf', exchange: 'NYSE' },
        { symbol: 'NYSE:VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf', exchange: 'NYSE' },

        // Cryptocurrencies
        { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin / Tether', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'BINANCE:ETHUSDT', name: 'Ethereum / Tether', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'BINANCE:BNBUSDT', name: 'Binance Coin / Tether', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'BINANCE:SOLUSDT', name: 'Solana / Tether', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'BINANCE:ADAUSDT', name: 'Cardano / Tether', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'BINANCE:XRPUSDT', name: 'Ripple / Tether', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'CRYPTO:BTCUSD', name: 'Bitcoin / USD', type: 'crypto', exchange: 'CRYPTO' },
        { symbol: 'CRYPTO:ETHUSD', name: 'Ethereum / USD', type: 'crypto', exchange: 'CRYPTO' },

        // Forex
        { symbol: 'FX:EURUSD', name: 'Euro / US Dollar', type: 'forex', exchange: 'FX' },
        { symbol: 'FX:GBPUSD', name: 'British Pound / US Dollar', type: 'forex', exchange: 'FX' },
        { symbol: 'FX:USDJPY', name: 'US Dollar / Japanese Yen', type: 'forex', exchange: 'FX' },
        { symbol: 'FX:AUDUSD', name: 'Australian Dollar / US Dollar', type: 'forex', exchange: 'FX' },
        { symbol: 'FX:USDCAD', name: 'US Dollar / Canadian Dollar', type: 'forex', exchange: 'FX' },

        // Commodities
        { symbol: 'OANDA:XAUUSD', name: 'Gold / US Dollar', type: 'commodity', exchange: 'OANDA' },
        { symbol: 'OANDA:XAGUSD', name: 'Silver / US Dollar', type: 'commodity', exchange: 'OANDA' },
        { symbol: 'TVC:USOIL', name: 'WTI Crude Oil', type: 'commodity', exchange: 'TVC' },
        { symbol: 'TVC:UKOIL', name: 'Brent Crude Oil', type: 'commodity', exchange: 'TVC' },

        // Energy
        { symbol: 'NYSE:XOM', name: 'Exxon Mobil Corp', type: 'stock', exchange: 'NYSE' },
        { symbol: 'NYSE:CVX', name: 'Chevron Corporation', type: 'stock', exchange: 'NYSE' },
    ];

    private toShortSymbol(symbol: string) {
        const clean = (symbol || '').trim().toUpperCase();
        if (!clean) return '';
        return clean.includes(':') ? clean.split(':').pop() || clean : clean;
    }

    private getDashboardDefinitions() {
        return [
            ...this.marketDashboardCatalog.argentina,
            ...this.marketDashboardCatalog.global,
            ...this.marketDashboardCatalog.crypto,
            ...this.marketDashboardCatalog.commodities,
            ...this.marketDashboardCatalog.indicators,
        ];
    }

    private buildDashboardAsset(definition: MarketDashboardAssetDefinition, quote?: MarketQuote): MarketDashboardAsset {
        return {
            ...definition,
            price: quote?.price ?? null,
            change: quote?.change ?? null,
            updatedAt: quote?.updatedAt || new Date().toISOString(),
            unavailable: quote?.unavailable ?? true,
        };
    }

    private buildDashboardSections(quotes: MarketQuote[]) {
        const quotesByInput = new Map(quotes.map((quote) => [this.normalizeQuoteInputSymbol(quote.inputSymbol), quote]));
        const mapSection = (items: MarketDashboardAssetDefinition[]) =>
            items.map((definition) => this.buildDashboardAsset(
                definition,
                quotesByInput.get(this.normalizeQuoteInputSymbol(definition.symbol))
            ));

        return {
            argentina: mapSection(this.marketDashboardCatalog.argentina),
            global: mapSection(this.marketDashboardCatalog.global),
            crypto: mapSection(this.marketDashboardCatalog.crypto),
            commodities: mapSection(this.marketDashboardCatalog.commodities),
            indicators: mapSection(this.marketDashboardCatalog.indicators),
        };
    }

    private buildMarketPulse(sections: MarketDashboardPayload['sections']): MarketDashboardPayload['pulse'] {
        const tradableItems = [
            ...sections.argentina,
            ...sections.global,
            ...sections.crypto,
            ...sections.commodities,
        ].filter((item) => item.change !== null);

        const advancing = tradableItems.filter((item) => (item.change ?? 0) > 0).length;
        const declining = tradableItems.filter((item) => (item.change ?? 0) < 0).length;
        const unchanged = Math.max(0, tradableItems.length - advancing - declining);
        const vix = sections.indicators.find((item) => item.id === 'vix')?.price ?? null;
        const breadth = tradableItems.length > 0 ? (advancing - declining) / tradableItems.length : 0;

        let tone: 'positive' | 'neutral' | 'negative' = 'neutral';
        let label = 'Sesion mixta';

        if (vix !== null && vix >= 28) {
            tone = 'negative';
            label = 'Mercado defensivo';
        } else if (breadth >= 0.25) {
            tone = 'positive';
            label = 'Sesgo comprador';
        } else if (breadth <= -0.25) {
            tone = 'negative';
            label = 'Sesgo vendedor';
        }

        return {
            label,
            tone,
            summary: tradableItems.length > 0
                ? `${advancing} de ${tradableItems.length} referencias seguidas operan en verde.`
                : 'Sin suficientes referencias para medir el pulso del mercado.',
            advancing,
            declining,
            unchanged,
        };
    }

    private buildDashboardLeaders(sections: MarketDashboardPayload['sections']) {
        const tradableItems = [
            ...sections.argentina,
            ...sections.global,
            ...sections.crypto,
            ...sections.commodities,
        ].filter((item) => item.change !== null);

        return {
            gainers: [...tradableItems].sort((a, b) => (b.change ?? -Infinity) - (a.change ?? -Infinity)).slice(0, 4),
            losers: [...tradableItems].sort((a, b) => (a.change ?? Infinity) - (b.change ?? Infinity)).slice(0, 4),
        };
    }

    private buildCurrencyGap(dollars: MarketDollarRate[]): MarketDashboardPayload['currencyGap'] {
        const official = dollars.find((rate) => rate.id === 'oficial');
        const blue = dollars.find((rate) => rate.id === 'blue');

        if (!official || !blue || official.sell <= 0) {
            return null;
        }

        const gapValue = blue.sell - official.sell;
        return {
            label: 'Brecha blue vs oficial',
            gapPct: (gapValue / official.sell) * 100,
            gapValue,
            officialSell: official.sell,
            blueSell: blue.sell,
        };
    }

    private async getDollarRates(): Promise<MarketDollarRate[]> {
        const fallbackUpdatedAt = new Date().toISOString();
        const fallback = [
            { id: 'oficial', label: 'Oficial', buy: 1385, sell: 1435, spreadPct: 3.61, updatedAt: fallbackUpdatedAt },
            { id: 'blue', label: 'Blue', buy: 1395, sell: 1415, spreadPct: 1.43, updatedAt: fallbackUpdatedAt },
            { id: 'mep', label: 'MEP', buy: 1435.5, sell: 1439.5, spreadPct: 0.28, updatedAt: fallbackUpdatedAt },
            { id: 'ccl', label: 'CCL', buy: 1475.7, sell: 1478.7, spreadPct: 0.20, updatedAt: fallbackUpdatedAt },
        ];

        try {
            const response = await fetch('https://dolarapi.com/v1/dolares', {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                throw new Error(`Dollar API failed: ${response.status}`);
            }

            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error('Dollar API returned unexpected payload');
            }

            const mapRate = (house: string, label: string): MarketDollarRate | null => {
                const item = data.find((entry: any) => String(entry?.casa || '').toLowerCase() === house);
                if (!item) return null;

                const buy = Number(item.compra ?? 0);
                const sell = Number(item.venta ?? 0);
                return {
                    id: house === 'bolsa' ? 'mep' : house === 'contadoconliqui' ? 'ccl' : house,
                    label,
                    buy,
                    sell,
                    spreadPct: buy > 0 ? ((sell - buy) / buy) * 100 : 0,
                    updatedAt: String(item.fechaActualizacion || fallbackUpdatedAt),
                };
            };

            const rates = [
                mapRate('oficial', 'Oficial'),
                mapRate('blue', 'Blue'),
                mapRate('bolsa', 'MEP'),
                mapRate('contadoconliqui', 'CCL'),
            ].filter((item): item is MarketDollarRate => item !== null);

            return rates.length > 0 ? rates : fallback;
        } catch (error) {
            console.error('[MarketService] Dollar rates failed:', error);
            return fallback;
        }
    }

    private resolveAssetLabel(symbol: string) {
        const normalized = this.normalizeQuoteInputSymbol(symbol);
        const short = this.toShortSymbol(normalized);
        const definition = this.getDashboardDefinitions().find((item) =>
            this.normalizeQuoteInputSymbol(item.symbol) === normalized || this.toShortSymbol(item.symbol) === short
        );

        if (definition) {
            return definition.label;
        }

        const catalogItem = this.symbolCatalog.find((item) =>
            this.normalizeQuoteInputSymbol(item.symbol) === normalized || this.toShortSymbol(item.symbol) === short
        );

        return catalogItem?.name || short || normalized;
    }

    private extractCommunitySymbols(content: string) {
        const matches = content.match(/\$([A-Z]{2,10})\b/gi) || [];
        return matches
            .map((match) => match.replace('$', '').trim().toUpperCase())
            .filter(Boolean);
    }

    private normalizeCommunitySymbol(symbol: string) {
        return this.normalizeQuoteInputSymbol(symbol.replace(/\s+/g, ''));
    }

    private async getCommunityTrends(): Promise<MarketCommunityTrend[]> {
        try {
            const recentPosts = await this.prisma.post.findMany({
                where: {
                    parentId: null,
                    visibility: 'VISIBLE',
                    deletedAt: null,
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 250,
                select: {
                    assetSymbol: true,
                    tickers: true,
                    content: true,
                    _count: {
                        select: {
                            likes: true,
                            reposts: true,
                            quotes: true,
                            replies: true,
                        },
                    },
                },
            });

            const allowedShortSymbols = new Set(
                [
                    ...this.symbolCatalog.map((item) => this.toShortSymbol(item.symbol)),
                    ...this.getDashboardDefinitions().map((item) => this.toShortSymbol(item.symbol)),
                ].filter(Boolean)
            );
            const aggregated = new Map<string, { mentions: number; engagement: number }>();

            for (const post of recentPosts) {
                const engagement = (post._count?.likes ?? 0)
                    + (post._count?.reposts ?? 0)
                    + (post._count?.quotes ?? 0)
                    + (post._count?.replies ?? 0);
                const mentions = new Set<string>();

                if (post.assetSymbol) {
                    mentions.add(this.normalizeCommunitySymbol(post.assetSymbol));
                }

                if (post.tickers) {
                    post.tickers
                        .split(',')
                        .map((entry) => this.normalizeCommunitySymbol(entry))
                        .filter(Boolean)
                        .forEach((entry) => mentions.add(entry));
                }

                this.extractCommunitySymbols(post.content || '')
                    .filter((entry) => allowedShortSymbols.has(entry))
                    .forEach((entry) => mentions.add(entry));

                for (const symbol of mentions) {
                    const current = aggregated.get(symbol) || { mentions: 0, engagement: 0 };
                    current.mentions += 1;
                    current.engagement += engagement;
                    aggregated.set(symbol, current);
                }
            }

            const ranked = [...aggregated.entries()]
                .sort((a, b) => {
                    if (b[1].mentions !== a[1].mentions) return b[1].mentions - a[1].mentions;
                    return b[1].engagement - a[1].engagement;
                })
                .slice(0, 4);

            if (ranked.length === 0) {
                return [];
            }

            const quotes = await this.getQuotes(ranked.map(([symbol]) => symbol));
            const quoteMap = new Map(quotes.map((quote) => [this.normalizeQuoteInputSymbol(quote.inputSymbol), quote]));

            return ranked.map(([symbol, stats]) => {
                const quote = quoteMap.get(this.normalizeQuoteInputSymbol(symbol));
                return {
                    symbol,
                    label: this.resolveAssetLabel(symbol),
                    mentions: stats.mentions,
                    engagement: stats.engagement,
                    price: quote?.price ?? null,
                    change: quote?.change ?? null,
                    updatedAt: quote?.updatedAt || new Date().toISOString(),
                };
            });
        } catch (error) {
            console.error('[MarketService] Community trends failed:', error);
            return [];
        }
    }

    async getDashboard(): Promise<MarketDashboardPayload> {
        const definitions = this.getDashboardDefinitions();
        const [quotes, dollars, community] = await Promise.all([
            this.getQuotes(definitions.map((item) => item.symbol)),
            this.getDollarRates(),
            this.getCommunityTrends(),
        ]);

        const sections = this.buildDashboardSections(quotes);
        const leaders = this.buildDashboardLeaders(sections);
        const pulse = this.buildMarketPulse(sections);

        return {
            updatedAt: new Date().toISOString(),
            pulse,
            currencyGap: this.buildCurrencyGap(dollars),
            dollars,
            sections,
            leaders,
            community,
        };
    }

    async getTickers() {
        const defaultTickers = ['NASDAQ:TSLA', 'CRYPTO:BTCUSD', 'AMEX:SPY', 'NASDAQ:NVDA', 'NASDAQ:AAPL'];
        const quotes = await this.getQuotes(defaultTickers);

        return quotes.map((q, i) => {
            const mockFallback = this.mockTickers[i % this.mockTickers.length];
            // Extraer el símbolo corto (ej: TSLA en lugar de NASDAQ:TSLA)
            const shortSymbol = q.inputSymbol.split(':')[1] || q.inputSymbol;

            return {
                symbol: shortSymbol === 'BTCUSD' ? 'BTC' : shortSymbol,
                price: q.price ?? mockFallback.price,
                change: q.change ?? mockFallback.change,
                volume: Math.floor(Math.random() * 50000) + 10000 // Simulation for volume as real volume might be missing
            };
        });
    }

    async searchSymbols(query: string) {
        console.log(`[MarketService] Searching for: ${query}`);
        const q = query.trim().toUpperCase();
        if (!q) {
            return this.symbolCatalog.slice(0, 20);
        }

        const normalizedFromInput = q.replace(/\s+/g, '');
        const explicitTvSymbolMatch = normalizedFromInput.match(/^([A-Z0-9._-]+):([A-Z0-9._/\-]+)$/);
        const explicitTvSymbol = explicitTvSymbolMatch
            ? `${explicitTvSymbolMatch[1]}:${explicitTvSymbolMatch[2]}`
            : null;

        const directSymbolResult = explicitTvSymbol
            ? [{
                symbol: explicitTvSymbol,
                exchange: explicitTvSymbol.split(':')[0],
                name: explicitTvSymbol.split(':')[1],
                type: 'other',
            }]
            : [];

        // Search in local catalog first
        const qLower = q.toLowerCase();
        const localResults = this.symbolCatalog.filter((item) =>
            item.symbol.toLowerCase().includes(qLower) ||
            item.name.toLowerCase().includes(qLower)
        );

        // Try TradingView as backup (with timeout and error handling)
        let tvResults: any[] = [];
        try {
            console.log('[MarketService] Trying TradingView search...');
            const exchange = explicitTvSymbolMatch?.[1] || '';
            const text = explicitTvSymbolMatch?.[2] || q;

            const params = new URLSearchParams({
                text,
                hl: '0',
                lang: 'en',
                exchange,
                type: '',
                domain: 'production',
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`https://symbol-search.tradingview.com/symbol_search/?${params.toString()}`, {
                headers: {
                    'Accept': 'application/json,text/plain,*/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.tradingview.com/',
                    'Origin': 'https://www.tradingview.com',
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            console.log(`[MarketService] TradingView Response Status: ${response.status}`);

            if (response.ok) {
                const data = await response.json();
                const items = Array.isArray(data) ? data : (Array.isArray(data?.symbols) ? data.symbols : []);
                tvResults = items
                    .map((item: any) => {
                        const rawExchange = item.exchange || item.exchange_name || '';
                        const rawSymbol = item.symbol || item.ticker || '';
                        const rawName = item.description || item.full_name || item.name || rawSymbol;
                        const exchange = this.stripHtml(String(rawExchange || ''));
                        const symbol = this.stripHtml(String(rawSymbol || ''));
                        const name = this.stripHtml(String(rawName || symbol));
                        const type = item.type || item.contract || 'stock';
                        const tvSymbol = exchange && symbol
                            ? `${exchange}:${symbol}`
                            : this.stripHtml(String(item.full_name || symbol));
                        return {
                            symbol: tvSymbol,
                            exchange,
                            name,
                            type,
                        };
                    })
                    .filter((item: any) => item.symbol);
            }
        } catch (error) {
            console.error('[MarketService] TradingView search failed:', error);
        }

        const merged = [...directSymbolResult, ...localResults, ...tvResults];
        const deduped = merged.filter((item, idx, arr) => arr.findIndex((x) => x.symbol === item.symbol) === idx);

        if (deduped.length > 0) {
            console.log(`[MarketService] Returning ${deduped.length} symbol results`);
            return deduped.slice(0, 30);
        }

        console.log('[MarketService] Returning empty results');
        return directSymbolResult;
    }

    private normalizeQuoteInputSymbol(symbol: string) {
        const normalized = (symbol || '').trim().toUpperCase();
        if (!normalized) return '';

        const [exchange, ...rest] = normalized.split(':');
        if (rest.length === 0) {
            return normalized;
        }

        const ticker = rest.join(':');
        if (exchange === 'BYMA') {
            return `BCBA:${ticker}`;
        }

        return normalized;
    }

    private buildSymbolCandidates(rawSymbol: string) {
        const cleaned = this.normalizeQuoteInputSymbol(rawSymbol);
        if (!cleaned) return [];
        if (cleaned.includes(':')) {
            const [exchange, ...rest] = cleaned.split(':');
            const ticker = rest.join(':');

            if (exchange === 'BCBA') {
                return [cleaned, `BYMA:${ticker}`];
            }

            return [cleaned];
        }

        const cryptoAliases: Record<string, string[]> = {
            BTC: ['BINANCE:BTCUSDT', 'CRYPTO:BTCUSD'],
            BTCUSD: ['BINANCE:BTCUSDT', 'CRYPTO:BTCUSD'],
            ETH: ['BINANCE:ETHUSDT', 'CRYPTO:ETHUSD'],
            ETHUSD: ['BINANCE:ETHUSDT', 'CRYPTO:ETHUSD'],
            BNB: ['BINANCE:BNBUSDT'],
            SOL: ['BINANCE:SOLUSDT'],
            ADA: ['BINANCE:ADAUSDT'],
            XRP: ['BINANCE:XRPUSDT'],
        };

        if (cryptoAliases[cleaned]) {
            return cryptoAliases[cleaned];
        }

        if (/^[A-Z0-9._-]+USDT$/.test(cleaned)) {
            return [`BINANCE:${cleaned}`];
        }

        return [`NASDAQ:${cleaned}`, `NYSE:${cleaned}`, `AMEX:${cleaned}`, `BCBA:${cleaned}`];
    }

    private async fetchScannerQuotes(tickers: string[]) {
        const dedupedTickers = Array.from(new Set(tickers.filter(Boolean)));
        const quoteMap = new Map<string, ScannerQuote>();

        if (dedupedTickers.length === 0) {
            return quoteMap;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch('https://scanner.tradingview.com/global/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json,text/plain,*/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.tradingview.com/',
                    'Origin': 'https://www.tradingview.com',
                },
                body: JSON.stringify({
                    symbols: {
                        tickers: dedupedTickers,
                        query: { types: [] },
                    },
                    columns: ['close', 'change', 'change_abs', 'volume', 'Recommend.All'],
                }),
                signal: controller.signal,
            });

            console.log(`[MarketService] Scanner response status: ${response.status}`);

            if (!response.ok) {
                return quoteMap;
            }

            const payload = await response.json();
            const rows = Array.isArray(payload?.data) ? payload.data : [];

            rows.forEach((item: any, index: number) => {
                const symbol = String(item?.s || dedupedTickers[index] || '').toUpperCase();
                const values = item?.d;
                if (!symbol || !Array.isArray(values)) return;

                const price = typeof values[0] === 'number' && Number.isFinite(values[0]) ? values[0] : null;
                const change = typeof values[1] === 'number' && Number.isFinite(values[1]) ? values[1] : null;
                if (price === null) return;

                quoteMap.set(symbol, { price, change });
            });
        } catch (error) {
            console.error('[MarketService] Scanner quote fetch failed:', error);
        } finally {
            clearTimeout(timeoutId);
        }

        return quoteMap;
    }

    async getQuotes(symbols: string[]): Promise<MarketQuote[]> {
        const normalizedInputs = symbols
            .map((symbol) => this.normalizeQuoteInputSymbol(symbol))
            .filter(Boolean);

        if (normalizedInputs.length === 0) {
            return [];
        }

        const candidatesByInput = new Map<string, string[]>();
        const allCandidates: string[] = [];

        for (const inputSymbol of normalizedInputs) {
            const candidates = this.buildSymbolCandidates(inputSymbol);
            candidatesByInput.set(inputSymbol, candidates);
            allCandidates.push(...candidates);
        }

        const scannerQuotes = await this.fetchScannerQuotes(allCandidates);
        const updatedAt = new Date().toISOString();

        return normalizedInputs.map((inputSymbol) => {
            const candidates = candidatesByInput.get(inputSymbol) || [];
            const matchedSymbol = candidates.find((candidate) => scannerQuotes.has(candidate)) || candidates[0] || inputSymbol;
            const match = scannerQuotes.get(matchedSymbol);

            return {
                inputSymbol,
                symbol: matchedSymbol,
                price: match?.price ?? null,
                change: match?.change ?? null,
                updatedAt,
                unavailable: !match,
            };
        });
    }

    async getQuote(symbol: string): Promise<MarketQuote> {
        console.log(`[MarketService] Getting quote for: ${symbol}`);
        const normalizedInput = this.normalizeQuoteInputSymbol(symbol);

        if (!normalizedInput) {
            return {
                inputSymbol: '',
                symbol: '',
                price: null,
                change: null,
                updatedAt: new Date().toISOString(),
                unavailable: true,
            };
        }

        const [quote] = await this.getQuotes([normalizedInput]);
        if (quote) return quote;

        return {
            inputSymbol: normalizedInput,
            symbol: normalizedInput,
            price: null,
            change: null,
            updatedAt: new Date().toISOString(),
            unavailable: true,
        };
    }

    private normalizeFinvizSubtype(rawSubtype: string) {
        const normalized = (rawSubtype || '').trim().toLowerCase();
        const allowed: Record<string, string> = {
            day: 'd1',
            d1: 'd1',
            week: 'w1',
            w1: 'w1',
            ytd: 'ytd',
        };
        return allowed[normalized] || 'd1';
    }

    private extractBalancedObjectLiteral(input: string, startIndex: number) {
        let depth = 0;
        let inString = false;
        let quoteChar = '';
        let isEscaped = false;

        for (let i = startIndex; i < input.length; i++) {
            const ch = input[i];

            if (inString) {
                if (isEscaped) {
                    isEscaped = false;
                    continue;
                }
                if (ch === '\\') {
                    isEscaped = true;
                    continue;
                }
                if (ch === quoteChar) {
                    inString = false;
                    quoteChar = '';
                }
                continue;
            }

            if (ch === '"' || ch === "'") {
                inString = true;
                quoteChar = ch;
                continue;
            }

            if (ch === '{') {
                depth += 1;
            } else if (ch === '}') {
                depth -= 1;
                if (depth === 0) {
                    return input.slice(startIndex, i + 1);
                }
            }
        }

        throw new Error('Could not parse Finviz base object literal');
    }

    private quoteUnquotedObjectKeys(input: string) {
        return input.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');
    }

    private parseFinvizBaseScript(scriptBody: string): FinvizBaseNode {
        const marker = 'e.exports=';
        const markerIndex = scriptBody.indexOf(marker);
        if (markerIndex === -1) {
            throw new Error('Finviz base marker not found');
        }

        const objectStart = markerIndex + marker.length;
        const objectLiteral = this.extractBalancedObjectLiteral(scriptBody, objectStart);
        const jsonLikeObject = this.quoteUnquotedObjectKeys(objectLiteral);
        const parsed = JSON.parse(jsonLikeObject) as FinvizBaseNode;

        if (!parsed || parsed.name !== 'Root' || !Array.isArray(parsed.children)) {
            throw new Error('Finviz base payload has unexpected shape');
        }

        return parsed;
    }

    private async discoverFinvizBaseScriptPath() {
        try {
            const response = await fetch('https://finviz.com/map.ashx?t=sec', {
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
            });

            if (!response.ok) {
                return this.finvizDefaultBaseScript;
            }

            const html = await response.text();
            const match = html.match(/href="(\/assets\/dist-legacy\/map_base_sec[^"]+\.js)"/i);
            return match?.[1] || this.finvizDefaultBaseScript;
        } catch {
            return this.finvizDefaultBaseScript;
        }
    }

    private async getFinvizBaseTree() {
        const now = Date.now();
        if (this.finvizBaseCache && now - this.finvizBaseCache.fetchedAt < this.finvizBaseTtlMs) {
            return this.finvizBaseCache.data;
        }

        const scriptPath = await this.discoverFinvizBaseScriptPath();
        const baseScriptUrl = `https://finviz.com${scriptPath}`;
        const response = await fetch(baseScriptUrl, {
            headers: {
                'Accept': 'application/javascript,text/javascript,*/*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://finviz.com/map.ashx?t=sec',
            },
        });

        if (!response.ok) {
            throw new Error(`Finviz base script failed with ${response.status}`);
        }

        const scriptBody = await response.text();
        const parsedTree = this.parseFinvizBaseScript(scriptBody);
        this.finvizBaseCache = { data: parsedTree, fetchedAt: now };
        return parsedTree;
    }

    private collectSectorTickers(
        node: FinvizBaseNode,
        sectorName: string,
        industryName: string,
        perfByTicker: Record<string, number>,
        output: FinvizTickerNode[]
    ) {
        if (Array.isArray(node.children) && node.children.length > 0) {
            for (const child of node.children) {
                this.collectSectorTickers(child, sectorName, node.name || industryName, perfByTicker, output);
            }
            return;
        }

        const ticker = (node.name || '').trim();
        if (!ticker) return;

        const marketCap = typeof node.value === 'number' && Number.isFinite(node.value) ? node.value : 0;
        const perf = typeof perfByTicker[ticker] === 'number' ? perfByTicker[ticker] : 0;

        output.push({
            name: ticker,
            description: node.description || ticker,
            industry: industryName || 'Other',
            sector: sectorName || 'Other',
            value: marketCap,
            perf,
        });
    }

    private buildFinvizSectors(baseRoot: FinvizBaseNode, perfByTicker: Record<string, number>) {
        const sectors: FinvizSectorNode[] = [];
        const sectorNodes = Array.isArray(baseRoot.children) ? baseRoot.children : [];

        for (const sectorNode of sectorNodes) {
            const sectorName = sectorNode.name || 'Other';
            const sectorTickers: FinvizTickerNode[] = [];
            const industries = Array.isArray(sectorNode.children) ? sectorNode.children : [];

            for (const industryNode of industries) {
                this.collectSectorTickers(industryNode, sectorName, industryNode.name || 'Other', perfByTicker, sectorTickers);
            }

            if (sectorTickers.length === 0) continue;

            sectorTickers.sort((a, b) => b.value - a.value);
            const sectorValue = sectorTickers.reduce((sum, ticker) => sum + ticker.value, 0);
            const weightedPerf = sectorValue > 0
                ? sectorTickers.reduce((sum, ticker) => sum + (ticker.perf * ticker.value), 0) / sectorValue
                : 0;

            sectors.push({
                name: sectorName,
                value: sectorValue,
                perf: Number(weightedPerf.toFixed(3)),
                children: sectorTickers,
            });
        }

        sectors.sort((a, b) => b.value - a.value);
        return sectors;
    }

    private getFinvizStats(sectors: FinvizSectorNode[]) {
        const allTickers = sectors.flatMap((sector) => sector.children);
        const upCount = allTickers.filter((ticker) => ticker.perf > 0).length;
        const downCount = allTickers.filter((ticker) => ticker.perf < 0).length;
        const unchangedCount = allTickers.length - upCount - downCount;

        const gainers = [...allTickers]
            .sort((a, b) => b.perf - a.perf)
            .slice(0, 8);
        const losers = [...allTickers]
            .sort((a, b) => a.perf - b.perf)
            .slice(0, 8);

        return {
            tickerCount: allTickers.length,
            totalMarketCap: Math.round(allTickers.reduce((sum, ticker) => sum + ticker.value, 0)),
            upCount,
            downCount,
            unchangedCount,
            topMovers: {
                gainers,
                losers,
            },
        };
    }

    async getFinvizHeatmap(subtype = 'd1') {
        const normalizedSubtype = this.normalizeFinvizSubtype(subtype);
        const now = Date.now();
        const cached = this.finvizHeatmapCache.get(normalizedSubtype);
        if (cached && now - cached.fetchedAt < this.finvizHeatmapTtlMs) {
            return cached.data;
        }

        try {
            const baseRoot = await this.getFinvizBaseTree();
            const perfResponse = await fetch(
                `https://finviz.com/api/map_perf.ashx?t=sec&st=${encodeURIComponent(normalizedSubtype)}`,
                {
                    headers: {
                        'Accept': 'application/json,text/plain,*/*',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://finviz.com/map.ashx?t=sec',
                    },
                }
            );

            if (!perfResponse.ok) {
                throw new Error(`Finviz perf request failed with ${perfResponse.status}`);
            }

            const perfData = await perfResponse.json() as FinvizPerfResponse;
            const perfByTicker = perfData?.nodes || {};
            const sectors = this.buildFinvizSectors(baseRoot, perfByTicker);
            const stats = this.getFinvizStats(sectors);

            const payload = {
                source: 'finviz',
                subtype: perfData?.subtype || normalizedSubtype,
                updatedAt: new Date().toISOString(),
                sectors,
                stats,
            };

            this.finvizHeatmapCache.set(normalizedSubtype, { data: payload, fetchedAt: now });
            return payload;
        } catch (error) {
            console.error('[MarketService] Finviz heatmap failed:', error);

            if (cached) {
                return cached.data;
            }

            return {
                source: 'finviz',
                subtype: normalizedSubtype,
                updatedAt: new Date().toISOString(),
                sectors: [],
                stats: {
                    tickerCount: 0,
                    totalMarketCap: 0,
                    upCount: 0,
                    downCount: 0,
                    unchangedCount: 0,
                    topMovers: {
                        gainers: [],
                        losers: [],
                    },
                },
            };
        }
    }

    async getDolarMep() {
        // Fetch from public Argentine API
        try {
            const res = await fetch('https://dolarapi.com/v1/dolares/bolsa');
            if (res.ok) {
                const data = await res.json();
                return {
                    compra: data.compra || 0,
                    venta: data.venta || 0,
                    fecha: data.fechaActualizacion || new Date().toISOString(),
                };
            }
        } catch (error) {
            console.error('Error fetching dolar MEP:', error);
        }

        // Fallback
        return {
            compra: 1000 + Math.random() * 50,
            venta: 1020 + Math.random() * 50,
            fecha: new Date().toISOString(),
        };
    }

    private decodeHtmlEntities(value: string) {
        return value
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'")
            .replace(/&apos;/gi, "'")
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
            .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
    }

    private stripTags(value: string) {
        return this.decodeHtmlEntities(value)
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private escapeRegExp(value: string) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private buildGoogleNewsSearchUrl(query: string) {
        const params = new URLSearchParams({
            q: query,
            hl: 'es-419',
            gl: 'AR',
            ceid: 'AR:es-419',
        });

        return `https://news.google.com/rss/search?${params.toString()}`;
    }

    private buildMarketNewsFeeds(): MarketNewsFeed[] {
        return [
            {
                bucket: 'argentina',
                url: this.buildGoogleNewsSearchUrl('economia argentina mercados inversiones bolsa buenos aires dolar riesgo pais'),
            },
            {
                bucket: 'argentina',
                url: this.buildGoogleNewsSearchUrl('acciones argentinas bonos bcra inflacion empresas argentina'),
            },
            {
                bucket: 'global',
                url: this.buildGoogleNewsSearchUrl('wall street reserva federal petroleo bolsas economia internacional'),
            },
            {
                bucket: 'global',
                url: this.buildGoogleNewsSearchUrl('mercados internacionales fed china europa petroleo'),
            },
        ];
    }

    private parseRSS(xml: string, fallbackSource = 'Google Noticias'): NewsItem[] {
        const items: NewsItem[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xml)) !== null) {
            const itemContent = match[1];

            const getTag = (tag: string) => {
                const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
                const complexMatch = itemContent.match(regex);
                if (complexMatch) return complexMatch[1].trim();
                return '';
            };

            const rawTitle = getTag('title');
            const link = this.stripTags(getTag('link'));
            const pubDate = getTag('pubDate');
            const rawDescription = getTag('description');
            const source = this.stripTags(getTag('source')) || fallbackSource;

            const cleanTitle = this.stripTags(rawTitle);
            const titleSuffix = source ? ` - ${source}` : '';
            const title = source && cleanTitle.toLowerCase().endsWith(titleSuffix.toLowerCase())
                ? cleanTitle.slice(0, -titleSuffix.length).trim()
                : cleanTitle;

            const cleanDescription = this.stripTags(rawDescription)
                .replace(source ? new RegExp(`\\s*${this.escapeRegExp(source)}\\s*$`, 'i') : /$^/, '')
                .trim();
            const summary = cleanDescription && cleanDescription.toLowerCase() !== title.toLowerCase()
                ? cleanDescription.slice(0, 220)
                : '';

            let image = '';
            const mediaRegex = /<media:content[^>]*url="([^"]*)"/i;
            const mediaMatch = itemContent.match(mediaRegex);
            if (mediaMatch) {
                image = mediaMatch[1];
            } else {
                const decodedDescription = this.decodeHtmlEntities(rawDescription);
                const imgRegex = /<img[^>]+src="([^"]+)"/i;
                const imgMatch = decodedDescription.match(imgRegex);
                if (imgMatch) image = imgMatch[1];
            }

            if (title && link) {
                items.push({
                    title,
                    link,
                    publishedAt: pubDate || new Date().toISOString(),
                    source,
                    summary,
                    image: image || undefined,
                });
            }
        }
        return items;
    }

    private looksSpanish(item: NewsItem) {
        const text = `${item.title} ${item.summary}`.toLowerCase();
        if (/[áéíóúñ¿¡]/i.test(text)) {
            return true;
        }

        const matches = text.match(/\b(el|la|los|las|de|del|por|para|con|sin|mercado|mercados|economia|economía|acciones|bonos|dolar|dólar|bolsa|tasas|inflacion|inflación|federal|petroleo|petróleo|riesgo|pais|país)\b/g);
        return (matches?.length ?? 0) >= 2;
    }

    private dedupeNews(items: NewsItem[]) {
        const seen = new Set<string>();

        return items.filter((item) => {
            const key = `${item.title.toLowerCase()}|${item.source.toLowerCase()}`;
            if (seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
    }

    private sortNewsByDate(items: NewsItem[]) {
        return [...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    private async fetchNewsFeed(feed: MarketNewsFeed) {
        const response = await fetch(feed.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            throw new Error(`RSS fetch failed: ${response.status}`);
        }

        const xml = await response.text();
        return this.parseRSS(xml).filter((item) => this.looksSpanish(item));
    }

    private getFallbackMarketNews() {
        return [
            {
                title: 'Mercados: suben las acciones y los bonos argentinos tras una jornada de alivio',
                link: '#',
                publishedAt: new Date().toISOString(),
                source: 'Infobae',
                summary: 'Seguimiento de acciones, bonos, dólar y riesgo país con foco en la plaza local.',
            },
            {
                title: 'El dólar y el riesgo país marcan el pulso financiero de la semana en Argentina',
                link: '#',
                publishedAt: new Date(Date.now() - 45 * 60000).toISOString(),
                source: 'La Nación',
                summary: 'Cobertura sobre tipo de cambio, deuda soberana y expectativa por las próximas medidas económicas.',
            },
            {
                title: 'Empresas argentinas y BCRA, en el centro del radar de los inversores',
                link: '#',
                publishedAt: new Date(Date.now() - 90 * 60000).toISOString(),
                source: 'Ámbito',
                summary: 'El mercado sigue de cerca inflación, tasas y señales del Banco Central.',
            },
            {
                title: 'Wall Street y la Reserva Federal condicionan el ánimo global de los mercados',
                link: '#',
                publishedAt: new Date(Date.now() - 135 * 60000).toISOString(),
                source: 'France 24',
                summary: 'La lectura internacional se concentra en tasas, bonos y expectativa por la política monetaria de EE. UU.',
            },
            {
                title: 'El petróleo y las commodities vuelven a impactar en la dinámica financiera internacional',
                link: '#',
                publishedAt: new Date(Date.now() - 180 * 60000).toISOString(),
                source: 'BBC',
                summary: 'Energía y materias primas siguen siendo catalizadores clave para bolsas y monedas.',
            },
        ];
    }

    async getNews(_symbol?: string) {
        if (this.marketNewsCache && (Date.now() - this.marketNewsCache.fetchedAt) < this.marketNewsTtlMs) {
            return this.marketNewsCache.data;
        }

        try {
            const feeds = this.buildMarketNewsFeeds();
            const settled = await Promise.allSettled(
                feeds.map(async (feed) => ({
                    bucket: feed.bucket,
                    items: await this.fetchNewsFeed(feed),
                }))
            );

            const argentinaItems = this.sortNewsByDate(
                this.dedupeNews(
                    settled
                        .filter((result): result is PromiseFulfilledResult<{ bucket: 'argentina' | 'global'; items: NewsItem[] }> => result.status === 'fulfilled' && result.value.bucket === 'argentina')
                        .flatMap((result) => result.value.items)
                )
            );
            const globalItems = this.sortNewsByDate(
                this.dedupeNews(
                    settled
                        .filter((result): result is PromiseFulfilledResult<{ bucket: 'argentina' | 'global'; items: NewsItem[] }> => result.status === 'fulfilled' && result.value.bucket === 'global')
                        .flatMap((result) => result.value.items)
                )
            );

            const prioritized = this.dedupeNews([
                ...argentinaItems.slice(0, 7),
                ...globalItems.slice(0, 3),
            ]);

            const completed = prioritized.length >= 8
                ? prioritized
                : this.dedupeNews([
                    ...prioritized,
                    ...argentinaItems,
                    ...globalItems,
                ]).slice(0, 10);

            const news = this.sortNewsByDate(completed).slice(0, 10);

            if (news.length === 0) {
                const fallback = this.getFallbackMarketNews();
                this.marketNewsCache = { data: fallback, fetchedAt: Date.now() };
                return fallback;
            }

            this.marketNewsCache = { data: news, fetchedAt: Date.now() };
            return news;

        } catch (error) {
            console.error('[MarketService] Failed to fetch news:', error);
            const fallback = this.getFallbackMarketNews();
            this.marketNewsCache = { data: fallback, fetchedAt: Date.now() };
            return fallback;
        }
    }
}
