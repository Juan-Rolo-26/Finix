export interface FundamentalPromptInput {
    ticker: string;
    fundamentalData: {
        marketCap: number;
        peRatio: number;
        roe: number;
        roic: number;
        debtToEquity: number;
        revenueGrowth: number;
        freeCashFlow: number;
    };
}
export declare function buildFundamentalPrompt(input: FundamentalPromptInput): {
    system: string;
    prompt: string;
};
