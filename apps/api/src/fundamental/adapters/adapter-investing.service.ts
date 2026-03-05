import { Injectable } from '@nestjs/common';
import { FundamentalProviderAdapter } from './fundamental-provider.adapter';
import { ProviderDescriptor } from '../types/provider.types';
import { ProviderFundamentalPayload, ResolvedSymbol } from '../types/fundamental.types';
import { fetchJsonWithRetry } from '../utils/http.util';
import { ProviderApiError } from '../utils/provider-error.util';

@Injectable()
export class AdapterInvestingService implements FundamentalProviderAdapter {
    readonly provider = 'investing' as const;

    private readonly endpoint = process.env.INVESTING_FUNDAMENTAL_ENDPOINT || '';

    getDescriptor(): ProviderDescriptor {
        return {
            id: this.provider,
            name: 'Investing (custom connector)',
            enabled: !!this.endpoint,
            supportsSearch: false,
            supportsFundamentals: true,
            notes: this.endpoint
                ? 'Usando endpoint externo configurable.'
                : 'No configurado. Definir INVESTING_FUNDAMENTAL_ENDPOINT.',
        };
    }

    supportsAssetType(assetType: string): boolean {
        return ['stock', 'etf', 'index', 'cedear', 'crypto', 'forex', 'commodity'].includes(
            (assetType || '').toLowerCase()
        );
    }

    async fetchFundamentals(symbol: ResolvedSymbol): Promise<ProviderFundamentalPayload> {
        if (!this.endpoint) {
            throw new ProviderApiError({
                provider: this.provider,
                message: 'INVESTING_FUNDAMENTAL_ENDPOINT no configurado',
                retryable: false,
            });
        }

        const query = new URLSearchParams({
            ticker: symbol.normalizedTicker,
            tvSymbol: symbol.tvSymbol,
            exchange: symbol.exchange,
            assetType: symbol.assetType,
        });

        const payload = await fetchJsonWithRetry<any>({
            provider: this.provider,
            url: `${this.endpoint}${this.endpoint.includes('?') ? '&' : '?'}${query.toString()}`,
            retries: 1,
        });

        if (!payload || typeof payload !== 'object') {
            throw new ProviderApiError({
                provider: this.provider,
                message: 'Investing connector devolvió payload inválido',
                retryable: false,
            });
        }

        return payload as ProviderFundamentalPayload;
    }
}
