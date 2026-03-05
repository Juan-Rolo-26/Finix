import { DerivedFundamentalData, FundamentalMetrics, FundamentalResponse, ProviderFundamentalPayload, ResolvedSymbol } from '../types/fundamental.types';
import { FundamentalProviderId } from '../types/provider.types';
export declare function defaultMetrics(): FundamentalMetrics;
export declare function defaultDerived(): DerivedFundamentalData;
export declare function buildNormalizedResponse(params: {
    inputTicker: string;
    resolved: ResolvedSymbol;
    payload: ProviderFundamentalPayload;
    providerRequested: FundamentalProviderId;
    providerUsed: FundamentalProviderId;
    providersTried: FundamentalProviderId[];
    errors: Array<{
        provider: FundamentalProviderId;
        message: string;
    }>;
    requestId: string;
    cacheHit: boolean;
    stale: boolean;
    staleFromCache: boolean;
    warnings: string[];
    latencyMs?: number;
    fetchedAt?: Date;
}): FundamentalResponse;
