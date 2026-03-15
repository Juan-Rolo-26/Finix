import { NewsService } from './news.service';
export declare class NewsController {
    private newsService;
    constructor(newsService: NewsService);
    getNews(query: any): Promise<{
        id: any;
        title: any;
        titleOriginal: any;
        summary: any;
        content: any;
        url: any;
        image: any;
        source: any;
        category: any;
        categorySlug: any;
        author: any;
        sentiment: any;
        sentimentScore: any;
        impactLevel: any;
        tickers: any;
        publishedAt: any;
        wasTranslated: any;
        language: any;
    }[]>;
    getNewsByTicker(ticker: string, query: any): Promise<{
        id: any;
        title: any;
        titleOriginal: any;
        summary: any;
        content: any;
        url: any;
        image: any;
        source: any;
        category: any;
        categorySlug: any;
        author: any;
        sentiment: any;
        sentimentScore: any;
        impactLevel: any;
        tickers: any;
        publishedAt: any;
        wasTranslated: any;
        language: any;
    }[]>;
    getCategories(): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        slug: string;
        description: string | null;
        color: string | null;
        icon: string | null;
    }[]>;
    getSources(): Promise<{
        id: string;
        language: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        apiType: string;
        country: string;
        isActive: boolean;
        priority: number;
    }[]>;
    getTrending(limit?: number): Promise<{
        id: any;
        title: any;
        titleOriginal: any;
        summary: any;
        content: any;
        url: any;
        image: any;
        source: any;
        category: any;
        categorySlug: any;
        author: any;
        sentiment: any;
        sentimentScore: any;
        impactLevel: any;
        tickers: any;
        publishedAt: any;
        wasTranslated: any;
        language: any;
    }[]>;
    getNewsByCategory(slug: string, query: any): Promise<{
        id: any;
        title: any;
        titleOriginal: any;
        summary: any;
        content: any;
        url: any;
        image: any;
        source: any;
        category: any;
        categorySlug: any;
        author: any;
        sentiment: any;
        sentimentScore: any;
        impactLevel: any;
        tickers: any;
        publishedAt: any;
        wasTranslated: any;
        language: any;
    }[]>;
    triggerFetch(): Promise<{
        processed: number;
        skipped: number;
    }>;
    getStats(): Promise<{
        totalNews: number;
        last24h: number;
        sentiment: {
            positive: number;
            negative: number;
            neutral: number;
        };
    }>;
}
