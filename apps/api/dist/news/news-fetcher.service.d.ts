interface RawNewsItem {
    title: string;
    summary: string;
    content: string;
    url: string;
    imageUrl?: string;
    source: string;
    author?: string;
    publishedAt: Date;
    language?: string;
}
export declare class NewsFetcherService {
    private readonly GNEWS_API_KEY;
    private readonly RSS_FEEDS;
    fetchAllNews(): Promise<RawNewsItem[]>;
    private fetchFromRSSFeeds;
    private parseRSS;
    private fetchFromGNews;
    private getFallbackNews;
}
export {};
