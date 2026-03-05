"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultMetrics = defaultMetrics;
exports.defaultDerived = defaultDerived;
exports.buildNormalizedResponse = buildNormalizedResponse;
function defaultMetrics() {
    return {
        marketCap: null,
        enterpriseValue: null,
        peRatio: null,
        roe: null,
        roic: null,
        debtToEquity: null,
        netMargin: null,
        freeCashFlow: null,
        revenueGrowthCagr: null,
    };
}
function defaultDerived() {
    return {
        dcfSimple: null,
        finixFundamentalScore: null,
        sectorComparison: null,
    };
}
function normalizeStatementArray(values) {
    if (!Array.isArray(values))
        return [];
    return values
        .filter((item) => typeof item?.date === 'string' && item.date.length > 0)
        .sort((a, b) => (a.date > b.date ? -1 : 1));
}
function normalizeEarnings(values) {
    if (!Array.isArray(values))
        return [];
    return values
        .filter((item) => typeof item?.date === 'string' && item.date.length > 0)
        .sort((a, b) => (a.date > b.date ? -1 : 1));
}
function buildNormalizedResponse(params) {
    const metrics = {
        ...defaultMetrics(),
        ...params.payload.metrics,
    };
    const statements = {
        incomeStatement: normalizeStatementArray(params.payload.statements.incomeStatement),
        balanceSheet: normalizeStatementArray(params.payload.statements.balanceSheet),
        cashFlow: normalizeStatementArray(params.payload.statements.cashFlow),
        earnings: normalizeEarnings(params.payload.statements.earnings),
    };
    const requiredFields = [
        'marketCap',
        'enterpriseValue',
        'peRatio',
        'roe',
        'roic',
        'debtToEquity',
        'netMargin',
        'freeCashFlow',
        'revenueGrowthCagr',
    ];
    const missingFields = requiredFields.filter((field) => metrics[field] === null || metrics[field] === undefined);
    const coverage = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100);
    return {
        instrument: {
            input: params.inputTicker,
            normalizedTicker: params.payload.instrument.normalizedTicker || params.resolved.normalizedTicker,
            tvSymbol: params.payload.instrument.tvSymbol || params.resolved.tvSymbol,
            exchange: params.payload.instrument.exchange || params.resolved.exchange,
            assetType: params.payload.instrument.assetType || params.resolved.assetType,
            name: params.payload.instrument.name || params.resolved.name,
            providerRequested: params.providerRequested,
            providerUsed: params.providerUsed,
            asOf: (params.fetchedAt || new Date()).toISOString(),
        },
        statements,
        metrics,
        derived: defaultDerived(),
        quality: {
            coverage,
            missingFields,
            cacheHit: params.cacheHit,
            stale: params.stale,
            warnings: params.warnings,
        },
        source: {
            latencyMs: params.latencyMs,
            requestId: params.requestId,
            providersTried: params.providersTried,
            errors: params.errors,
            fetchedAt: (params.fetchedAt || new Date()).toISOString(),
            staleFromCache: params.staleFromCache,
        },
    };
}
//# sourceMappingURL=fundamental.normalizer.js.map