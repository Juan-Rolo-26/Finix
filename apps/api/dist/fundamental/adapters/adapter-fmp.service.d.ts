import { FundamentalProviderAdapter } from './fundamental-provider.adapter';
import { ProviderDescriptor } from '../types/provider.types';
import { ProviderFundamentalPayload, ResolvedSymbol } from '../types/fundamental.types';
export declare class AdapterFMPService implements FundamentalProviderAdapter {
    readonly provider: "fmp";
    private readonly apiKey;
    private readonly baseUrl;
    getDescriptor(): ProviderDescriptor;
    supportsAssetType(assetType: string): boolean;
    private buildUrl;
    fetchFundamentals(symbol: ResolvedSymbol): Promise<ProviderFundamentalPayload>;
}
