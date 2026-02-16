import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NewsFetcherService } from './news-fetcher.service';
import { NewsTranslationService } from './news-translation.service';
import { NewsSentimentService } from './news-sentiment.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';

interface NewsFilter {
    category?: string;
    source?: string;
    sentiment?: string;
    limit?: number;
    offset?: number;
}

@Injectable()
export class NewsService {
    constructor(
        private prisma: PrismaService,
        private newsFetcher: NewsFetcherService,
        private translator: NewsTranslationService,
        private sentimentAnalyzer: NewsSentimentService,
    ) {
        console.log('[NewsService] Initialized');
        this.initializeCategories();
    }

    /**
     * Initialize default categories if they don't exist
     */
    private async initializeCategories() {
        const categories = [
            { name: 'Empresas', slug: 'empresas', icon: 'Building2', color: '#8b5cf6' },
            { name: 'Argentina', slug: 'argentina', icon: 'DollarSign', color: '#3b82f6' },
            { name: 'Global', slug: 'global', icon: 'Globe', color: '#06b6d4' },
            { name: 'Mercados', slug: 'mercados', icon: 'BarChart3', color: '#ef4444' },
            { name: 'Criptomonedas', slug: 'cripto', icon: 'Bitcoin', color: '#f59e0b' },
            { name: 'Real Estate', slug: 'real-estate', icon: 'Home', color: '#10b981' },
            { name: 'Commodities', slug: 'commodities', icon: 'TrendingUp', color: '#eab308' },
            { name: 'ETFs', slug: 'etfs', icon: 'PieChart', color: '#6366f1' },
        ];

        for (const cat of categories) {
            try {
                await this.prisma.newsCategory.upsert({
                    where: { slug: cat.slug },
                    update: {},
                    create: cat,
                });
            } catch (error) {
                // Category might already exist
            }
        }
    }

    /**
     * Get news with filters
     */
    async getNews(filters: NewsFilter) {
        const {
            category,
            source,
            sentiment,
            limit = 50,
            offset = 0,
        } = filters;

        const where: any = {};

        if (category) {
            const cat = await this.prisma.newsCategory.findUnique({
                where: { slug: category },
            });
            if (cat) {
                where.categoryId = cat.id;
            }
        }

        if (source) {
            const src = await this.prisma.newsSource.findUnique({
                where: { name: source },
            });
            if (src) {
                where.sourceId = src.id;
            }
        }

        if (sentiment) {
            where.sentiment = sentiment;
        }

        const news = await this.prisma.news.findMany({
            where,
            include: {
                category: true,
                source: true,
            },
            orderBy: {
                publishedAt: 'desc',
            },
            take: limit,
            skip: offset,
        });

        return this.formatNewsItems(news);
    }

    /**
     * Get news for specific ticker
     */
    async getNewsByTicker(ticker: string, options: { limit?: number; offset?: number }) {
        const { limit = 20, offset = 0 } = options;

        const tickerUpper = ticker.toUpperCase();

        const news = await this.prisma.news.findMany({
            where: {
                tickers: {
                    contains: tickerUpper,
                },
            },
            include: {
                category: true,
                source: true,
            },
            orderBy: {
                publishedAt: 'desc',
            },
            take: limit,
            skip: offset,
        });

        return this.formatNewsItems(news);
    }

    /**
     * Get news by category
     */
    async getNewsByCategory(slug: string, options: { limit?: number; offset?: number }) {
        const { limit = 50, offset = 0 } = options;

        const category = await this.prisma.newsCategory.findUnique({
            where: { slug },
        });

        if (!category) {
            return [];
        }

        const news = await this.prisma.news.findMany({
            where: {
                categoryId: category.id,
            },
            include: {
                category: true,
                source: true,
            },
            orderBy: {
                publishedAt: 'desc',
            },
            take: limit,
            skip: offset,
        });

        return this.formatNewsItems(news);
    }

    /**
     * Get trending news (most viewed in last 24h)
     */
    async getTrendingNews(limit = 10) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const news = await this.prisma.news.findMany({
            where: {
                publishedAt: {
                    gte: oneDayAgo,
                },
            },
            include: {
                category: true,
                source: true,
            },
            orderBy: {
                viewCount: 'desc',
            },
            take: limit,
        });

