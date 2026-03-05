import { AdapterAlphaVantageService } from '../adapters/adapter-alpha-vantage.service';
import { AdapterFinnhubService } from '../adapters/adapter-finnhub.service';
import { AdapterFMPService } from '../adapters/adapter-fmp.service';
import { AdapterInvestingService } from '../adapters/adapter-investing.service';
import { FundamentalProviderAdapter } from '../adapters/fundamental-provider.adapter';
import { ProviderDescriptor, FundamentalProviderId } from '../types/provider.types';
export declare class ProviderRegistryService {
    private readonly fmp;
    private readonly finnhub;
    private readonly alphaVantage;
    private readonly investing;
    private readonly adapters;
    constructor(fmp: AdapterFMPService, finnhub: AdapterFinnhubService, alphaVantage: AdapterAlphaVantageService, investing: AdapterInvestingService);
    getAdapter(provider: FundamentalProviderId): FundamentalProviderAdapter | null;
    listProviders(): ProviderDescriptor[];
    getFallbackOrder(requested: FundamentalProviderId, assetType: string): FundamentalProviderId[];
}
