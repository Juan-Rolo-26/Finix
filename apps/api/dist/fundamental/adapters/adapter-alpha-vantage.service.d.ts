import { FundamentalProviderAdapter } from './fundamental-provider.adapter';
import { ProviderDescriptor } from '../types/provider.types';
import { ProviderFundamentalPayload, ResolvedSymbol } from '../types/fundamental.types';
export declare class AdapterAlphaVantageService implements FundamentalProviderAdapter {
    readonly provider: "alphavantage";
    private readonly apiKey;
    private readonly baseUrl;
    getDescriptor(): ProviderDescriptor;
    supportsAssetType(assetType: string): boolean;
    private buildUrl;
    private assertNoRateLimit;
    fetchFundamentals(symbol: ResolvedSymbol): Promise<ProviderFundamentalPayload>;
}