        return this.formatNewsItems(news);
    }

    /**
     * Get all categories
     */
    async getCategories() {
        return this.prisma.newsCategory.findMany({
            orderBy: {
                name: 'asc',
            },
        });
    }

    /**
     * Get all sources
     */
    async getSources() {
        return this.prisma.newsSource.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                priority: 'desc',
            },
        });
    }

    /**
     * Get news statistics
     */
    async getNewsStats() {
        const [
            totalNews,
            last24h,
            positiveCount,
            negativeCount,
            neutralCount,
        ] = await Promise.all([
            this.prisma.news.count(),
            this.prisma.news.count({
                where: {
                    publishedAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
            }),
            this.prisma.news.count({ where: { sentiment: 'positive' } }),
            this.prisma.news.count({ where: { sentiment: 'negative' } }),
            this.prisma.news.count({ where: { sentiment: 'neutral' } }),
        ]);

        return {
            totalNews,
            last24h,
            sentiment: {
                positive: positiveCount,
                negative: negativeCount,
                neutral: neutralCount,
            },
        };
    }

    /**
     * Fetch and store news (called by cron or manually)
     */
    @Cron(CronExpression.EVERY_10_MINUTES)
    async fetchAndStoreNews() {
        console.log('[NewsService] Starting news fetch...');

        try {
            const rawNews = await this.newsFetcher.fetchAllNews();
            console.log(`[NewsService] Fetched ${rawNews.length} raw news items`);

            let processed = 0;
            let skipped = 0;

            for (const item of rawNews) {
                try {
                    // Generate URL hash for duplicate detection
                    const urlHash = crypto
                        .createHash('md5')
                        .update(item.url)
                        .digest('hex');

                    // Check if already exists
                    const existing = await this.prisma.news.findUnique({
                        where: { urlHash },
                    });

                    if (existing) {
                        skipped++;
                        continue;
                    }

                    // Translate if needed
                    let titleEs = item.title;
                    let summaryEs = item.summary;
                    let contentEs = item.content;
                    let wasTranslated = false;

                    if (this.translator.isEnglish(item.title)) {
                        titleEs = await this.translator.translateToSpanish(item.title);
                        summaryEs = await this.translator.translateToSpanish(item.summary);
                        wasTranslated = true;
                    }

                    // Analyze sentiment
                    const analysis = this.sentimentAnalyzer.analyzeArticle(
                        titleEs || item.title,
                        contentEs || item.content,
                        summaryEs || item.summary
                    );

                    // Determine category
                    const category = await this.categorizeNews(
                        titleEs || item.title,
                        summaryEs || item.summary
                    );

                    // Get or create source
                    const source = await this.getOrCreateSource(item.source);

                    // Store news
                    await this.prisma.news.create({
                        data: {
                            title: item.title,
                            titleEs,
                            content: item.content,
                            contentEs,
                            summary: item.summary,
                            summaryEs,
                            url: item.url,
                            urlHash,
                            imageUrl: item.imageUrl,
                            language: item.language || 'en',
                            wasTranslated,
                            categoryId: category?.id,
                            sourceId: source.id,
                            author: item.author,
                            sentiment: analysis.sentiment,
                            sentimentScore: analysis.sentimentScore,
                            impactLevel: analysis.impactLevel,
                            tickers: analysis.tickers.join(','), // Store as comma-separated string
                            publishedAt: item.publishedAt,
                        },
                    });

                    processed++;

                    // Rate limiting: wait between items
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {
                    console.error(`[NewsService] Error processing item:`, error.message);
                }
            }

            console.log(`[NewsService] Processed: ${processed}, Skipped: ${skipped}`);

            // Clean old news (older than 30 days)
            await this.cleanOldNews();

            return { processed, skipped };

        } catch (error) {
            console.error('[NewsService] Error in fetchAndStoreNews:', error);
            throw error;
        }
    }

    /**
     * Categorize news based on content
     */
    private async categorizeNews(title: string, summary: string): Promise<any> {
        const text = `${title} ${summary}`.toLowerCase();

        const categories = await this.prisma.newsCategory.findMany();

        // Category keywords
        const categoryMap: Record<string, string[]> = {
            'argentina': ['argentina', 'peso', 'bcra', 'ypf', 'galicia', 'mercado libre', 'buenos aires', 'milei'],
            'empresas': ['apple', 'tesla', 'nvidia', 'microsoft', 'amazon', 'google', 'meta', 'earnings', 'ceo', 'company', 'empresa'],
            'cripto': ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'btc', 'eth', 'binance', 'coinbase', 'criptomoneda'],
            'global': ['fed', 'inflation', 'gdp', 'recession', 'central bank', 'economy', 'economía', 'global'],
            'mercados': ['market', 'nasdaq', 's&p', 'trading', 'investor', 'wall street', 'bolsa', 'mercado'],
            'real-estate': ['real estate', 'property', 'housing', 'inmobiliario', 'vivienda'],
            'commodities': ['gold', 'oil', 'commodity', 'oro', 'petróleo'],
            'etfs': ['etf', 'fund', 'index', 'fondo'],
        };

        for (const [slug, keywords] of Object.entries(categoryMap)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return categories.find(c => c.slug === slug);
            }
        }

        // Default to mercados
        return categories.find(c => c.slug === 'mercados');
    }

    /**
     * Get or create news source
     */
    private async getOrCreateSource(sourceName: string) {
        let source = await this.prisma.newsSource.findUnique({
            where: { name: sourceName },
        });

        if (!source) {
            source = await this.prisma.newsSource.create({
                data: {
                    name: sourceName,
                    apiType: 'rss',
                    country: 'GLOBAL',
                    language: 'en',
                    priority: 0,
                },
            });
        }

        return source;
    }

    /**
     * Format news items for response
     */
    private formatNewsItems(news: any[]) {
        return news.map(item => ({
            id: item.id,
            title: item.titleEs || item.title,
            titleOriginal: item.wasTranslated ? item.title : undefined,
            summary: item.summaryEs || item.summary,
            content: item.contentEs || item.content,
            url: item.url,
            image: item.imageUrl,
            source: item.source.name,
            category: item.category?.name,
            categorySlug: item.category?.slug,
            author: item.author,
            sentiment: item.sentiment,
            sentimentScore: item.sentimentScore,
            impactLevel: item.impactLevel,
            tickers: item.tickers ? item.tickers.split(',').filter((t: string) => t.trim()) : [],
            publishedAt: item.publishedAt,
            wasTranslated: item.wasTranslated,
            language: item.language,
        }));
    }

    /**
     * Clean news older than 30 days
     */
    private async cleanOldNews() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const deleted = await this.prisma.news.deleteMany({
            where: {
                publishedAt: {
                    lt: thirtyDaysAgo,
                },
            },
        });

        console.log(`[NewsService] Deleted ${deleted.count} old news items`);
    }
}
