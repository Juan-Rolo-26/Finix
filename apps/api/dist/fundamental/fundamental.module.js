"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundamentalModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const market_module_1 = require("../market/market.module");
const prisma_service_1 = require("../prisma.service");
const adapter_alpha_vantage_service_1 = require("./adapters/adapter-alpha-vantage.service");
const adapter_finnhub_service_1 = require("./adapters/adapter-finnhub.service");
const adapter_fmp_service_1 = require("./adapters/adapter-fmp.service");
const adapter_investing_service_1 = require("./adapters/adapter-investing.service");
const fundamental_controller_1 = require("./controllers/fundamental.controller");
const fundamental_cache_service_1 = require("./services/fundamental-cache.service");
const fundamental_orchestrator_service_1 = require("./services/fundamental-orchestrator.service");
const metrics_engine_service_1 = require("./services/metrics-engine.service");
const provider_health_service_1 = require("./services/provider-health.service");
const provider_rate_limit_service_1 = require("./services/provider-rate-limit.service");
const provider_registry_service_1 = require("./services/provider-registry.service");
const symbol_resolver_service_1 = require("./services/symbol-resolver.service");
let FundamentalModule = class FundamentalModule {
};
exports.FundamentalModule = FundamentalModule;
exports.FundamentalModule = FundamentalModule = __decorate([
    (0, common_1.Module)({
        imports: [market_module_1.MarketModule],
        controllers: [fundamental_controller_1.FundamentalController],
        providers: [
            prisma_service_1.PrismaService,
            jwt_auth_guard_1.JwtAuthGuard,
            fundamental_orchestrator_service_1.FundamentalOrchestratorService,
            symbol_resolver_service_1.SymbolResolverService,
            provider_registry_service_1.ProviderRegistryService,
            provider_rate_limit_service_1.ProviderRateLimitService,
            provider_health_service_1.ProviderHealthService,
            fundamental_cache_service_1.FundamentalCacheService,
            metrics_engine_service_1.MetricsEngineService,
            adapter_fmp_service_1.AdapterFMPService,
            adapter_finnhub_service_1.AdapterFinnhubService,
            adapter_alpha_vantage_service_1.AdapterAlphaVantageService,
            adapter_investing_service_1.AdapterInvestingService,
        ],
        exports: [fundamental_orchestrator_service_1.FundamentalOrchestratorService],
    })
], FundamentalModule);
//# sourceMappingURL=fundamental.module.js.map