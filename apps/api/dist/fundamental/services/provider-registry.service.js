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
exports.ProviderRegistryService = void 0;
const common_1 = require("@nestjs/common");
const adapter_alpha_vantage_service_1 = require("../adapters/adapter-alpha-vantage.service");
const adapter_finnhub_service_1 = require("../adapters/adapter-finnhub.service");
const adapter_fmp_service_1 = require("../adapters/adapter-fmp.service");
const adapter_investing_service_1 = require("../adapters/adapter-investing.service");
let ProviderRegistryService = class ProviderRegistryService {
    constructor(fmp, finnhub, alphaVantage, investing) {
        this.fmp = fmp;
        this.finnhub = finnhub;
        this.alphaVantage = alphaVantage;
        this.investing = investing;
        this.adapters = new Map();
        this.adapters.set(this.fmp.provider, this.fmp);
        this.adapters.set(this.finnhub.provider, this.finnhub);
        this.adapters.set(this.alphaVantage.provider, this.alphaVantage);
        this.adapters.set(this.investing.provider, this.investing);
    }
    getAdapter(provider) {
        return this.adapters.get(provider) || null;
    }
    listProviders() {
        const available = Array.from(this.adapters.values()).map((adapter) => adapter.getDescriptor());
        const hasPolygon = available.some((item) => item.id === 'polygon');
        if (!hasPolygon) {
            available.push({
                id: 'polygon',
                name: 'Polygon (futuro)',
                enabled: false,
                supportsSearch: false,
                supportsFundamentals: false,
                notes: 'Pendiente de implementación',
            });
        }
        return available;
    }
    getFallbackOrder(requested, assetType) {
        const preferred = [requested, 'fmp', 'finnhub', 'alphavantage', 'investing'];
        const ordered = preferred.filter((item, index, arr) => arr.indexOf(item) === index);
        return ordered.filter((providerId) => {
            const adapter = this.adapters.get(providerId);
            if (!adapter)
                return false;
            const descriptor = adapter.getDescriptor();
            if (!descriptor.enabled || !descriptor.supportsFundamentals)
                return false;
            return adapter.supportsAssetType(assetType);
        });
    }
};
exports.ProviderRegistryService = ProviderRegistryService;
exports.ProviderRegistryService = ProviderRegistryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [adapter_fmp_service_1.AdapterFMPService,
        adapter_finnhub_service_1.AdapterFinnhubService,
        adapter_alpha_vantage_service_1.AdapterAlphaVantageService,
        adapter_investing_service_1.AdapterInvestingService])
], ProviderRegistryService);
//# sourceMappingURL=provider-registry.service.js.map