import { FundamentalResponse } from '../types/fundamental.types';
import { FundamentalProviderId } from '../types/provider.types';
import { FundamentalCacheService } from './fundamental-cache.service';
import { MetricsEngineService } from './metrics-engine.service';
import { ProviderHealthService } from './provider-health.service';
import { ProviderRateLimitService } from './provider-rate-limit.service';
import { ProviderRegistryService } from './provider-registry.service';
import { SymbolResolverService } from './symbol-resolver.service';
export interface FundamentalRequest {
    ticker: string;
    provider: FundamentalProviderId;
    fallback: boolean;
    forceRefresh: boolean;
    tvSymbol?: string;
}
export declare class FundamentalOrchestratorService {
    private readonly symbolResolver;
    private readonly registry;
    private readonly rateLimiter;
    private readonly providerHealth;
    private readonly cacheService;
    private readonly metricsEngine;
    private readonly logger;
    constructor(symbolResolver: SymbolResolverService, registry: ProviderRegistryService, rateLimiter: ProviderRateLimitService, providerHealth: ProviderHealthService, cacheService: FundamentalCacheService, metricsEngine: MetricsEngineService);
    search(query: string, limit: number): Promise<import("../types/fundamental.types").FundamentalSearchItem[]>;
    getProviders(): import("../types/provider.types").ProviderDescriptor[];
    getFundamentals(input: FundamentalRequest): Promise<FundamentalResponse>;
    refreshFundamentals(input: FundamentalRequest): Promise<FundamentalResponse>;
    private execute;
    private normalizeProviderError;
    private getTtlByAssetType;
    private cloneResponse;
    private buildSyntheticPayload;
    private seedFromTicker;
}
