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
exports.FundamentalController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const fundamental_orchestrator_service_1 = require("../services/fundamental-orchestrator.service");
function toProvider(value) {
    const normalized = (value || '').toLowerCase();
    if (normalized === 'finnhub')
        return 'finnhub';
    if (normalized === 'alphavantage' || normalized === 'alpha' || normalized === 'alpha-vantage')
        return 'alphavantage';
    if (normalized === 'investing')
        return 'investing';
    if (normalized === 'polygon')
        return 'polygon';
    return 'fmp';
}
function toBoolean(value, defaultValue) {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (['1', 'true', 'yes', 'y'].includes(lower))
            return true;
        if (['0', 'false', 'no', 'n'].includes(lower))
            return false;
    }
    return defaultValue;
}
let FundamentalController = class FundamentalController {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
    }
    getProviders() {
        return this.orchestrator.getProviders();
    }
    async search(query) {
        const text = String(query?.query || query?.q || query?.text || '').trim();
        const limit = Number(query?.limit || 20);
        return this.orchestrator.search(text, Number.isFinite(limit) ? limit : 20);
    }
    async getFundamentals(ticker, query) {
        return this.orchestrator.getFundamentals({
            ticker: ticker.toUpperCase(),
            provider: toProvider(query?.provider),
            fallback: toBoolean(query?.fallback, true),
            forceRefresh: toBoolean(query?.force, false),
            tvSymbol: typeof query?.tvSymbol === 'string' ? query.tvSymbol : undefined,
        });
    }
    async refreshFundamentals(ticker, query) {
        return this.orchestrator.refreshFundamentals({
            ticker: ticker.toUpperCase(),
            provider: toProvider(query?.provider),
            fallback: toBoolean(query?.fallback, true),
            forceRefresh: true,
            tvSymbol: typeof query?.tvSymbol === 'string' ? query.tvSymbol : undefined,
        });
    }
};
exports.FundamentalController = FundamentalController;
__decorate([
    (0, common_1.Get)('providers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FundamentalController.prototype, "getProviders", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FundamentalController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':ticker'),
    __param(0, (0, common_1.Param)('ticker')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FundamentalController.prototype, "getFundamentals", null);
__decorate([
    (0, common_1.Post)(':ticker/refresh'),
    __param(0, (0, common_1.Param)('ticker')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FundamentalController.prototype, "refreshFundamentals", null);
exports.FundamentalController = FundamentalController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('fundamental'),
    __metadata("design:paramtypes", [fundamental_orchestrator_service_1.FundamentalOrchestratorService])
], FundamentalController);
//# sourceMappingURL=fundamental.controller.js.map