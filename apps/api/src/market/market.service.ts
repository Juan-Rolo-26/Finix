import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { mkdir, readFile, writeFile, rename } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma.service';
import { CEDEAR_REGISTRY, getCedearDefinition, CedearDefinition } from './cedear.data';

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
    premarketPrice?: number | null;
    premarketChange?: number | null;
    updatedAt: string;
    unavailable: boolean;
}

interface ScannerQuote {
    price: number;
    change: number | null;
    premarketPrice?: number | null;
    premarketChange?: number | null;
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
    private searchCache = new Map<string, { data: any[]; fetchedAt: number }>();
    private marketNewsCache: { data: NewsItem[]; fetchedAt: number } | null = null;
    private readonly finvizBaseTtlMs = 6 * 60 * 60 * 1000;
    private readonly finvizHeatmapTtlMs = 60 * 1000;
    private readonly marketNewsTtlMs = 5 * 60 * 1000;
    private tickersCache: { data: any[]; fetchedAt: number } | null = null;
    private readonly tickersTtlMs = 60 * 1000; // 1 minute
    private sp500TechnicalHeatmapCache: { data: any; fetchedAt: number } | null = null;
    private readonly sp500TechnicalHeatmapTtlMs = 3 * 60 * 1000; // 3 minutes
    private premarketCache: { data: any; fetchedAt: number } | null = null;
    private premarketFrozenSession: { dateKey: string; data: any } | null = null;
    private readonly premarketTtlMs = 60 * 1000; // 60 seconds – matches frontend refresh interval
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
                description: 'Índice líder de la bolsa argentina',
                format: 'number',
            },
            {
                id: 'ggal',
                symbol: 'BCBA:GGAL',
                label: 'Grupo Financiero Galicia',
                description: 'Líder del sector bancario argentino',
                format: 'currency',
                currency: 'ARS',
            },
            {
                id: 'ypfd',
                symbol: 'BCBA:YPFD',
                label: 'YPF',
                description: 'Energía y desarrollo de Vaca Muerta',
                format: 'currency',
                currency: 'ARS',
            },
            {
                id: 'bma',
                symbol: 'BCBA:BMA',
                label: 'Banco Macro',
                description: 'Banca comercial y corporativa',
                format: 'currency',
                currency: 'ARS',
            },
            {
                id: 'pamp',
                symbol: 'BCBA:PAMP',
                label: 'Pampa Energía',
                description: 'Generación, transporte y gas',
                format: 'currency',
                currency: 'ARS',
            },
            {
                id: 'meli',
                symbol: 'NASDAQ:MELI',
                label: 'MercadoLibre',
                description: 'Comercio electrónico y fintech regional',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'vist',
                symbol: 'NYSE:VIST',
                label: 'Vista Energy',
                description: 'Producción de shale oil en Vaca Muerta',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'cepu',
                symbol: 'BCBA:CEPU',
                label: 'Central Puerto',
                description: 'Generación de energía eléctrica',
                format: 'currency',
                currency: 'ARS',
            },
            {
                id: 'txar',
                symbol: 'BCBA:TXAR',
                label: 'Ternium Argentina',
                description: 'Producción de aceros planos',
                format: 'currency',
                currency: 'ARS',
            },
            {
                id: 'alua',
                symbol: 'BCBA:ALUA',
                label: 'Aluar',
                description: 'Aluminio y exportaciones industriales',
                format: 'currency',
                currency: 'ARS',
            },
            {
                id: 'cres',
                symbol: 'BCBA:CRES',
                label: 'Cresud',
                description: 'Líder agropecuario y bienes raíces',
                format: 'currency',
                currency: 'ARS',
            },
            {
                id: 'tgsu2',
                symbol: 'BCBA:TGSU2',
                label: 'TGS',
                description: 'Transportadora de Gas del Sur',
                format: 'currency',
                currency: 'ARS',
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
                description: 'Gigantes de tecnología y crecimiento',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'dowjones',
                symbol: 'AMEX:DIA',
                label: 'Dow Jones',
                description: 'Las 30 grandes corporaciones industriales',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'nvda',
                symbol: 'NASDAQ:NVDA',
                label: 'NVIDIA',
                description: 'Líder mundial en IA y semiconductores',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'aapl',
                symbol: 'NASDAQ:AAPL',
                label: 'Apple',
                description: 'Ecosistema de consumo y servicios tecnológicos',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'msft',
                symbol: 'NASDAQ:MSFT',
                label: 'Microsoft',
                description: 'Nube Azure, IA y software corporativo',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'tsla',
                symbol: 'NASDAQ:TSLA',
                label: 'Tesla',
                description: 'Vehículos eléctricos y energía renovable',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'amzn',
                symbol: 'NASDAQ:AMZN',
                label: 'Amazon',
                description: 'E-commerce global y computación en nube',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'meta',
                symbol: 'NASDAQ:META',
                label: 'Meta Platforms',
                description: 'Redes sociales y tecnologías inmersivas',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'googl',
                symbol: 'NASDAQ:GOOGL',
                label: 'Alphabet (Google)',
                description: 'Búsqueda, YouTube y modelos de IA',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'nikkei225',
                symbol: 'TVC:NI225',
                label: 'Nikkei 225',
                description: 'Índice de la Bolsa de Tokio (Japón)',
                format: 'number',
            },
            {
                id: 'hang-seng',
                symbol: 'TVC:HSI',
                label: 'Hang Seng',
                description: 'Mercado bursátil de Hong Kong y Asia',
                format: 'number',
            },
        ],
        crypto: [
            {
                id: 'btc',
                symbol: 'CRYPTO:BTCUSD',
                label: 'Bitcoin',
                description: 'Referencia principal del ecosistema cripto',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'eth',
                symbol: 'CRYPTO:ETHUSD',
                label: 'Ethereum',
                description: 'Plataforma líder de contratos inteligentes',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'sol',
                symbol: 'BINANCE:SOLUSDT',
                label: 'Solana',
                description: 'Alta velocidad y ecosistema descentralizado',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'xrp',
                symbol: 'BINANCE:XRPUSDT',
                label: 'XRP',
                description: 'Red de liquidación y pagos transfronterizos',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'bnb',
                symbol: 'BINANCE:BNBUSDT',
                label: 'BNB',
                description: 'Token del ecosistema Binance y BNB Chain',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'ada',
                symbol: 'BINANCE:ADAUSDT',
                label: 'Cardano',
                description: 'Blockchain de tercera generación con PoS',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'doge',
                symbol: 'BINANCE:DOGEUSDT',
                label: 'Dogecoin',
                description: 'Activo digital comunitario y pagos rápidos',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'avax',
                symbol: 'BINANCE:AVAXUSDT',
                label: 'Avalanche',
                description: 'Red escalable orientada a finanzas DeFi',
                format: 'currency',
                currency: 'USD',
            },
        ],
        commodities: [
            {
                id: 'gold',
                symbol: 'OANDA:XAUUSD',
                label: 'Oro',
                description: 'Activo refugio por excelencia en los mercados',
                format: 'currency',
                currency: 'USD',
            },
            {
                id: 'copper',
                symbol: 'COMEX:HG1!',
                label: 'Cobre',
                description: 'Termómetro de la actividad industrial mundial',
                format: 'number',
            },
            {
                id: 'natgas',
                symbol: 'NYMEX:NG1!',
                label: 'Gas Natural',
                description: 'Referencia térmica y energética global',
                format: 'number',
            },
            {
                id: 'soybeans',
                symbol: 'CBOT:ZS1!',
                label: 'Soja',
                description: 'Commodity clave de la balanza comercial argentina',
                format: 'number',
            },
            {
                id: 'wheat',
                symbol: 'CBOT:ZW1!',
                label: 'Trigo',
                description: 'Cereal fundamental de exportación y consumo',
                format: 'number',
            },
            {
                id: 'silver',
                symbol: 'COMEX:SI1!',
                label: 'Plata',
                description: 'Metal precioso con uso industrial y monetario',
                format: 'number',
            },
            {
                id: 'corn',
                symbol: 'CBOT:ZC1!',
                label: 'Maíz',
                description: 'Grano clave para alimentos, energía y exportaciones',
                format: 'number',
            },
            {
                id: 'wti',
                symbol: 'NYMEX:CL1!',
                label: 'Petróleo WTI',
                description: 'Referencia del crudo estadounidense',
                format: 'currency',
                currency: 'USD',
            },
        ],
        indicators: [
            {
                id: 'dxy',
                symbol: 'TVC:DXY',
                label: 'Índice Dólar (DXY)',
                description: 'Fortaleza global del USD ante canasta de monedas',
                format: 'number',
            },
            {
                id: 'us10y',
                symbol: 'TVC:US10Y',
                label: 'Bono 10Y EE. UU.',
                description: 'Rendimiento de los bonos del Tesoro a 10 años',
                format: 'percent',
            },
            {
                id: 'us02y',
                symbol: 'TVC:US02Y',
                label: 'Bono 2Y EE. UU.',
                description: 'Tasa a 2 años y expectativas de política monetaria',
                format: 'percent',
            },
            {
                id: 'vix',
                symbol: 'TVC:VIX',
                label: 'Índice VIX',
                description: 'Volatilidad implícita y termómetro de riesgo',
                format: 'number',
            },
            {
                id: 'spx',
                symbol: 'TVC:SPX',
                label: 'S&P 500',
                description: 'Referencia principal de la renta variable estadounidense',
                format: 'number',
            },
            {
                id: 'bcra-rate',
                symbol: 'ECONOMICS:ARINTR',
                label: 'Tasa BCRA',
                description: 'Tasa de política monetaria en Argentina',
                format: 'percent',
            },
        ],
    } satisfies Record<string, MarketDashboardAssetDefinition[]>;

    private readonly premarketCatalog = {
        indices: [
            ...[
                ['AMEX:EWJ', 'Japón · EWJ'], ['AMEX:EWZ', 'Brasil · EWZ'],
                ['AMEX:FXI', 'China · FXI'], ['AMEX:FEZ', 'Eurozona · FEZ'],
                ['AMEX:EWU', 'Reino Unido · EWU'], ['AMEX:EEM', 'Emergentes · EEM'],
            ].map(([symbol, label]) => ({ id: symbol, symbol, label, description: 'ETF regional (USD)', format: 'currency' as DashboardValueFormat, currency: 'USD' as const })),
            {
                id: 'sp500-fut',
                symbol: 'AMEX:SPY',
                label: 'S&P 500 (SPY)',
                description: 'Principal índice de referencia de Wall Street',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'nasdaq-fut',
                symbol: 'NASDAQ:QQQ',
                label: 'Nasdaq 100 (QQQ)',
                description: 'Futuros y proxy de alta tecnología y crecimiento',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'dow-fut',
                symbol: 'AMEX:DIA',
                label: 'Dow Jones (DIA)',
                description: 'Las 30 corporaciones industriales líderes',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'russell-fut',
                symbol: 'AMEX:IWM',
                label: 'Russell 2000 (IWM)',
                description: 'Small caps y empresas de mediana capitalización',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'vix-ind',
                symbol: 'TVC:VIX',
                label: 'Índice VIX',
                description: 'Termómetro de volatilidad y riesgo en opciones',
                format: 'number' as DashboardValueFormat,
            },
            {
                id: 'dxy-ind',
                symbol: 'TVC:DXY',
                label: 'Dólar Index (DXY)',
                description: 'Fortaleza del dólar frente a monedas globales',
                format: 'number' as DashboardValueFormat,
            },
            {
                id: 'us10y-ind',
                symbol: 'TVC:US10Y',
                label: 'Bono 10Y EE. UU.',
                description: 'Rendimiento de los bonos del Tesoro americano',
                format: 'percent' as DashboardValueFormat,
            },
        ],
        commodities: [
            ...[['AMEX:SOYB', 'Soja · SOYB'], ['AMEX:WEAT', 'Trigo · WEAT'], ['AMEX:CORN', 'Maíz · CORN']]
                .map(([symbol, label]) => ({ id: symbol, symbol, label, description: 'ETF de materia prima (USD)', format: 'currency' as DashboardValueFormat, currency: 'USD' as const })),
            {
                id: 'gold-spot',
                symbol: 'OANDA:XAUUSD',
                label: 'Oro (Gold Spot)',
                description: 'Activo refugio por excelencia ante incertidumbre',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'wti-oil',
                symbol: 'NYMEX:CL1!',
                label: 'Petróleo WTI',
                description: 'Referencia de crudo ligero estadounidense',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'brent-oil',
                symbol: 'TVC:UKOIL',
                label: 'Petróleo Brent',
                description: 'Referencia internacional de hidrocarburos',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'silver-spot',
                symbol: 'COMEX:SI1!',
                label: 'Plata (Silver)',
                description: 'Metal con fuerte demanda industrial y monetaria',
                format: 'number' as DashboardValueFormat,
            },
            {
                id: 'natgas-fut',
                symbol: 'NYMEX:NG1!',
                label: 'Gas Natural',
                description: 'Insumo térmico y de generación eléctrica mundial',
                format: 'number' as DashboardValueFormat,
            },
            {
                id: 'copper-fut',
                symbol: 'COMEX:HG1!',
                label: 'Cobre',
                description: 'Termómetro de la actividad industrial y manufactura',
                format: 'number' as DashboardValueFormat,
            },
        ],
        magnificent7: [
            {
                id: 'nvda-mag',
                symbol: 'NASDAQ:NVDA',
                label: 'NVIDIA',
                description: 'Hardware y procesadores para centros de datos e IA',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'aapl-mag',
                symbol: 'NASDAQ:AAPL',
                label: 'Apple',
                description: 'Dispositivos premium, ecosistema iOS y servicios',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'msft-mag',
                symbol: 'NASDAQ:MSFT',
                label: 'Microsoft',
                description: 'Nube Azure, software corporativo e infraestructura IA',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'amzn-mag',
                symbol: 'NASDAQ:AMZN',
                label: 'Amazon',
                description: 'Comercio electrónico mundial y AWS Cloud',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'googl-mag',
                symbol: 'NASDAQ:GOOGL',
                label: 'Alphabet (Google)',
                description: 'Buscador, YouTube, Google Cloud y Gemini',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'meta-mag',
                symbol: 'NASDAQ:META',
                label: 'Meta Platforms',
                description: 'Redes sociales, mensajería y monetización publicitaria',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'tsla-mag',
                symbol: 'NASDAQ:TSLA',
                label: 'Tesla',
                description: 'Vehículos eléctricos, almacenamiento energético y robótica',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
        ],
        argentina: [
            {
                id: 'ypf-arg',
                symbol: 'NYSE:YPF',
                label: 'YPF (ADR)',
                description: 'Líder petrolero nacional y motor de Vaca Muerta',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'meli-arg',
                symbol: 'NASDAQ:MELI',
                label: 'MercadoLibre',
                description: 'Gigante regional de e-commerce y pagos digitales',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'ggal-arg',
                symbol: 'NASDAQ:GGAL',
                label: 'Galicia (ADR)',
                description: 'Mayor grupo bancario y financiero privado de Argentina',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'vist-arg',
                symbol: 'NYSE:VIST',
                label: 'Vista Energy',
                description: 'Productor independiente líder en shale oil',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'pam-arg',
                symbol: 'NYSE:PAM',
                label: 'Pampa Energía (ADR)',
                description: 'Líder integrado en electricidad, gas y petróleo',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'bma-arg',
                symbol: 'NYSE:BMA',
                label: 'Banco Macro (ADR)',
                description: 'Banca comercial con amplia presencia federal',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
        ],
        crypto: [
            {
                id: 'btc-pm',
                symbol: 'CRYPTO:BTCUSD',
                label: 'Bitcoin',
                description: 'Indicador 24/7 de liquidez y apetito por riesgo',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
            {
                id: 'eth-pm',
                symbol: 'CRYPTO:ETHUSD',
                label: 'Ethereum',
                description: 'Infraestructura descentralizada y contratos inteligentes',
                format: 'currency' as DashboardValueFormat,
                currency: 'USD' as const,
            },
        ],
    };

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

    private dollarRatesCache: { data: MarketDollarRate[]; timestamp: number } | null = null;

    async getDollarRates(): Promise<MarketDollarRate[]> {
        const now = Date.now();
        if (this.dollarRatesCache && now - this.dollarRatesCache.timestamp < 60000) {
            return this.dollarRatesCache.data;
        }

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

            const finalRates = rates.length > 0 ? rates : fallback;
            this.dollarRatesCache = { data: finalRates, timestamp: now };
            return finalRates;
        } catch (error) {
            console.error('[MarketService] Dollar rates failed:', error);
            if (this.dollarRatesCache?.data) {
                return this.dollarRatesCache.data;
            }
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

    private getPremarketSessionInfo() {
        const now = new Date();
        const nyDateStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
        const nyDate = new Date(nyDateStr);
        const day = nyDate.getDay();
        const hour = nyDate.getHours();
        const minute = nyDate.getMinutes();
        const totalMinutes = hour * 60 + minute;

        const isWeekend = day === 0 || day === 6;
        let status: 'pre-market' | 'regular' | 'post-market' | 'closed' = 'closed';
        let label = 'Mercado Cerrado';

        if (!isWeekend) {
            if (totalMinutes >= 4 * 60 && totalMinutes < 9 * 60 + 30) {
                status = 'pre-market';
                label = 'Pre-Market Abierto';
            } else if (totalMinutes >= 9 * 60 + 30 && totalMinutes < 16 * 60) {
                status = 'regular';
                label = 'Mercado Regular Abierto';
            } else if (totalMinutes >= 16 * 60 && totalMinutes < 20 * 60) {
                status = 'post-market';
                label = 'After-Hours (Post-Mercado)';
            } else {
                status = 'closed';
                label = 'Sesión Cerrada';
            }
        } else {
            status = 'closed';
            label = 'Fin de Semana (Cerrado)';
        }

        const nextBellNy = new Date(nyDate);
        if (isWeekend || totalMinutes >= 9 * 60 + 30) {
            let addDays = 1;
            if (day === 5 && totalMinutes >= 9 * 60 + 30) addDays = 3;
            else if (day === 6) addDays = 2;
            else if (day === 0) addDays = 1;
            nextBellNy.setDate(nextBellNy.getDate() + addDays);
        }
        nextBellNy.setHours(9, 30, 0, 0);

        const diffSeconds = Math.max(0, Math.round((nextBellNy.getTime() - nyDate.getTime()) / 1000));
        const dateKey = `${nyDate.getFullYear()}-${String(nyDate.getMonth() + 1).padStart(2, '0')}-${String(nyDate.getDate()).padStart(2, '0')}`;

        return {
            status,
            label,
            dateKey,
            nextBell: nextBellNy.toISOString(),
            secondsToOpen: diffSeconds,
        };
    }

    @Cron('0 20 10 * * *', { timeZone: 'America/Argentina/Buenos_Aires' })
    async refreshDailyPremarket() {
        const data = await this.getPremarket(true);
        const assets = [...data.indices, ...data.commodities, ...data.magnificent7, ...data.argentina, ...data.crypto];
        if (!assets.some(asset => asset.price != null)) throw new Error('No quotes available for daily premarket');
        await mkdir(this.premarketSnapshotDirectory, { recursive: true });
        const file = join(this.premarketSnapshotDirectory, 'premarket.json');
        await writeFile(`${file}.tmp`, JSON.stringify(data), 'utf8');
        await rename(`${file}.tmp`, file);
        this.dailyPremarket = data;
    }

    private dailyPremarket: any = null;
    private readonly premarketSnapshotDirectory = process.env.MARKET_SNAPSHOT_DIR || join(process.cwd(), '.cache', 'market');
    private snapshotLoaded = false;

    async getPremarket(forceRefresh = false) {
        const session = this.getPremarketSessionInfo();
        const isPremarketPassed = session.status !== 'pre-market';

        if (!this.snapshotLoaded) {
            this.snapshotLoaded = true;
            try {
                const saved = JSON.parse(await readFile(join(this.premarketSnapshotDirectory, 'premarket.json'), 'utf8'));
                if (saved.updatedAt && Array.isArray(saved.indices) && Array.isArray(saved.crypto)) {
                    this.dailyPremarket = saved;
                    if (!this.premarketFrozenSession) {
                        this.premarketFrozenSession = { dateKey: session.dateKey, data: saved };
                    }
                }
            } catch { /* First run has no saved edition. */ }
        }

        // Si ya pasó el horario de pre-market y tenemos datos congelados válidos para la fecha actual, los conservamos intactos
        if (!forceRefresh && isPremarketPassed && this.premarketFrozenSession && this.premarketFrozenSession.dateKey === session.dateKey) {
            return {
                ...this.premarketFrozenSession.data,
                updatedAt: this.premarketFrozenSession.data.updatedAt,
                isFrozenPremarket: true,
                session: {
                    ...session,
                    label: 'Pre-Market Finalizado (10:30 hs)',
                    sentiment: this.premarketFrozenSession.data.session.sentiment,
                    sentimentScore: this.premarketFrozenSession.data.session.sentimentScore,
                    sentimentSummary: this.premarketFrozenSession.data.session.sentimentSummary,
                },
            };
        }

        if (!forceRefresh && this.premarketCache && Date.now() - this.premarketCache.fetchedAt < this.premarketTtlMs) {
            return this.premarketCache.data;
        }

        const allDefinitions = [
            ...this.premarketCatalog.indices,
            ...this.premarketCatalog.commodities,
            ...this.premarketCatalog.magnificent7,
            ...this.premarketCatalog.argentina,
            ...this.premarketCatalog.crypto,
        ];

        const quotes = await this.getQuotes(allDefinitions.map(d => d.symbol));
        const quotesByInput = new Map(quotes.map(q => [this.normalizeQuoteInputSymbol(q.inputSymbol), q]));

        const mapPremarketAsset = (d: MarketDashboardAssetDefinition) => {
            const quote = quotesByInput.get(this.normalizeQuoteInputSymbol(d.symbol));
            const hasPremarket = quote?.premarketPrice != null && Number.isFinite(quote.premarketPrice);

            // Si el mercado regular abrió o si hay cotización de premarket, se fija la cotización de premarket
            const effectivePrice = (isPremarketPassed && hasPremarket)
                ? quote!.premarketPrice!
                : (hasPremarket ? quote!.premarketPrice! : (quote?.price ?? null));

            const effectiveChange = (isPremarketPassed && hasPremarket)
                ? (quote?.premarketChange ?? null)
                : (hasPremarket ? (quote?.premarketChange ?? null) : (quote?.change ?? null));

            return {
                ...d,
                price: effectivePrice,
                change: effectiveChange,
                premarketPrice: quote?.premarketPrice ?? null,
                premarketChange: quote?.premarketChange ?? null,
                regularPrice: quote?.price ?? null,
                regularChange: quote?.change ?? null,
                isPremarketQuote: hasPremarket,
                updatedAt: quote?.updatedAt || new Date().toISOString(),
                unavailable: effectivePrice === null,
            };
        };

        const indices = this.premarketCatalog.indices.map(mapPremarketAsset);
        const commodities = this.premarketCatalog.commodities.map(mapPremarketAsset);
        const magnificent7 = this.premarketCatalog.magnificent7.map(mapPremarketAsset);
        const argentina = this.premarketCatalog.argentina.map(mapPremarketAsset);
        const crypto = this.premarketCatalog.crypto.map(mapPremarketAsset);

        const leadingChanges = [
            ...indices.slice(0, 2).map(i => i.change),
            ...magnificent7.map(m => m.change),
        ].filter((c): c is number => c !== null);

        let sentiment: 'bullish' | 'neutral' | 'cautious' | 'bearish' = 'neutral';
        let sentimentScore = 50;
        let sentimentSummary = 'Pre-mercado plano sin tendencia predominante.';

        if (leadingChanges.length > 0) {
            const avgChange = leadingChanges.reduce((a, b) => a + b, 0) / leadingChanges.length;

            if (avgChange >= 0.35) {
                sentiment = 'bullish';
                sentimentScore = Math.min(95, 65 + Math.round(avgChange * 15));
                sentimentSummary = 'Fuerte sesgo comprador en futuros de Wall Street y Big Tech.';
            } else if (avgChange > 0.05) {
                sentiment = 'bullish';
                sentimentScore = Math.min(75, 55 + Math.round(avgChange * 20));
                sentimentSummary = 'Futuros en terreno positivo con optimismo moderado.';
            } else if (avgChange <= -0.35) {
                sentiment = 'bearish';
                sentimentScore = Math.max(10, 35 + Math.round(avgChange * 15));
                sentimentSummary = 'Presión vendedora y toma de ganancias en pre-apertura.';
            } else if (avgChange < -0.05) {
                sentiment = 'cautious';
                sentimentScore = Math.max(25, 45 + Math.round(avgChange * 20));
                sentimentSummary = 'Cautela en los mercados globales con leves bajas previas a la campana.';
            }
        }

        // Top 5 más alcistas y Top 5 más bajistas
        const allRankable = [
            ...indices,
            ...commodities,
            ...magnificent7,
            ...argentina,
        ].filter((item) => item.change !== null && Number.isFinite(item.change));

        const topGainers = [...allRankable]
            .sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
            .slice(0, 5);

        const topLosers = [...allRankable]
            .sort((a, b) => (a.change ?? 0) - (b.change ?? 0))
            .slice(0, 5);

        const payload = {
            updatedAt: new Date().toISOString(),
            scheduledSnapshot: forceRefresh,
            refreshTime: '10:20',
            refreshTimezone: 'America/Argentina/Buenos_Aires',
            isFrozenPremarket: isPremarketPassed,
            session: {
                ...session,
                label: isPremarketPassed ? 'Pre-Market Finalizado (10:30 hs)' : session.label,
                sentiment,
                sentimentScore,
                sentimentSummary,
            },
            topGainers,
            topLosers,
            indices,
            commodities,
            magnificent7,
            argentina,
            crypto,
        };

        this.premarketCache = { data: payload, fetchedAt: Date.now() };

        // Guardamos la sesión capturada para preservarla si abre la rueda regular
        if (session.status === 'pre-market' || isPremarketPassed || !this.premarketFrozenSession) {
            this.premarketFrozenSession = { dateKey: session.dateKey, data: payload };
            this.dailyPremarket = payload;
            try {
                mkdir(this.premarketSnapshotDirectory, { recursive: true }).then(() => {
                    const file = join(this.premarketSnapshotDirectory, 'premarket.json');
                    writeFile(file, JSON.stringify(payload), 'utf8').catch(() => {});
                }).catch(() => {});
            } catch { /* best effort */ }
        }

        return payload;
    }

    async getTickers() {
        if (this.tickersCache && Date.now() - this.tickersCache.fetchedAt < this.tickersTtlMs) {
            return this.tickersCache.data;
        }

        try {
            // Fetch real top gainers of the day (Large Cap US stocks)
            const response = await fetch('https://scanner.tradingview.com/america/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filter: [
                        { left: "type", operation: "in_range", right: ["stock"] },
                        { left: "market_cap_basic", operation: "egreater", right: 20000000000 }, // > 20B
                        { left: "exchange", operation: "in_range", right: ["NASDAQ", "NYSE"] }
                    ],
                    columns: ["name", "close", "change", "volume"],
                    sort: { sortBy: "change", sortOrder: "desc" },
                    range: [0, 10]
                })
            });

            if (!response.ok) throw new Error('Scanner failed');
            const data = await response.json();

            const result = data.data.map((item: any) => {
                const fullSymbol = item.s;
                const [shortSymbol, price, change, volume] = item.d;
                return {
                    symbol: fullSymbol,
                    shortSymbol: shortSymbol,
                    price: price,
                    change: change,
                    volume: volume
                };
            });

            this.tickersCache = { data: result, fetchedAt: Date.now() };
            return result;
        } catch (error) {
            console.error('[MarketService] Top gainers failed:', error);
            return [];
        }
    }

    async getSP500TechnicalHeatmap(forceRefresh = false) {
        if (!forceRefresh && this.sp500TechnicalHeatmapCache && Date.now() - this.sp500TechnicalHeatmapCache.fetchedAt < this.sp500TechnicalHeatmapTtlMs) {
            return this.sp500TechnicalHeatmapCache.data;
        }

        try {
            const response = await fetch('https://scanner.tradingview.com/america/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filter: [
                        { left: "type", operation: "in_range", right: ["stock"] },
                        { left: "is_primary", operation: "equal", right: true },
                        { left: "exchange", operation: "in_range", right: ["NASDAQ", "NYSE"] },
                        { left: "market_cap_basic", operation: "egreater", right: 8000000000 }
                    ],
                    columns: [
                        "name",
                        "description",
                        "sector",
                        "close",
                        "change",
                        "change|1W",
                        "market_cap_basic",
                        "RSI|1W",
                        "ADX|1W",
                        "Stoch.K|1W",
                        "MACD.macd|1W",
                        "MACD.signal|1W",
                        "MACD.hist|1W",
                        "volume"
                    ],
                    sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
                    range: [0, 250]
                })
            });

            if (!response.ok) throw new Error('TradingView scanner query failed');
            const resData = await response.json();

            const sectorMap: Record<string, string> = {
                'Technology Services': 'Tecnología',
                'Electronic Technology': 'Semiconductores & Hardware',
                'Finance': 'Finanzas',
                'Health Technology': 'Salud & Farma',
                'Health Services': 'Servicios de Salud',
                'Consumer Services': 'Servicios al Consumidor',
                'Consumer Non-Durables': 'Consumo Masivo',
                'Consumer Durables': 'Consumo Discrecional',
                'Retail Trade': 'Comercio Minorista',
                'Energy Minerals': 'Energía & Petróleo',
                'Producer Manufacturing': 'Industria & Manufactura',
                'Utilities': 'Servicios Públicos',
                'Communications': 'Telecomunicaciones',
                'Process Industries': 'Materiales Básicos',
                'Transportation': 'Transporte',
                'Commercial Services': 'Servicios Comerciales',
            };

            const items = (resData.data || []).map((item: any) => {
                const symbol = item.s;
                const [
                    ticker,
                    description,
                    rawSector,
                    close,
                    change1D,
                    change1W,
                    marketCap,
                    rawRsi,
                    rawAdx,
                    rawStoch,
                    rawMacd,
                    rawSignal,
                    rawHist,
                    volume
                ] = item.d;

                const rsi = typeof rawRsi === 'number' && Number.isFinite(rawRsi) ? Number(rawRsi.toFixed(1)) : 50;
                const adx = typeof rawAdx === 'number' && Number.isFinite(rawAdx) ? Number(rawAdx.toFixed(1)) : 20;
                const stoch = typeof rawStoch === 'number' && Number.isFinite(rawStoch) ? Number(rawStoch.toFixed(1)) : 50;
                const macd = typeof rawMacd === 'number' && Number.isFinite(rawMacd) ? Number(rawMacd.toFixed(2)) : 0;
                const signal = typeof rawSignal === 'number' && Number.isFinite(rawSignal) ? Number(rawSignal.toFixed(2)) : 0;
                const hist = typeof rawHist === 'number' && Number.isFinite(rawHist) ? Number(rawHist.toFixed(2)) : Number((macd - signal).toFixed(2));

                // Componente RSI (1W)
                let rsiScore = 0;
                let rsiState = 'Equilibrio';
                if (rsi < 30) {
                    rsiScore = 2; // Sobreventa extrema
                    rsiState = 'Sobreventa extrema (<30)';
                } else if (rsi < 45) {
                    rsiScore = 1; // Rango bajo / Acumulación
                    rsiState = 'Rango bajo (30-45)';
                } else if (rsi <= 55) {
                    rsiScore = 0;
                    rsiState = 'Zona Neutral (45-55)';
                } else if (rsi <= 70) {
                    rsiScore = -1; // Rango alto
                    rsiState = 'Rango alto (55-70)';
                } else {
                    rsiScore = -2; // Sobrecompra extrema
                    rsiState = 'Sobrecompra extrema (>70)';
                }

                // Componente MACD (1W)
                let macdScore = 0;
                let macdState = 'Neutral';
                const isBullishCross = hist > 0 && macd >= signal;
                const isBearishCross = hist < 0 && macd < signal;

                if (isBullishCross) {
                    if (macd < 0) {
                        macdScore = 2; // Cruce alcista desde piso
                        macdState = 'Cruce Alcista Reversión (Hist > 0)';
                    } else {
                        macdScore = 1; // Impulso alcista
                        macdState = 'Impulso Alcista (Hist > 0)';
                    }
                } else if (isBearishCross) {
                    if (macd > 0) {
                        macdScore = -2; // Cruce bajista desde techo
                        macdState = 'Cruce Bajista Distribución (Hist < 0)';
                    } else {
                        macdScore = -1; // Impulso bajista
                        macdState = 'Impulso Bajista (Hist < 0)';
                    }
                }

                const totalScore = rsiScore + macdScore;

                let signalType: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' = 'NEUTRAL';
                let signalLabel = 'NEUTRAL';
                let color = '#64748b'; // Slate 500
                let bgGradient = 'from-slate-500/20 to-slate-600/5';
                let borderHover = 'hover:border-slate-500/50';

                if (totalScore >= 2) {
                    signalType = 'STRONG_BUY';
                    signalLabel = 'COMPRA FUERTE';
                    color = '#10b981'; // Emerald 500
                    bgGradient = 'from-emerald-500/25 to-emerald-600/5';
                    borderHover = 'hover:border-emerald-500/70';
                } else if (totalScore === 1) {
                    signalType = 'BUY';
                    signalLabel = 'COMPRA';
                    color = '#34d399'; // Emerald 400
                    bgGradient = 'from-emerald-500/15 to-teal-600/5';
                    borderHover = 'hover:border-emerald-400/60';
                } else if (totalScore === -1) {
                    signalType = 'SELL';
                    signalLabel = 'VENTA';
                    color = '#fb923c'; // Orange 400
                    bgGradient = 'from-amber-500/15 to-orange-600/5';
                    borderHover = 'hover:border-orange-400/60';
                } else if (totalScore <= -2) {
                    signalType = 'STRONG_SELL';
                    signalLabel = 'VENTA FUERTE';
                    color = '#ef4444'; // Rose 500
                    bgGradient = 'from-rose-500/25 to-red-600/5';
                    borderHover = 'hover:border-rose-500/70';
                }

                return {
                    symbol,
                    ticker: ticker || symbol.split(':').pop(),
                    name: description || ticker,
                    sector: sectorMap[rawSector] || rawSector || 'Otros',
                    rawSector: rawSector || 'Other',
                    price: typeof close === 'number' ? Number(close.toFixed(2)) : 0,
                    change1D: typeof change1D === 'number' ? Number(change1D.toFixed(2)) : 0,
                    change1W: typeof change1W === 'number' ? Number(change1W.toFixed(2)) : 0,
                    marketCap: typeof marketCap === 'number' ? marketCap : 0,
                    volume: typeof volume === 'number' ? volume : 0,
                    rsi,
                    adx,
                    stoch,
                    rsiState,
                    macd,
                    signal,
                    hist,
                    macdState,
                    totalScore,
                    signalType,
                    signalLabel,
                    color,
                    bgGradient,
                    borderHover,
                };
            });

            const strongBuyCount = items.filter((i: any) => i.signalType === 'STRONG_BUY').length;
            const buyCount = items.filter((i: any) => i.signalType === 'BUY').length;
            const neutralCount = items.filter((i: any) => i.signalType === 'NEUTRAL').length;
            const sellCount = items.filter((i: any) => i.signalType === 'SELL').length;
            const strongSellCount = items.filter((i: any) => i.signalType === 'STRONG_SELL').length;

            const totalBullish = strongBuyCount + buyCount;
            const totalBearish = strongSellCount + sellCount;
            const total = items.length || 1;

            const summary = {
                totalCount: items.length,
                timeframe: '1W',
                updatedAt: new Date().toISOString(),
                bullishCount: totalBullish,
                bearishCount: totalBearish,
                neutralCount,
                bullishPct: Number(((totalBullish / total) * 100).toFixed(1)),
                bearishPct: Number(((totalBearish / total) * 100).toFixed(1)),
                neutralPct: Number(((neutralCount / total) * 100).toFixed(1)),
                strongBuyCount,
                buyCount,
                sellCount,
                strongSellCount,
                sentiment: totalBullish > totalBearish ? 'ALCISTA' : totalBearish > totalBullish ? 'BAJISTA' : 'NEUTRAL',
            };

            const payload = {
                summary,
                items,
            };

            this.sp500TechnicalHeatmapCache = { data: payload, fetchedAt: Date.now() };
            return payload;
        } catch (error) {
            console.error('[MarketService] S&P 500 Technical Heatmap error:', error);
            if (this.sp500TechnicalHeatmapCache) {
                return this.sp500TechnicalHeatmapCache.data;
            }
            return {
                summary: {
                    totalCount: 0,
                    timeframe: '1W',
                    updatedAt: new Date().toISOString(),
                    bullishCount: 0,
                    bearishCount: 0,
                    neutralCount: 0,
                    bullishPct: 0,
                    bearishPct: 0,
                    neutralPct: 0,
                    strongBuyCount: 0,
                    buyCount: 0,
                    sellCount: 0,
                    strongSellCount: 0,
                    sentiment: 'NEUTRAL',
                },
                items: [],
            };
        }
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
        const cacheKey = qLower;
        const cached = this.searchCache.get(cacheKey);
        if (cached && Date.now() - cached.fetchedAt < 24 * 60 * 60 * 1000) {
            return cached.data;
        }

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
            const answer = deduped.slice(0, 30);
            this.searchCache.set(cacheKey, { data: answer, fetchedAt: Date.now() });
            return answer;
        }

        console.log('[MarketService] Returning empty results');
        this.searchCache.set(cacheKey, { data: directSymbolResult, fetchedAt: Date.now() });
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
                    columns: ['close', 'change', 'change_abs', 'volume', 'Recommend.All', 'premarket_close', 'premarket_change'],
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
                const premarketPrice = typeof values[5] === 'number' && Number.isFinite(values[5]) ? values[5] : null;
                const premarketChange = typeof values[6] === 'number' && Number.isFinite(values[6]) ? values[6] : null;
                if (price === null && premarketPrice === null) return;

                quoteMap.set(symbol, {
                    price: price ?? premarketPrice ?? 0,
                    change,
                    premarketPrice,
                    premarketChange,
                });
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
                premarketPrice: match?.premarketPrice ?? null,
                premarketChange: match?.premarketChange ?? null,
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
        const rates = await this.getDollarRates();
        const mep = rates.find((r) => r.id === 'mep' || r.label.toLowerCase() === 'mep');
        if (mep) {
            return {
                compra: mep.buy,
                venta: mep.sell,
                fecha: mep.updatedAt,
                fuente: 'dolarapi.com',
            };
        }
        return {
            compra: 1530,
            venta: 1535,
            fecha: new Date().toISOString(),
            fuente: 'Finix Cache',
        };
    }

    async getDolarCcl() {
        const rates = await this.getDollarRates();
        const ccl = rates.find((r) => r.id === 'ccl' || r.label.toLowerCase() === 'ccl');
        if (ccl) {
            return {
                compra: ccl.buy,
                venta: ccl.sell,
                fecha: ccl.updatedAt,
                fuente: 'dolarapi.com',
            };
        }
        return {
            compra: 1590,
            venta: 1595,
            fecha: new Date().toISOString(),
            fuente: 'Finix Cache',
        };
    }

    async getCedearValuation(symbol: string) {
        const def = getCedearDefinition(symbol);
        if (!def) {
            return null;
        }

        const cedearTicker = `BCBA:${def.ticker}`;
        const underlyingTicker = `${def.underlyingExchange}:${def.underlyingTicker}`;

        const [cedearQuote, underlyingQuote] = await this.getQuotes([cedearTicker, underlyingTicker]);
        const cclData = await this.getDolarCcl();
        const cclRate = cclData.venta || cclData.compra || 1590;

        const cedearPriceArs = cedearQuote?.price ?? null;
        const underlyingPriceUsd = underlyingQuote?.price ?? null;

        let theoreticalPriceArs: number | null = null;
        let implicitCcl: number | null = null;
        let discrepancyPct: number | null = null;

        if (underlyingPriceUsd && underlyingPriceUsd > 0 && def.ratio > 0) {
            theoreticalPriceArs = Number(((underlyingPriceUsd * cclRate) / def.ratio).toFixed(2));
            if (cedearPriceArs && cedearPriceArs > 0) {
                implicitCcl = Number(((cedearPriceArs * def.ratio) / underlyingPriceUsd).toFixed(2));
                discrepancyPct = Number((((cedearPriceArs - theoreticalPriceArs) / theoreticalPriceArs) * 100).toFixed(2));
            }
        }

        return {
            ticker: def.ticker,
            name: def.name,
            sector: def.sector,
            ratio: def.ratio,
            underlyingTicker: def.underlyingTicker,
            underlyingExchange: def.underlyingExchange,
            cedearPriceArs,
            cedearChangePct: cedearQuote?.change ?? null,
            underlyingPriceUsd,
            underlyingChangePct: underlyingQuote?.change ?? null,
            dolarCcl: cclRate,
            dolarCclUpdatedAt: cclData.fecha,
            theoreticalPriceArs,
            implicitCcl,
            discrepancyPct,
            updatedAt: new Date().toISOString(),
            source: 'BYMA / TradingView / DolarApi',
        };
    }

    async getAllCedearsValuation() {
        const tickers = Object.keys(CEDEAR_REGISTRY);
        const results = await Promise.all(
            tickers.map((t) => this.getCedearValuation(t))
        );
        return results.filter(Boolean);
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

    private symbolNewsCache = new Map<string, { data: any[]; fetchedAt: number }>();

    async getSymbolSpecificNews(rawSymbol: string): Promise<any[]> {
        const cleaned = (rawSymbol || '')
            .toUpperCase()
            .replace(/^(NASDAQ|NYSE|AMEX|BCBA|BYMA|BINANCE|CRYPTO|INDEX):/, '')
            .replace(/\.BA$/, '')
            .trim();

        if (!cleaned) return [];

        const cached = this.symbolNewsCache.get(cleaned);
        if (cached && Date.now() - cached.fetchedAt < 5 * 60 * 1000) {
            return cached.data;
        }

        const items: any[] = [];
        const alphaSpreadUrl = `https://www.alphaspread.com/security/nasdaq/${cleaned.toLowerCase()}`;

        // 1. Fetch from Yahoo Finance Search News (Ticker-specific financial news)
        try {
            const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleaned)}&quotesCount=1&newsCount=8`;
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                },
                signal: AbortSignal.timeout(4500),
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.news)) {
                    for (const n of data.news) {
                        if (!n.title) continue;
                        items.push({
                            id: n.uuid || `yh-${Math.random()}`,
                            title: n.title,
                            sourceName: n.publisher || 'Yahoo Finance',
                            url: n.link || alphaSpreadUrl,
                            publishedAt: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toISOString() : new Date().toISOString(),
                            summary: n.summary || '',
                            alphaSpreadUrl,
                        });
                    }
                }
            }
        } catch (err: any) {
            console.warn(`[MarketService] Yahoo news search failed for ${cleaned}:`, err?.message);
        }

        // 2. Fetch from Google News RSS for ticker if fewer than 4 items
        if (items.length < 4) {
            try {
                const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleaned + ' stock')}&hl=en-US&gl=US&ceid=US:en`;
                const res = await fetch(rssUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    signal: AbortSignal.timeout(4000),
                });
                if (res.ok) {
                    const xml = await res.text();
                    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
                    for (const itemXml of itemMatches.slice(0, 6)) {
                        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
                        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
                        const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
                        const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);

                        if (titleMatch && linkMatch) {
                            const rawTitle = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
                            const link = linkMatch[1].trim();
                            const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();
                            const sourceName = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'Mercado Financiero';

                            if (!items.some(existing => existing.title === rawTitle)) {
                                items.push({
                                    id: `gn-${Buffer.from(rawTitle).toString('base64').slice(0, 16)}`,
                                    title: rawTitle,
                                    sourceName,
                                    url: link,
                                    publishedAt: pubDate,
                                    alphaSpreadUrl,
                                });
                            }
                        }
                    }
                }
            } catch (err: any) {
                console.warn(`[MarketService] Google RSS news failed for ${cleaned}:`, err?.message);
            }
        }

        // 3. Fallback: AlphaSpread Valuation and Intelligence summaries for this exact ticker
        if (items.length === 0) {
            items.push(
                {
                    id: `as-${cleaned}-1`,
                    title: `Análisis de Valoración Intrínseca y Descuento DCF de ${cleaned}`,
                    sourceName: 'AlphaSpread Valuation',
                    url: `https://www.alphaspread.com/security/nasdaq/${cleaned.toLowerCase()}/discount-rate`,
                    publishedAt: new Date().toISOString(),
                    summary: `Revisá el modelo de valuación intrínseco, múltiplos de mercado y proyecciones de flujo de caja para ${cleaned}.`,
                    alphaSpreadUrl,
                },
                {
                    id: `as-${cleaned}-2`,
                    title: `Métricas de Rentabilidad, ROIC y Estructura de Capital de ${cleaned}`,
                    sourceName: 'AlphaSpread Fundamentals',
                    url: alphaSpreadUrl,
                    publishedAt: new Date(Date.now() - 86400000).toISOString(),
                    summary: `Comparativa fundamental frente a competidores directos de la industria según el modelo AlphaSpread.`,
                    alphaSpreadUrl,
                }
            );
        }

        const sorted = items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        this.symbolNewsCache.set(cleaned, { data: sorted, fetchedAt: Date.now() });
        return sorted;
    }

    async getNews(symbol?: string) {
        if (symbol && symbol.trim()) {
            return this.getSymbolSpecificNews(symbol.trim());
        }

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

    private candleCache = new Map<string, { data: any[]; timestamp: number }>();

    async getCandles(rawSymbol: string, interval: string = '1d', range: string = '1y'): Promise<{
        symbol: string;
        interval: string;
        candles: Array<{ time: number; open: number; high: number; low: number; close: number; volume?: number }>;
    }> {
        const cleaned = (rawSymbol || 'AAPL')
            .toUpperCase()
            .replace(/^(NASDAQ|NYSE|AMEX|BCBA|BYMA|BINANCE|CRYPTO|INDEX):/, '')
            .replace(/\.BA$/, '')
            .trim();

        const cacheKey = `${cleaned}:${interval}:${range}`;
        const cached = this.candleCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 30000) {
            return { symbol: cleaned, interval, candles: cached.data };
        }

        let candles: Array<{ time: number; open: number; high: number; low: number; close: number; volume?: number }> = [];

        const isCrypto = /^(BTC|ETH|SOL|BNB|XRP|ADA|DOGE|AVAX|DOT|LINK|MATIC|NEAR|LTC|ATOM)(USDT|USD)?$/.test(cleaned) ||
            cleaned.endsWith('USDT') || cleaned.endsWith('BTC');

        if (isCrypto) {
            try {
                const pair = cleaned.endsWith('USDT') ? cleaned : `${cleaned.replace(/USD$/, '')}USDT`;
                const binanceInterval = interval.toLowerCase().includes('h') ? '1h' : (interval.toLowerCase().includes('w') ? '1w' : '1d');
                const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${binanceInterval}&limit=350`, {
                    signal: AbortSignal.timeout(5000),
                });
                if (res.ok) {
                    const rawKlines = await res.json();
                    if (Array.isArray(rawKlines)) {
                        candles = rawKlines.map((k: any) => ({
                            time: Math.floor(Number(k[0]) / 1000), // seconds
                            open: parseFloat(k[1]),
                            high: parseFloat(k[2]),
                            low: parseFloat(k[3]),
                            close: parseFloat(k[4]),
                            volume: parseFloat(k[5]),
                        })).filter(c => Number.isFinite(c.close) && c.close > 0);
                    }
                }
            } catch (err) {
                console.warn(`[MarketService] Binance klines failed for ${cleaned}:`, (err as any)?.message);
            }
        }

        if (candles.length === 0) {
            try {
                const yahooInterval = interval.toLowerCase().includes('h') ? '1h' : (interval.toLowerCase().includes('w') ? '1wk' : '1d');
                const yahooRange = range || '1y';
                const ticker = cleaned.includes('-') ? cleaned : cleaned.replace(/\./g, '-');
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${yahooInterval}&range=${yahooRange}`;
                const res = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                    },
                    signal: AbortSignal.timeout(6000),
                });

                if (res.ok) {
                    const payload = await res.json();
                    const result = payload?.chart?.result?.[0];
                    const timestamps = result?.timestamp;
                    const quotes = result?.indicators?.quote?.[0];

                    if (Array.isArray(timestamps) && quotes) {
                        for (let i = 0; i < timestamps.length; i++) {
                            const t = timestamps[i];
                            const o = quotes.open?.[i];
                            const h = quotes.high?.[i];
                            const l = quotes.low?.[i];
                            const c = quotes.close?.[i];
                            const v = quotes.volume?.[i];

                            if (t && Number.isFinite(c) && c > 0) {
                                candles.push({
                                    time: t,
                                    open: Number.isFinite(o) ? o : c,
                                    high: Number.isFinite(h) ? h : c,
                                    low: Number.isFinite(l) ? l : c,
                                    close: c,
                                    volume: Number.isFinite(v) ? v : 0,
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn(`[MarketService] Yahoo candles failed for ${cleaned}:`, (err as any)?.message);
            }
        }

        // Never present generated prices as real market data.
        if (candles.length === 0) {
            return { symbol: cleaned, interval, candles: [] };
        }

        // Ordenar cronológicamente
        candles.sort((a, b) => a.time - b.time);

        // Guardar en caché
        this.candleCache.set(cacheKey, { data: candles, timestamp: Date.now() });

        return {
            symbol: cleaned,
            interval,
            candles,
        };
    }
}
