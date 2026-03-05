"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FundamentalOrchestratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundamentalOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const fundamental_normalizer_1 = require("../normalizers/fundamental.normalizer");
const provider_error_util_1 = require("../utils/provider-error.util");
const fundamental_cache_service_1 = require("./fundamental-cache.service");
const metrics_engine_service_1 = require("./metrics-engine.service");
const provider_health_service_1 = require("./provider-health.service");
const provider_rate_limit_service_1 = require("./provider-rate-limit.service");
const provider_registry_service_1 = require("./provider-registry.service");
const symbol_resolver_service_1 = require("./symbol-resolver.service");
let FundamentalOrchestratorService = FundamentalOrchestratorService_1 = class FundamentalOrchestratorService {
    constructor(symbolResolver, registry, rateLimiter, providerHealth, cacheService, metricsEngine) {
        this.symbolResolver = symbolResolver;
        this.registry = registry;
        this.rateLimiter = rateLimiter;
        this.providerHealth = providerHealth;
        this.cacheService = cacheService;
        this.metricsEngine = metricsEngine;
        this.logger = new common_1.Logger(FundamentalOrchestratorService_1.name);
    }
    async search(query, limit) {
        return this.symbolResolver.search(query, limit);
    }
    getProviders() {
        return this.registry.listProviders();
    }
    async getFundamentals(input) {
        return this.execute(input);
    }
    async refreshFundamentals(input) {
        return this.execute({
            ...input,
            forceRefresh: true,
        });
    }
    async execute(input) {
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
        const providersTried = [];
        const errors = [];
        const chain = input.fallback ? providersToTry : providersToTry.filter((provider) => provider === input.provider);
        if (chain.length === 0) {
            let fallbackResponse = (0, fundamental_normalizer_1.buildNormalizedResponse)({
                inputTicker: input.ticker,
                resolved,
                payload: this.buildSyntheticPayload(resolved),
                providerRequested: input.provider,
                providerUsed: input.provider,
                providersTried: [],
                errors: [],
                requestId,
                cacheHit: false,
                stale: false,
                staleFromCache: false,
                warnings: [
                    'No hay proveedores fundamentales configurados actualmente. Se muestran datos estimados de respaldo.',
                ],
                latencyMs: Date.now() - startedAt,
                fetchedAt: new Date(),
            });
            fallbackResponse = this.metricsEngine.enrich(fallbackResponse);
            return fallbackResponse;
        }
        for (const providerId of chain) {
            const adapter = this.registry.getAdapter(providerId);
            if (!adapter)
                continue;
            const isOpen = await this.providerHealth.isOpen(providerId);
            if (isOpen) {
                if (chain.length === 1) {
                    this.logger.warn(`Provider ${providerId} en cooldown, forzando intento por falta de alternativas.`);
                }
                else {
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
                let response = (0, fundamental_normalizer_1.buildNormalizedResponse)({
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
            }
            catch (error) {
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
        let unavailableResponse = (0, fundamental_normalizer_1.buildNormalizedResponse)({
            inputTicker: input.ticker,
            resolved,
            payload: this.buildSyntheticPayload(resolved),
            providerRequested: input.provider,
            providerUsed: providersTried[0] || input.provider,
            providersTried,
            errors,
            requestId,
            cacheHit: false,
            stale: false,
            staleFromCache: false,
            warnings: [
                'Se muestran datos estimados de respaldo porque los proveedores reales no respondieron.',
                message,
            ],
            latencyMs: Date.now() - startedAt,
            fetchedAt: new Date(),
        });
        unavailableResponse = this.metricsEngine.enrich(unavailableResponse);
        return unavailableResponse;
    }
    normalizeProviderError(provider, error) {
        if (error instanceof provider_error_util_1.ProviderApiError) {
            return error;
        }
        const message = error instanceof Error ? error.message : 'Unknown provider error';
        return new provider_error_util_1.ProviderApiError({
            provider,
            message,
            retryable: false,
        });
    }
    getTtlByAssetType(symbol) {
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
    cloneResponse(value) {
        return JSON.parse(JSON.stringify(value));
    }
    buildSyntheticPayload(symbol) {
        const base = this.seedFromTicker(symbol.normalizedTicker);
        const currentYear = new Date().getUTCFullYear();
        const mkYear = (offset) => currentYear - offset;
        const revenue0 = 40_000_000_000 + base(1) * 300_000_000_000;
        const margin = 0.08 + base(2) * 0.22;
        const growth = 0.02 + base(3) * 0.18;
        const debtRatio = 0.15 + base(4) * 1.0;
        const roe = 8 + base(5) * 28;
        const roic = 6 + base(6) * 20;
        const pe = 10 + base(7) * 35;
        const incomeStatement = [];
        const balanceSheet = [];
        const cashFlow = [];
        for (let i = 4; i >= 0; i -= 1) {
            const year = mkYear(i);
            const revenue = revenue0 * Math.pow(1 + growth, 4 - i);
            const netIncome = revenue * margin;
            const operatingIncome = netIncome * 1.25;
            const grossProfit = revenue * (0.35 + base(8 + i) * 0.35);
            const assets = revenue * (1.1 + base(12 + i) * 0.8);
            const equity = assets * (0.35 + base(16 + i) * 0.35);
            const liabilities = Math.max(0, assets - equity);
            const debt = equity * debtRatio;
            const ocf = netIncome * (0.9 + base(20 + i) * 0.4);
            const capex = revenue * (0.03 + base(24 + i) * 0.06);
            const fcf = ocf - capex;
            incomeStatement.push({
                date: `${year}-12-31`,
                period: 'FY',
                fiscalYear: year,
                revenue: Math.round(revenue),
                grossProfit: Math.round(grossProfit),
                operatingIncome: Math.round(operatingIncome),
                netIncome: Math.round(netIncome),
                eps: Number((2 + base(30 + i) * 12).toFixed(2)),
                ebitda: Math.round(operatingIncome * 1.2),
            });
            balanceSheet.push({
                date: `${year}-12-31`,
                period: 'FY',
                fiscalYear: year,
                totalAssets: Math.round(assets),
                totalLiabilities: Math.round(liabilities),
                totalEquity: Math.round(equity),
                totalDebt: Math.round(debt),
                cashAndEquivalents: Math.round(assets * (0.05 + base(36 + i) * 0.12)),
            });
            cashFlow.push({
                date: `${year}-12-31`,
                period: 'FY',
                fiscalYear: year,
                operatingCashFlow: Math.round(ocf),
                capex: Math.round(capex),
                freeCashFlow: Math.round(fcf),
            });
        }
        const latestIncome = incomeStatement[incomeStatement.length - 1];
        const latestBalance = balanceSheet[balanceSheet.length - 1];
        const latestCash = cashFlow[cashFlow.length - 1];
        const marketCap = latestIncome.netIncome && pe ? latestIncome.netIncome * pe : null;
        const enterpriseValue = marketCap && latestCash.freeCashFlow ? marketCap + Math.max(0, latestCash.freeCashFlow * 4) : null;
        return {
            instrument: {
                normalizedTicker: symbol.normalizedTicker,
                tvSymbol: symbol.tvSymbol,
                exchange: symbol.exchange || 'AUTO',
                assetType: symbol.assetType,
                name: symbol.name || symbol.normalizedTicker,
            },
            statements: {
                incomeStatement: [...incomeStatement].reverse(),
                balanceSheet: [...balanceSheet].reverse(),
                cashFlow: [...cashFlow].reverse(),
                earnings: [...incomeStatement].reverse().map((item) => ({
                    date: item.date,
                    actualEps: item.eps || null,
                    estimatedEps: item.eps ? Number((item.eps * (0.92 + base(item.fiscalYear || 0) * 0.12)).toFixed(2)) : null,
                    surprisePct: Number(((base((item.fiscalYear || 0) + 99) * 12) - 4).toFixed(2)),
                })),
            },
            metrics: {
                marketCap: marketCap ? Math.round(marketCap) : null,
                enterpriseValue: enterpriseValue ? Math.round(enterpriseValue) : null,
                peRatio: Number(pe.toFixed(2)),
                roe: Number(roe.toFixed(2)),
                roic: Number(roic.toFixed(2)),
                debtToEquity: Number(debtRatio.toFixed(2)),
                netMargin: Number((margin * 100).toFixed(2)),
                freeCashFlow: latestCash.freeCashFlow || null,
                revenueGrowthCagr: Number((growth * 100).toFixed(2)),
            },
        };
    }
    seedFromTicker(ticker) {
        const hash = (ticker || '').split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) || 1;
        return (seed) => {
            const x = Math.sin(hash * 97 + seed * 7919) * 10000;
            return x - Math.floor(x);
        };
    }
};
exports.FundamentalOrchestratorService = FundamentalOrchestratorService;
exports.FundamentalOrchestratorService = FundamentalOrchestratorService = FundamentalOrchestratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [symbol_resolver_service_1.SymbolResolverService,
        provider_registry_service_1.ProviderRegistryService,
        provider_rate_limit_service_1.ProviderRateLimitService,
        provider_health_service_1.ProviderHealthService,
        fundamental_cache_service_1.FundamentalCacheService,
        metrics_engine_service_1.MetricsEngineService])
], FundamentalOrchestratorService);
//# sourceMappingURL=fundamental-orchestrator.service.js.map