export interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
}
export declare class WebSearchService {
    private readonly logger;
    search(query: string, maxResults?: number): Promise<WebSearchResult[]>;
    fetchPageContent(url: string): Promise<string>;
    private parseResults;
    private fallbackParse;
    private extractRealUrl;
    private stripHtml;
    private htmlToText;
}
