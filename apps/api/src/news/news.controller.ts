import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
    constructor(private newsService: NewsService) {
        console.log('NewsController initialized');
    }

    /**
     * Get general news with optional filtering
     * Query params:
     * - category: Filter by category slug
     * - source: Filter by source name
     * - limit: Number of news items (default: 50)
     * - offset: Pagination offset
     */
    @Get()
    async getNews(@Query() query: any) {
        const {
            category,
            source,
            limit = 50,
            offset = 0,
            sentiment,
        } = query;

        return this.newsService.getNews({
            category,
            source,
            limit: parseInt(limit),
            offset: parseInt(offset),
            sentiment,
        });
    }

    /**
     * Get news for a specific ticker/company
     * Example: /news/ticker/AAPL
     */
    @Get('ticker/:ticker')
    async getNewsByTicker(
        @Param('ticker') ticker: string,
        @Query() query: any
    ) {
        const { limit = 20, offset = 0 } = query;
        return this.newsService.getNewsByTicker(ticker, {
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }

    /**
     * Get all available categories
     */
    @Get('categories')
    async getCategories() {
        return this.newsService.getCategories();
    }

    /**
     * Get all news sources
     */
    @Get('sources')
    async getSources() {
        return this.newsService.getSources();
    }

    /**
     * Get trending news (most viewed in last 24h)
     */
    @Get('trending')
    async getTrending(@Query('limit') limit = 10) {
        return this.newsService.getTrendingNews(parseInt(limit as any));
    }

    /**
     * Get news by category
     */
    @Get('category/:slug')
    async getNewsByCategory(
        @Param('slug') slug: string,
        @Query() query: any
    ) {
        const { limit = 50, offset = 0 } = query;
        return this.newsService.getNewsByCategory(slug, {
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }

    /**
     * Manually trigger news fetch (admin)
     */
    @Post('fetch')
    async triggerFetch() {
        return this.newsService.fetchAndStoreNews();
    }

    /**
     * Get news statistics
     */
    @Get('stats')
    async getStats() {
        return this.newsService.getNewsStats();
    }
}
