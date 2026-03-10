import { PrismaService } from '../prisma.service';
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
export declare class MarketService {
    private prisma;
    private finvizBaseCache;
    private finvizHeatmapCache;
    private marketNewsCache;
    private readonly finvizBaseTtlMs;
    private readonly finvizHeatmapTtlMs;
    private readonly marketNewsTtlMs;
    private readonly finvizDefaultBaseScript;
    constructor(prisma: PrismaService);
    private stripHtml;
    private mockTickers;
    private readonly marketDashboardCatalog;
    private symbolCatalog;
    private toShortSymbol;
    private getDashboardDefinitions;
    private buildDashboardAsset;
    private buildDashboardSections;
    private buildMarketPulse;
    private buildDashboardLeaders;
    private buildCurrencyGap;
    private getDollarRates;
    private resolveAssetLabel;
    private extractCommunitySymbols;
    private normalizeCommunitySymbol;
    private getCommunityTrends;
    getDashboard(): Promise<MarketDashboardPayload>;
    getTickers(): Promise<{
        symbol: string;
        price: number;
        change: number;
        volume: number;
    }[]>;
    searchSymbols(query: string): Promise<any[]>;
    private normalizeQuoteInputSymbol;
    private buildSymbolCandidates;
    private fetchScannerQuotes;
    getQuotes(symbols: string[]): Promise<MarketQuote[]>;
    getQuote(symbol: string): Promise<MarketQuote>;
    private normalizeFinvizSubtype;
    private extractBalancedObjectLiteral;
    private quoteUnquotedObjectKeys;
    private parseFinvizBaseScript;
    private discoverFinvizBaseScriptPath;
    private getFinvizBaseTree;
    private collectSectorTickers;
    private buildFinvizSectors;
    private getFinvizStats;
    getFinvizHeatmap(subtype?: string): Promise<unknown>;
    getDolarMep(): Promise<{
        compra: any;
        venta: any;
        fecha: any;
    }>;
    private decodeHtmlEntities;
    private stripTags;
    private escapeRegExp;
    private buildGoogleNewsSearchUrl;
    private buildMarketNewsFeeds;
    private parseRSS;
    private looksSpanish;
    private dedupeNews;
    private sortNewsByDate;
    private fetchNewsFeed;
    private getFallbackMarketNews;
    getNews(_symbol?: string): Promise<{
        title: string;
        link: string;
        publishedAt: string;
        source: string;
        summary: string;
    }[]>;
}
export {};
