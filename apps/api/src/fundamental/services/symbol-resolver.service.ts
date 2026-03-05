import { Injectable } from '@nestjs/common';
import { MarketService } from '../../market/market.service';
import { fromDirectTicker, fromSearchResult } from '../normalizers/symbol.normalizer';
import { FundamentalSearchItem, ResolvedSymbol } from '../types/fundamental.types';

@Injectable()
export class SymbolResolverService {
    constructor(private readonly marketService: MarketService) {}

    async search(query: string, limit = 20): Promise<FundamentalSearchItem[]> {
        const raw = await this.marketService.searchSymbols(query);
        const items = Array.isArray(raw) ? raw : [];

        const normalized = items.map((item: any) =>
            fromSearchResult({
                input: query,
                symbol: String(item?.symbol || ''),
                exchange: typeof item?.exchange === 'string' ? item.exchange : undefined,
                type: typeof item?.type === 'string' ? item.type : undefined,
                name: typeof item?.name === 'string' ? item.name : undefined,
            })
        );

        const deduped = normalized.filter(
            (item, index, arr) => arr.findIndex((candidate) => candidate.tvSymbol === item.tvSymbol) === index
        );

        return deduped.slice(0, Math.max(1, Math.min(limit, 50)));
    }

    async resolve(input: string, explicitTvSymbol?: string): Promise<ResolvedSymbol> {
        if (explicitTvSymbol) {
            const direct = fromDirectTicker(explicitTvSymbol);
            return {
                ...direct,
                input,
            };
        }

        const normalizedInput = (input || '').trim();
        if (!normalizedInput) {
            return fromDirectTicker('');
        }

        const upperInput = normalizedInput.toUpperCase();
        if (upperInput.includes(':')) {
            const direct = fromDirectTicker(upperInput);
            return {
                ...direct,
                input,
            };
        }

        const candidates = await this.search(normalizedInput, 12);
        const exact = candidates.find((item) => item.normalizedTicker === upperInput);
        if (exact) {
            return {
                input,
                tvSymbol: exact.tvSymbol,
                normalizedTicker: exact.normalizedTicker,
                exchange: exact.exchange,
                assetType: exact.assetType,
                name: exact.name,
            };
        }

        const startsWith = candidates.find((item) => item.normalizedTicker.startsWith(upperInput));
        if (startsWith) {
            return {
                input,
                tvSymbol: startsWith.tvSymbol,
                normalizedTicker: startsWith.normalizedTicker,
                exchange: startsWith.exchange,
                assetType: startsWith.assetType,
                name: startsWith.name,
            };
        }

        const fallback = fromDirectTicker(upperInput);
        return {
            ...fallback,
            input,
        };
    }
}
