export declare class NewsSentimentService {
    private positiveKeywords;
    private negativeKeywords;
    private intensifiers;
    analyzeSentiment(text: string): {
        sentiment: string;
        score: number;
    };
    determineImpactLevel(text: string): string;
    extractTickers(text: string): string[];
    analyzeArticle(title: string, content: string, summary: string): {
        sentiment: string;
        sentimentScore: number;
        impactLevel: string;
        tickers: string[];
    };
}
