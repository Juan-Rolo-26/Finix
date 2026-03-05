import { ProviderFundamentalPayload, ResolvedSymbol } from '../types/fundamental.types';
import { FundamentalProviderId, ProviderDescriptor } from '../types/provider.types';
export interface FundamentalProviderAdapter {
    readonly provider: FundamentalProviderId;
    getDescriptor(): ProviderDescriptor;
    supportsAssetType(assetType: string): boolean;
    fetchFundamentals(symbol: ResolvedSymbol): Promise<ProviderFundamentalPayload>;
}
