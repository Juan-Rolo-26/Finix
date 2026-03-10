import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MarketModule } from '../market/market.module';
import { AdapterAlphaVantageService } from './adapters/adapter-alpha-vantage.service';
import { AdapterFinnhubService } from './adapters/adapter-finnhub.service';
import { AdapterFMPService } from './adapters/adapter-fmp.service';
import { AdapterInvestingService } from './adapters/adapter-investing.service';
import { FundamentalController } from './controllers/fundamental.controller';
import { FundamentalCacheService } from './services/fundamental-cache.service';
import { FundamentalOrchestratorService } from './services/fundamental-orchestrator.service';
import { MetricsEngineService } from './services/metrics-engine.service';
import { ProviderHealthService } from './services/provider-health.service';
import { ProviderRateLimitService } from './services/provider-rate-limit.service';
import { ProviderRegistryService } from './services/provider-registry.service';
import { SymbolResolverService } from './services/symbol-resolver.service';

@Module({
    imports: [MarketModule],
    controllers: [FundamentalController],
    providers: [
        JwtAuthGuard,
        FundamentalOrchestratorService,
        SymbolResolverService,
        ProviderRegistryService,
        ProviderRateLimitService,
        ProviderHealthService,
        FundamentalCacheService,
        MetricsEngineService,
        AdapterFMPService,
        AdapterFinnhubService,
        AdapterAlphaVantageService,
        AdapterInvestingService,
    ],
    exports: [FundamentalOrchestratorService],
})
export class FundamentalModule {}
