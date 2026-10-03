import { financialNumber, isCalendarDate, earningsSurprise } from '@finix/shared';
import {
    DerivedFundamentalData,
    EarningsPoint,
    FundamentalMetrics,
    FundamentalResponse,
    StatementPoint,
    ProviderFundamentalPayload,
    ResolvedSymbol,
} from '../types/fundamental.types';
import { FundamentalProviderId } from '../types/provider.types';

export function defaultMetrics(): FundamentalMetrics {
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

export function defaultDerived(): DerivedFundamentalData {
    return {
        dcfSimple: null,
        finixFundamentalScore: null,
        sectorComparison: null,
    };
}

const statementFields = ['revenue', 'grossProfit', 'operatingIncome', 'netIncome', 'eps', 'ebitda',
    'totalAssets', 'totalLiabilities', 'totalEquity', 'cashAndEquivalents', 'totalDebt',
    'operatingCashFlow', 'capex', 'freeCashFlow'] as const;

function normalizeStatementArray(values: StatementPoint[] | undefined): StatementPoint[] {
    if (!Array.isArray(values)) return [];
    return values.filter(item => isCalendarDate(item?.date)).map(item => ({
        ...item, ...Object.fromEntries(statementFields.map(field => [field, financialNumber(item[field]) ?? null])),
    })).filter(item => statementFields.some(field => item[field] !== null))
        .sort((a, b) => b.date.localeCompare(a.date));
}

function normalizeEarnings(values: EarningsPoint[] | undefined): EarningsPoint[] {
    if (!Array.isArray(values)) return [];
    return values.filter(item => isCalendarDate(item?.date)).map(item => ({
        ...item,
        actualEps: financialNumber(item.actualEps) ?? null,
        estimatedEps: financialNumber(item.estimatedEps) ?? null,
        surprisePct: earningsSurprise(item.actualEps, item.estimatedEps) ?? null,
    })).filter(item => item.actualEps !== null || item.estimatedEps !== null)
        .sort((a, b) => b.date.localeCompare(a.date));
}

export function buildNormalizedResponse(params: {
    inputTicker: string;
    resolved: ResolvedSymbol;
    payload: ProviderFundamentalPayload;
    providerRequested: FundamentalProviderId;
    providerUsed: FundamentalProviderId;
    providersTried: FundamentalProviderId[];
    errors: Array<{ provider: FundamentalProviderId; message: string }>;
    requestId: string;
    cacheHit: boolean;
    stale: boolean;
    staleFromCache: boolean;
    warnings: string[];
    latencyMs?: number;
    fetchedAt?: Date;
}): FundamentalResponse {
    const metrics = {
        ...defaultMetrics(),
        ...Object.fromEntries(Object.keys(defaultMetrics()).map(field => [field, financialNumber(params.payload.metrics[field]) ?? null])),
    };

    const statements = {
        incomeStatement: normalizeStatementArray(params.payload.statements.incomeStatement),
        balanceSheet: normalizeStatementArray(params.payload.statements.balanceSheet),
        cashFlow: normalizeStatementArray(params.payload.statements.cashFlow),
        earnings: normalizeEarnings(params.payload.statements.earnings),
    };

    const requiredFields: Array<keyof FundamentalMetrics> = [
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
