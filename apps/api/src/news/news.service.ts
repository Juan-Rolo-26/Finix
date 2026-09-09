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
    private queryCache = new Map<string, { data: any, exp: number }>();
    constructor(
        private prisma: PrismaService,
        private newsFetcher: NewsFetcherService,
        private translator: NewsTranslationService,
        private sentimentAnalyzer: NewsSentimentService,
    ) {
        console.log('[NewsService] Initialized');
        this.initializeCategories();

        // Commented out optimize boot scraping to avoid filling up news automatically
        // setTimeout(() => {
        //     this.fetchAndStoreNews().catch(console.error);
        // }, 3000);
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
            { name: 'Economía', slug: 'economia', icon: 'TrendingUp', color: '#10b981' },
            { name: 'Acciones', slug: 'acciones', icon: 'BarChart2', color: '#a855f7' },
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

        const cacheKey = `news:${category}:${source}:${sentiment}:${limit}:${offset}`;
        const cached = this.queryCache.get(cacheKey);
        if (cached && Date.now() < cached.exp) return cached.data;

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

        const formatted = this.formatNewsItems(news);
        this.queryCache.set(cacheKey, { data: formatted, exp: Date.now() + 60_000 });
        return formatted;
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
        const cacheKey = `cat:${slug}:${limit}:${offset}`;
        const cached = this.queryCache.get(cacheKey);
        if (cached && Date.now() < cached.exp) return cached.data;

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

        const formatted = this.formatNewsItems(news);
        this.queryCache.set(cacheKey, { data: formatted, exp: Date.now() + 60_000 });
        return formatted;
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
     * Fetch and store news (disabled automatic cron per user request)
     */
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

                    // Store news with upsert to avoid Unique Constraint crash
                    await this.prisma.news.upsert({
                        where: { url: item.url },
                        update: {}, // ignore existing
                        create: {
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

                } catch (error: any) {
                    // P2002 is Prisma's unique constraint failed error
                    if (error.code === 'P2002') {
                        skipped++;
                    } else {
                        console.error(`[NewsService] Error processing item (${item.title}):`, error.message);
                    }
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
     * Parse and add manual news from URL (Admin)
     */
    async addManualNews(url: string) {
        // Scrape page content
        const scraped = await this.newsFetcher.scrapeWebsitePage(url);
        if (!scraped.title || !scraped.text) {
            throw new Error('No se pudo extraer información suficiente de esa URL.');
        }

        const urlHash = crypto.createHash('md5').update(url).digest('hex');

        let titleEs = scraped.title;
        let summaryEs = scraped.text.substring(0, 300) + '...';
        let contentEs = scraped.text;
        let wasTranslated = false;

        // Simplify categorization for admin insertion
        const analysis = this.sentimentAnalyzer.analyzeArticle(titleEs, contentEs, summaryEs);
        const category = await this.categorizeNews(titleEs, summaryEs);

        // Find or create FINIX_ADMIN source
        const source = await this.getOrCreateSource('Finix Admin');

        const news = await this.prisma.news.upsert({
            where: { url },
            update: {},
            create: {
                title: scraped.title,
                titleEs,
                content: scraped.text,
                contentEs,
                summary: summaryEs,
                summaryEs,
                url: url,
                urlHash,
                imageUrl: scraped.image || null,
                language: 'es',
                wasTranslated,
                categoryId: category?.id,
                sourceId: source.id,
                author: 'Finix Admin',
                sentiment: analysis.sentiment,
                sentimentScore: analysis.sentimentScore,
                impactLevel: analysis.impactLevel,
                tickers: analysis.tickers.join(','),
                publishedAt: new Date(),
            },
        });

        // Invalidate cache
        this.queryCache.clear();
        return news;
    }

    async deleteNews(id: string) {
        await this.prisma.news.delete({ where: { id } });
        this.queryCache.clear();
        return { success: true };
    }


    /**
     * Categorize news based on content
     */
    private async categorizeNews(title: string, summary: string): Promise<any> {
        const text = `${title} ${summary}`.toLowerCase();

        const categories = await this.prisma.newsCategory.findMany();

        // Category keywords — order matters (first match wins)
        const categoryMap: Record<string, string[]> = {
            'cripto': ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'btc', 'eth', 'binance', 'coinbase', 'criptomoneda', 'defi', 'nft', 'altcoin', 'solana', 'ripple', 'xrp', 'stablecoin'],
            'argentina': ['argentina', 'argentino', 'peso', 'bcra', 'ypf', 'galicia', 'mercado libre', 'buenos aires', 'milei', 'vaca muerta', 'dolar blue', 'cepo', 'indec', 'inflacion argentina'],
            'economia': ['fed', 'inflation', 'inflación', 'gdp', 'pib', 'recession', 'recesión', 'central bank', 'banco central', 'interest rate', 'tasa de interés', 'tasa de interes', 'fiscal', 'presupuesto', 'budget', 'deuda publica', 'deuda externa', 'monetary policy', 'política monetaria', 'imf', 'fmi', 'world bank', 'banco mundial', 'economy', 'economía', 'macroeconomia'],
            'acciones': ['stock', 'acción', 'accion', 'shares', 'equity', 'nyse', 'nasdaq', 's&p 500', 'wall street', 'earnings', 'ganancias trimestrales', 'ipo', 'dividendo', 'bolsa de valores', 'dow jones', 'ticker', 'cotización bursátil'],
            'empresas': ['apple', 'tesla', 'nvidia', 'microsoft', 'amazon', 'google', 'meta', 'ceo', 'company', 'empresa', 'corporation', 'quarterly results', 'resultados trimestrales'],
            'global': ['global', 'world', 'international', 'geopolit', 'guerra', 'war', 'trade war', 'europa', 'china', 'asia', 'eeuu', 'united states', 'g7', 'g20', 'sanciones'],
            'real-estate': ['real estate', 'property', 'housing', 'inmobiliario', 'vivienda'],
            'commodities': ['gold', 'oil', 'commodity', 'oro', 'petróleo', 'crude', 'wheat', 'trigo', 'soja', 'soybean'],
            'etfs': ['etf', 'index fund', 'fondo indexado', 'spy', 'qqq', 'vti'],
            'mercados': ['market', 'trading', 'investor', 'bolsa', 'mercado financiero'],
        };

        for (const [slug, keywords] of Object.entries(categoryMap)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return categories.find(c => c.slug === slug);
            }
        }

        // Default to global
        return categories.find(c => c.slug === 'global');
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
