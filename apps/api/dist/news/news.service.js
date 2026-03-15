"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const news_fetcher_service_1 = require("./news-fetcher.service");
const news_translation_service_1 = require("./news-translation.service");
const news_sentiment_service_1 = require("./news-sentiment.service");
const schedule_1 = require("@nestjs/schedule");
const crypto = require("crypto");
let NewsService = class NewsService {
    constructor(prisma, newsFetcher, translator, sentimentAnalyzer) {
        this.prisma = prisma;
        this.newsFetcher = newsFetcher;
        this.translator = translator;
        this.sentimentAnalyzer = sentimentAnalyzer;
        console.log('[NewsService] Initialized');
        this.initializeCategories();
    }
    async initializeCategories() {
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
            }
            catch (error) {
            }
        }
    }
    async getNews(filters) {
        const { category, source, sentiment, limit = 50, offset = 0, } = filters;
        const where = {};
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
    async getNewsByTicker(ticker, options) {
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
    async getNewsByCategory(slug, options) {
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
    async getCategories() {
        return this.prisma.newsCategory.findMany({
            orderBy: {
                name: 'asc',
            },
        });
    }
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
    async getNewsStats() {
        const [totalNews, last24h, positiveCount, negativeCount, neutralCount,] = await Promise.all([
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
    async fetchAndStoreNews() {
        console.log('[NewsService] Starting news fetch...');
        try {
            const rawNews = await this.newsFetcher.fetchAllNews();
            console.log(`[NewsService] Fetched ${rawNews.length} raw news items`);
            let processed = 0;
            let skipped = 0;
            for (const item of rawNews) {
                try {
                    const urlHash = crypto
                        .createHash('md5')
                        .update(item.url)
                        .digest('hex');
                    const existing = await this.prisma.news.findUnique({
                        where: { urlHash },
                    });
                    if (existing) {
                        skipped++;
                        continue;
                    }
                    let titleEs = item.title;
                    let summaryEs = item.summary;
                    let contentEs = item.content;
                    let wasTranslated = false;
                    if (this.translator.isEnglish(item.title)) {
                        titleEs = await this.translator.translateToSpanish(item.title);
                        summaryEs = await this.translator.translateToSpanish(item.summary);
                        wasTranslated = true;
                    }
                    const analysis = this.sentimentAnalyzer.analyzeArticle(titleEs || item.title, contentEs || item.content, summaryEs || item.summary);
                    const category = await this.categorizeNews(titleEs || item.title, summaryEs || item.summary);
                    const source = await this.getOrCreateSource(item.source);
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
                            tickers: analysis.tickers.join(','),
                            publishedAt: item.publishedAt,
                        },
                    });
                    processed++;
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                catch (error) {
                    console.error(`[NewsService] Error processing item:`, error.message);
                }
            }
            console.log(`[NewsService] Processed: ${processed}, Skipped: ${skipped}`);
            await this.cleanOldNews();
            return { processed, skipped };
        }
        catch (error) {
            console.error('[NewsService] Error in fetchAndStoreNews:', error);
            throw error;
        }
    }
    async categorizeNews(title, summary) {
        const text = `${title} ${summary}`.toLowerCase();
        const categories = await this.prisma.newsCategory.findMany();
        const categoryMap = {
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
        return categories.find(c => c.slug === 'global');
    }
    async getOrCreateSource(sourceName) {
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
    formatNewsItems(news) {
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
            tickers: item.tickers ? item.tickers.split(',').filter((t) => t.trim()) : [],
            publishedAt: item.publishedAt,
            wasTranslated: item.wasTranslated,
            language: item.language,
        }));
    }
    async cleanOldNews() {
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
};
exports.NewsService = NewsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NewsService.prototype, "fetchAndStoreNews", null);
exports.NewsService = NewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        news_fetcher_service_1.NewsFetcherService,
        news_translation_service_1.NewsTranslationService,
        news_sentiment_service_1.NewsSentimentService])
], NewsService);
//# sourceMappingURL=news.service.js.map