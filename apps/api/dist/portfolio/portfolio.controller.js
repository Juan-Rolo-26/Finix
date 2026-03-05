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
exports.PortfolioController = void 0;
const common_1 = require("@nestjs/common");
const portfolio_service_1 = require("./portfolio.service");
const portfolio_dto_1 = require("./dto/portfolio.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const limit_free_portfolio_guard_1 = require("../access/limit-free-portfolio.guard");
let PortfolioController = class PortfolioController {
    constructor(portfolioService) {
        this.portfolioService = portfolioService;
    }
    resolveUserId(req) {
        return req.user.id;
    }
    async getWatchlists(req) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getWatchlists(userId);
    }
    async createWatchlist(req, body) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.createWatchlist(userId, body.name, body.tickers || '');
    }
    async updateWatchlist(req, id, body) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.updateWatchlist(id, userId, body);
    }
    async deleteWatchlist(req, id) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.deleteWatchlist(id, userId);
    }
    async createPortfolio(req, dto) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.createPortfolio(userId, dto);
    }
    async getUserPortfolios(req) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getUserPortfolios(userId);
    }
    async getPortfolioById(req, id) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getPortfolioById(id, userId);
    }
    async getPortfolioMetrics(req, id) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getPortfolioMetrics(id, userId);
    }
    async updatePortfolio(req, id, dto) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.updatePortfolio(id, userId, dto);
    }
    async deletePortfolio(req, id) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.deletePortfolio(id, userId);
    }
    async addAsset(req, portfolioId, dto) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.addAsset(portfolioId, userId, dto);
    }
    async getPortfolioAssets(req, portfolioId) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getPortfolioAssets(portfolioId, userId);
    }
    async updateAsset(req, assetId, dto) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.updateAsset(assetId, userId, dto);
    }
    async deleteAsset(req, assetId, portfolioId) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.deleteAsset(assetId, userId, portfolioId);
    }
    async getPortfolioMovements(req, portfolioId, tipoMovimiento, ticker, fechaDesde, fechaHasta) {
        const userId = this.resolveUserId(req);
        const filters = {
            tipoMovimiento,
            ticker,
            fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
            fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
        };
        return this.portfolioService.getPortfolioMovements(portfolioId, userId, filters);
    }
    async createTransaction(req, portfolioId, dto) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.createTransaction(portfolioId, userId, dto);
    }
};
exports.PortfolioController = PortfolioController;
__decorate([
    (0, common_1.Get)('watchlists'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "getWatchlists", null);
__decorate([
    (0, common_1.Post)('watchlists'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "createWatchlist", null);
__decorate([
    (0, common_1.Patch)('watchlists/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "updateWatchlist", null);
__decorate([
    (0, common_1.Delete)('watchlists/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "deleteWatchlist", null);
__decorate([
    (0, common_1.UseGuards)(limit_free_portfolio_guard_1.LimitFreePortfolioGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, portfolio_dto_1.CreatePortfolioDto]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "createPortfolio", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "getUserPortfolios", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "getPortfolioById", null);
__decorate([
    (0, common_1.Get)(':id/metrics'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "getPortfolioMetrics", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, portfolio_dto_1.UpdatePortfolioDto]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "updatePortfolio", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "deletePortfolio", null);
__decorate([
    (0, common_1.Post)(':id/assets'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, portfolio_dto_1.CreateAssetDto]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "addAsset", null);
__decorate([
    (0, common_1.Get)(':id/assets'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "getPortfolioAssets", null);
__decorate([
    (0, common_1.Put)('assets/:assetId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('assetId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, portfolio_dto_1.UpdateAssetDto]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "updateAsset", null);
__decorate([
    (0, common_1.Delete)('assets/:assetId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('assetId')),
    __param(2, (0, common_1.Query)('portfolioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "deleteAsset", null);
__decorate([
    (0, common_1.Get)(':id/movements'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('tipoMovimiento')),
    __param(3, (0, common_1.Query)('ticker')),
    __param(4, (0, common_1.Query)('fechaDesde')),
    __param(5, (0, common_1.Query)('fechaHasta')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "getPortfolioMovements", null);
__decorate([
    (0, common_1.Post)(':id/transactions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, portfolio_dto_1.CreateTransactionDto]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "createTransaction", null);
exports.PortfolioController = PortfolioController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('portfolios'),
    __metadata("design:paramtypes", [portfolio_service_1.PortfolioService])
], PortfolioController);
//# sourceMappingURL=portfolio.controller.js.map