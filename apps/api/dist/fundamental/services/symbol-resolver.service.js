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
exports.SymbolResolverService = void 0;
const common_1 = require("@nestjs/common");
const market_service_1 = require("../../market/market.service");
const symbol_normalizer_1 = require("../normalizers/symbol.normalizer");
let SymbolResolverService = class SymbolResolverService {
    constructor(marketService) {
        this.marketService = marketService;
    }
    async search(query, limit = 20) {
        const raw = await this.marketService.searchSymbols(query);
        const items = Array.isArray(raw) ? raw : [];
        const normalized = items.map((item) => (0, symbol_normalizer_1.fromSearchResult)({
            input: query,
            symbol: String(item?.symbol || ''),
            exchange: typeof item?.exchange === 'string' ? item.exchange : undefined,
            type: typeof item?.type === 'string' ? item.type : undefined,
            name: typeof item?.name === 'string' ? item.name : undefined,
        }));
        const deduped = normalized.filter((item, index, arr) => arr.findIndex((candidate) => candidate.tvSymbol === item.tvSymbol) === index);
        return deduped.slice(0, Math.max(1, Math.min(limit, 50)));
    }
    async resolve(input, explicitTvSymbol) {
        if (explicitTvSymbol) {
            const direct = (0, symbol_normalizer_1.fromDirectTicker)(explicitTvSymbol);
            return {
                ...direct,
                input,
            };
        }
        const normalizedInput = (input || '').trim();
        if (!normalizedInput) {
            return (0, symbol_normalizer_1.fromDirectTicker)('');
        }
        const upperInput = normalizedInput.toUpperCase();
        if (upperInput.includes(':')) {
            const direct = (0, symbol_normalizer_1.fromDirectTicker)(upperInput);
            return {
                ...direct,
                input,
            };
        }
        const candidates = await this.search(normalizedInput, 12);
        const exact = candidates.find((item) => item.normalizedTicker === upperInput);
        if (exact) {
            return {
                input,
                tvSymbol: exact.tvSymbol,
                normalizedTicker: exact.normalizedTicker,
                exchange: exact.exchange,
                assetType: exact.assetType,
                name: exact.name,
            };
        }
        const startsWith = candidates.find((item) => item.normalizedTicker.startsWith(upperInput));
        if (startsWith) {
            return {
                input,
                tvSymbol: startsWith.tvSymbol,
                normalizedTicker: startsWith.normalizedTicker,
                exchange: startsWith.exchange,
                assetType: startsWith.assetType,
                name: startsWith.name,
            };
        }
        const fallback = (0, symbol_normalizer_1.fromDirectTicker)(upperInput);
        return {
            ...fallback,
            input,
        };
    }
};
exports.SymbolResolverService = SymbolResolverService;
exports.SymbolResolverService = SymbolResolverService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [market_service_1.MarketService])
], SymbolResolverService);
//# sourceMappingURL=symbol-resolver.service.js.map