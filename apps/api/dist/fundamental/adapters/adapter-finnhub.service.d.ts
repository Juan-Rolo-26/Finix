import { FundamentalProviderAdapter } from './fundamental-provider.adapter';
import { ProviderDescriptor } from '../types/provider.types';
import { ProviderFundamentalPayload, ResolvedSymbol } from '../types/fundamental.types';
export declare class AdapterFinnhubService implements FundamentalProviderAdapter {
    readonly provider: "finnhub";
    private readonly apiToken;
    private readonly baseUrl;
    getDescriptor(): ProviderDescriptor;
    supportsAssetType(assetType: string): boolean;
    private buildUrl;
    private valueFromConcepts;
    fetchFundamentals(symbol: ResolvedSymbol): Promise<ProviderFundamentalPayload>;
}
