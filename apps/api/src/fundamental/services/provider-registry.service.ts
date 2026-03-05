import { Injectable } from '@nestjs/common';
import { AdapterAlphaVantageService } from '../adapters/adapter-alpha-vantage.service';
import { AdapterFinnhubService } from '../adapters/adapter-finnhub.service';
import { AdapterFMPService } from '../adapters/adapter-fmp.service';
import { AdapterInvestingService } from '../adapters/adapter-investing.service';
import { FundamentalProviderAdapter } from '../adapters/fundamental-provider.adapter';
import { ProviderDescriptor, FundamentalProviderId } from '../types/provider.types';

@Injectable()
export class ProviderRegistryService {
    private readonly adapters = new Map<FundamentalProviderId, FundamentalProviderAdapter>();

    constructor(
        private readonly fmp: AdapterFMPService,
        private readonly finnhub: AdapterFinnhubService,
        private readonly alphaVantage: AdapterAlphaVantageService,
        private readonly investing: AdapterInvestingService
    ) {
        this.adapters.set(this.fmp.provider, this.fmp);
        this.adapters.set(this.finnhub.provider, this.finnhub);
        this.adapters.set(this.alphaVantage.provider, this.alphaVantage);
        this.adapters.set(this.investing.provider, this.investing);
    }

    getAdapter(provider: FundamentalProviderId): FundamentalProviderAdapter | null {
        return this.adapters.get(provider) || null;
    }

    listProviders(): ProviderDescriptor[] {
        const available = Array.from(this.adapters.values()).map((adapter) => adapter.getDescriptor());
        const hasPolygon = available.some((item) => item.id === 'polygon');
        if (!hasPolygon) {
            available.push({
                id: 'polygon',
                name: 'Polygon (futuro)',
                enabled: false,
                supportsSearch: false,
                supportsFundamentals: false,
                notes: 'Pendiente de implementación',
            });
        }

        return available;
    }

    getFallbackOrder(requested: FundamentalProviderId, assetType: string): FundamentalProviderId[] {
        const preferred: FundamentalProviderId[] = [requested, 'fmp', 'finnhub', 'alphavantage', 'investing'];
        const ordered = preferred.filter((item, index, arr) => arr.indexOf(item) === index);

        return ordered.filter((providerId) => {
            const adapter = this.adapters.get(providerId);
            if (!adapter) return false;
            const descriptor = adapter.getDescriptor();
            if (!descriptor.enabled || !descriptor.supportsFundamentals) return false;
            return adapter.supportsAssetType(assetType);
        });
    }
}
