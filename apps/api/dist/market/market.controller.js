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
exports.MarketController = void 0;
const common_1 = require("@nestjs/common");
const market_service_1 = require("./market.service");
let MarketController = class MarketController {
    constructor(marketService) {
        this.marketService = marketService;
        console.log('MarketController initialized');
    }
    async getTickers() {
        return await this.marketService.getTickers();
    }
    getDashboard() {
        return this.marketService.getDashboard();
    }
    search(q) {
        const query = q.query || q.q || q.text || q.search || '';
        return this.marketService.searchSymbols(query);
    }
    quote(q) {
        const symbol = q.symbol || '';
        return this.marketService.getQuote(symbol);
    }
    getFinvizHeatmap(q) {
        const subtype = q.st || q.subtype || 'd1';
        return this.marketService.getFinvizHeatmap(subtype);
    }
    getDolarMep() {
        return this.marketService.getDolarMep();
    }
    getNews(q) {
        const symbol = q.symbol || q.s || '';
        return this.marketService.getNews(symbol);
    }
};
exports.MarketController = MarketController;
__decorate([
    (0, common_1.Get)('tickers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getTickers", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('quote'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "quote", null);
__decorate([
    (0, common_1.Get)('finviz/heatmap'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getFinvizHeatmap", null);
__decorate([
    (0, common_1.Get)('dolar/mep'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getDolarMep", null);
__decorate([
    (0, common_1.Get)('news'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getNews", null);
exports.MarketController = MarketController = __decorate([
    (0, common_1.Controller)('market'),
    __metadata("design:paramtypes", [market_service_1.MarketService])
], MarketController);
//# sourceMappingURL=market.controller.js.map