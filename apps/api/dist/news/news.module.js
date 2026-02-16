"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsModule = void 0;
const common_1 = require("@nestjs/common");
const news_controller_1 = require("./news.controller");
const news_service_1 = require("./news.service");
const news_fetcher_service_1 = require("./news-fetcher.service");
const news_translation_service_1 = require("./news-translation.service");
const news_sentiment_service_1 = require("./news-sentiment.service");
const prisma_service_1 = require("../prisma.service");
let NewsModule = class NewsModule {
};
exports.NewsModule = NewsModule;
exports.NewsModule = NewsModule = __decorate([
    (0, common_1.Module)({
        controllers: [news_controller_1.NewsController],
        providers: [
            news_service_1.NewsService,
            news_fetcher_service_1.NewsFetcherService,
            news_translation_service_1.NewsTranslationService,
            news_sentiment_service_1.NewsSentimentService,
            prisma_service_1.PrismaService,
        ],
        exports: [news_service_1.NewsService],
    })
], NewsModule);
//# sourceMappingURL=news.module.js.map