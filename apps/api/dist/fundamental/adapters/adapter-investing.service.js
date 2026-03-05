"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterInvestingService = void 0;
const common_1 = require("@nestjs/common");
const http_util_1 = require("../utils/http.util");
const provider_error_util_1 = require("../utils/provider-error.util");
let AdapterInvestingService = class AdapterInvestingService {
    constructor() {
        this.provider = 'investing';
        this.endpoint = process.env.INVESTING_FUNDAMENTAL_ENDPOINT || '';
    }
    getDescriptor() {
        return {
            id: this.provider,
            name: 'Investing (custom connector)',
            enabled: !!this.endpoint,
            supportsSearch: false,
            supportsFundamentals: true,
            notes: this.endpoint
                ? 'Usando endpoint externo configurable.'
                : 'No configurado. Definir INVESTING_FUNDAMENTAL_ENDPOINT.',
        };
    }
    supportsAssetType(assetType) {
        return ['stock', 'etf', 'index', 'cedear', 'crypto', 'forex', 'commodity'].includes((assetType || '').toLowerCase());
    }
    async fetchFundamentals(symbol) {
        if (!this.endpoint) {
            throw new provider_error_util_1.ProviderApiError({
                provider: this.provider,
                message: 'INVESTING_FUNDAMENTAL_ENDPOINT no configurado',
                retryable: false,
            });
        }
        const query = new URLSearchParams({
            ticker: symbol.normalizedTicker,
            tvSymbol: symbol.tvSymbol,
            exchange: symbol.exchange,
            assetType: symbol.assetType,
        });
        const payload = await (0, http_util_1.fetchJsonWithRetry)({
            provider: this.provider,
            url: `${this.endpoint}${this.endpoint.includes('?') ? '&' : '?'}${query.toString()}`,
            retries: 1,
        });
        if (!payload || typeof payload !== 'object') {
            throw new provider_error_util_1.ProviderApiError({
                provider: this.provider,
                message: 'Investing connector devolvió payload inválido',
                retryable: false,
            });
        }
        return payload;
    }
};
exports.AdapterInvestingService = AdapterInvestingService;
exports.AdapterInvestingService = AdapterInvestingService = __decorate([
    (0, common_1.Injectable)()
], AdapterInvestingService);
//# sourceMappingURL=adapter-investing.service.js.map