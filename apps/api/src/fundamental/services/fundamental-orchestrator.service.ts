import { Injectable, Logger } from '@nestjs/common';
import { buildNormalizedResponse } from '../normalizers/fundamental.normalizer';
import { FundamentalResponse, ProviderFundamentalPayload, ResolvedSymbol } from '../types/fundamental.types';
import { FundamentalProviderId } from '../types/provider.types';
import { ProviderApiError } from '../utils/provider-error.util';
import { FundamentalCacheService } from './fundamental-cache.service';
import { MetricsEngineService } from './metrics-engine.service';
import { ProviderHealthService } from './provider-health.service';
import { ProviderRateLimitService } from './provider-rate-limit.service';
import { ProviderRegistryService } from './provider-registry.service';
import { SymbolResolverService } from './symbol-resolver.service';

export interface FundamentalRequest {
    ticker: string;
    provider: FundamentalProviderId;
    fallback: boolean;
    forceRefresh: boolean;
    tvSymbol?: string;
}

@Injectable()
export class FundamentalOrchestratorService {
    private readonly logger = new Logger(FundamentalOrchestratorService.name);

    constructor(
        private readonly symbolResolver: SymbolResolverService,
        private readonly registry: ProviderRegistryService,
        private readonly rateLimiter: ProviderRateLimitService,
        private readonly providerHealth: ProviderHealthService,
        private readonly cacheService: FundamentalCacheService,
        private readonly metricsEngine: MetricsEngineService
    ) {}

    async search(query: string, limit: number) {
        return this.symbolResolver.search(query, limit);
    }

    getProviders() {
        return this.registry.listProviders();
    }

    async getFundamentals(input: FundamentalRequest): Promise<FundamentalResponse> {
        return this.execute(input);
    }

    async refreshFundamentals(input: FundamentalRequest): Promise<FundamentalResponse> {
        return this.execute({
            ...input,
            forceRefresh: true,
        });
    }

