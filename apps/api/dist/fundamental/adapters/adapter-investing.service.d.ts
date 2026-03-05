import { FundamentalProviderAdapter } from './fundamental-provider.adapter';
import { ProviderDescriptor } from '../types/provider.types';
import { ProviderFundamentalPayload, ResolvedSymbol } from '../types/fundamental.types';
export declare class AdapterInvestingService implements FundamentalProviderAdapter {
    readonly provider: "investing";
    private readonly endpoint;
    getDescriptor(): ProviderDescriptor;
    supportsAssetType(assetType: string): boolean;
    fetchFundamentals(symbol: ResolvedSymbol): Promise<ProviderFundamentalPayload>;
}
