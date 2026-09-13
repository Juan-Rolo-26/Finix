export interface MarketQuoteResult {
    ticker: string;
    companyName?: string;
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: number;
    exchange?: string;
}

export interface SP500Constituent {
    ticker: string;
    companyName: string;
    sector?: string;
    industry?: string;
    exchange?: string;
}

export interface IMarketDataProvider {
    readonly providerName: string;
    getSP500Constituents(): Promise<SP500Constituent[]>;
    getBatchQuotes(tickers: string[]): Promise<Map<string, MarketQuoteResult>>;
}