    private async execute(input: FundamentalRequest): Promise<FundamentalResponse> {
        const startedAt = Date.now();
        const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const resolved = await this.symbolResolver.resolve(input.ticker, input.tvSymbol);

        const cacheKey = this.cacheService.buildCacheKey(resolved.normalizedTicker, input.provider);
        const cached = input.forceRefresh ? null : await this.cacheService.get(cacheKey);

        if (cached && !cached.stale) {
            const cloned = this.cloneResponse(cached.data);
            cloned.quality.cacheHit = true;
            cloned.quality.stale = false;
            cloned.source.requestId = requestId;
            cloned.source.staleFromCache = false;
            cloned.source.latencyMs = Date.now() - startedAt;
            return cloned;
        }

        const staleCandidate = cached?.stale ? this.cloneResponse(cached.data) : null;

        const providersToTry = this.registry.getFallbackOrder(input.provider, resolved.assetType);
        const providersTried: FundamentalProviderId[] = [];
        const errors: Array<{ provider: FundamentalProviderId; message: string }> = [];

        const chain = input.fallback ? providersToTry : providersToTry.filter((provider) => provider === input.provider);

        if (chain.length === 0) {
            let fallbackResponse = buildNormalizedResponse({
                inputTicker: input.ticker,
                resolved,
                payload: this.buildUnavailablePayload(resolved),
                providerRequested: input.provider,
                providerUsed: input.provider,
                providersTried: [],
                errors: [],
                requestId,
                cacheHit: false,
                stale: false,
                staleFromCache: false,
                warnings: [
                    'No hay proveedores fundamentales configurados actualmente. Los datos no están disponibles.',
                ],
                latencyMs: Date.now() - startedAt,
                fetchedAt: new Date(),
            });

            fallbackResponse = this.metricsEngine.enrich(fallbackResponse);
            return fallbackResponse;
        }

        for (const providerId of chain) {
            const adapter = this.registry.getAdapter(providerId);
            if (!adapter) continue;

            const isOpen = await this.providerHealth.isOpen(providerId);
            if (isOpen) {
                if (chain.length === 1) {
                    this.logger.warn(`Provider ${providerId} en cooldown, forzando intento por falta de alternativas.`);
                } else {
                    errors.push({
                        provider: providerId,
                        message: 'Provider en cooldown por fallos previos.',
                    });
                    continue;
                }
            }

            providersTried.push(providerId);

            try {
                const payload = await this.rateLimiter.schedule(providerId, () => adapter.fetchFundamentals(resolved));

                let response = buildNormalizedResponse({
                    inputTicker: input.ticker,
                    resolved,
                    payload,
                    providerRequested: input.provider,
                    providerUsed: providerId,
                    providersTried,
                    errors,
                    requestId,
                    cacheHit: false,
                    stale: false,
                    staleFromCache: false,
                    warnings: providerId !== input.provider ? [`Fallback aplicado desde ${input.provider} a ${providerId}.`] : [],
                    latencyMs: Date.now() - startedAt,
                    fetchedAt: new Date(),
                });

                response = this.metricsEngine.enrich(response);
                await this.providerHealth.recordSuccess(providerId);

                const { ttlMs, staleTtlMs } = this.getTtlByAssetType(resolved);
                await this.cacheService.set({
                    cacheKey,
                    ticker: resolved.normalizedTicker,
                    providerRequested: input.provider,
                    providerUsed: providerId,
                    data: response,
                    ttlMs,
                    staleTtlMs,
                });

                return response;
            } catch (error: any) {
                const providerError = this.normalizeProviderError(providerId, error);
                errors.push({
                    provider: providerId,
                    message: providerError.message,
                });

                await this.providerHealth.recordFailure({
                    provider: providerId,
                    message: providerError.message,
                    statusCode: providerError.statusCode,
                });

                this.logger.warn(`Provider ${providerId} failed for ${resolved.normalizedTicker}: ${providerError.message}`);
            }
        }

        if (staleCandidate) {
            staleCandidate.quality.cacheHit = true;
            staleCandidate.quality.stale = true;
            staleCandidate.quality.warnings = [
                ...staleCandidate.quality.warnings,
                'Se devolvió cache vencido (stale) por fallo temporal de proveedores.',
            ];
            staleCandidate.source.requestId = requestId;
            staleCandidate.source.providersTried = providersTried;
            staleCandidate.source.errors = errors;
            staleCandidate.source.staleFromCache = true;
            staleCandidate.source.latencyMs = Date.now() - startedAt;
            return staleCandidate;
        }

        const message = errors.length
            ? `No se pudo obtener fundamentales para ${input.ticker}. ${errors
                .map((item) => `${item.provider}: ${item.message}`)
                .join(' | ')}`
            : `No se pudo obtener fundamentales para ${input.ticker}`;

        let unavailableResponse = buildNormalizedResponse({
            inputTicker: input.ticker,
            resolved,
            payload: this.buildUnavailablePayload(resolved),
            providerRequested: input.provider,
            providerUsed: providersTried[0] || input.provider,
            providersTried,
            errors,
            requestId,
            cacheHit: false,
            stale: false,
            staleFromCache: false,
            warnings: [
                'Los datos fundamentales no están disponibles porque los proveedores reales no respondieron.',
                message,
            ],
            latencyMs: Date.now() - startedAt,
            fetchedAt: new Date(),
        });

        unavailableResponse = this.metricsEngine.enrich(unavailableResponse);
        return unavailableResponse;
    }

    private normalizeProviderError(provider: FundamentalProviderId, error: unknown): ProviderApiError {
        if (error instanceof ProviderApiError) {
            return error;
        }

        const message = error instanceof Error ? error.message : 'Unknown provider error';
        return new ProviderApiError({
            provider,
            message,
            retryable: false,
        });
    }

    private getTtlByAssetType(symbol: ResolvedSymbol): { ttlMs: number; staleTtlMs: number } {
        switch (symbol.assetType) {
            case 'stock':
            case 'etf':
            case 'cedear':
            case 'index':
                return { ttlMs: 6 * 60 * 60 * 1000, staleTtlMs: 24 * 60 * 60 * 1000 };
            case 'crypto':
                return { ttlMs: 60 * 60 * 1000, staleTtlMs: 6 * 60 * 60 * 1000 };
            default:
                return { ttlMs: 2 * 60 * 60 * 1000, staleTtlMs: 12 * 60 * 60 * 1000 };
        }
    }

    private cloneResponse(value: FundamentalResponse): FundamentalResponse {
        return JSON.parse(JSON.stringify(value)) as FundamentalResponse;
    }

    private buildUnavailablePayload(symbol: ResolvedSymbol): ProviderFundamentalPayload {
        // Missing upstream data must never become fabricated financial values.
        return {
            instrument: {
                normalizedTicker: symbol.normalizedTicker,
                tvSymbol: symbol.tvSymbol,
                exchange: symbol.exchange || 'AUTO',
                assetType: symbol.assetType,
                name: symbol.name || symbol.normalizedTicker,
            },
            statements: { incomeStatement: [], balanceSheet: [], cashFlow: [], earnings: [] },
            metrics: {
                marketCap: null, enterpriseValue: null, peRatio: null,
                roe: null, roic: null, debtToEquity: null, netMargin: null,
                freeCashFlow: null, revenueGrowthCagr: null,
            },
        };
    }
}
