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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsController = void 0;
const common_1 = require("@nestjs/common");
const news_service_1 = require("./news.service");
let NewsController = class NewsController {
    constructor(newsService) {
        this.newsService = newsService;
        console.log('NewsController initialized');
    }
    async getNews(query) {
        const { category, source, limit = 50, offset = 0, sentiment, } = query;
        return this.newsService.getNews({
            category,
            source,
            limit: parseInt(limit),
            offset: parseInt(offset),
            sentiment,
        });
    }
    async getNewsByTicker(ticker, query) {
        const { limit = 20, offset = 0 } = query;
        return this.newsService.getNewsByTicker(ticker, {
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    async getCategories() {
        return this.newsService.getCategories();
    }
    async getSources() {
        return this.newsService.getSources();
    }
    async getTrending(limit = 10) {
        return this.newsService.getTrendingNews(parseInt(limit));
    }
    async getNewsByCategory(slug, query) {
        const { limit = 50, offset = 0 } = query;
        return this.newsService.getNewsByCategory(slug, {
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    async triggerFetch() {
        return this.newsService.fetchAndStoreNews();
    }
    async getStats() {
        return this.newsService.getNewsStats();
    }
};
exports.NewsController = NewsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getNews", null);
__decorate([
    (0, common_1.Get)('ticker/:ticker'),
    __param(0, (0, common_1.Param)('ticker')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getNewsByTicker", null);
__decorate([
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('sources'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getSources", null);
__decorate([
    (0, common_1.Get)('trending'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getTrending", null);
__decorate([
    (0, common_1.Get)('category/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getNewsByCategory", null);
__decorate([
    (0, common_1.Post)('fetch'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "triggerFetch", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getStats", null);
exports.NewsController = NewsController = __decorate([
    (0, common_1.Controller)('news'),
    __metadata("design:paramtypes", [news_service_1.NewsService])
], NewsController);
//# sourceMappingURL=news.controller.js.map