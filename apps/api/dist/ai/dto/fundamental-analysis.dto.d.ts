export declare class FundamentalDataDto {
    marketCap: number;
    peRatio: number;
    roe: number;
    roic: number;
    debtToEquity: number;
    revenueGrowth: number;
    freeCashFlow: number;
}
export declare class FundamentalAnalysisDto {
    ticker: string;
    fundamentalData: FundamentalDataDto;
    model?: string;
}
