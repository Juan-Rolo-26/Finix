import { PrismaService } from '../prisma.service';
import { NewsFetcherService } from './news-fetcher.service';
import { NewsTranslationService } from './news-translation.service';
import { NewsSentimentService } from './news-sentiment.service';
interface NewsFilter {
    category?: string;
    source?: string;
    sentiment?: string;
    limit?: number;
    offset?: number;
}
export declare class NewsService {
    private prisma;
    private newsFetcher;
    private translator;
    private sentimentAnalyzer;
    constructor(prisma: PrismaService, newsFetcher: NewsFetcherService, translator: NewsTranslationService, sentimentAnalyzer: NewsSentimentService);
    private initializeCategories;
    getNews(filters: NewsFilter): Promise<{
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
    getNewsByTicker(ticker: string, options: {
        limit?: number;
        offset?: number;
    }): Promise<{
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
    getNewsByCategory(slug: string, options: {
        limit?: number;
        offset?: number;
    }): Promise<{
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
    getTrendingNews(limit?: number): Promise<{
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
        createdAt: Date;
        updatedAt: Date;
        name: string;
        apiType: string;
        country: string;
        language: string;
        isActive: boolean;
        priority: number;
    }[]>;
    getNewsStats(): Promise<{
        totalNews: number;
        last24h: number;
        sentiment: {
            positive: number;
            negative: number;
            neutral: number;
        };
    }>;
    fetchAndStoreNews(): Promise<{
        processed: number;
        skipped: number;
    }>;
    private categorizeNews;
    private getOrCreateSource;
    private formatNewsItems;
    private cleanOldNews;
}
export {};
