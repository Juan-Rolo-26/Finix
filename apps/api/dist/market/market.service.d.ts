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
export declare class MarketService {
    private finvizBaseCache;
    private finvizHeatmapCache;
    private readonly finvizBaseTtlMs;
    private readonly finvizHeatmapTtlMs;
    private readonly finvizDefaultBaseScript;
    private stripHtml;
    private mockTickers;
    private symbolCatalog;
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
    private parseRSS;
    getNews(symbol?: string): Promise<NewsItem[]>;
}
