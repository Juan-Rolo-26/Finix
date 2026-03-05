import { FundamentalProviderId } from './provider.types';

export type AssetType =
    | 'stock'
    | 'etf'
    | 'index'
    | 'cedear'
    | 'crypto'
    | 'forex'
    | 'commodity'
    | 'other';

export interface NormalizedInstrument {
    input: string;
    normalizedTicker: string;
    tvSymbol: string;
    exchange: string;
    assetType: AssetType;
    name: string;
    providerRequested: FundamentalProviderId;
    providerUsed: FundamentalProviderId;
    asOf: string;
}

export interface StatementPoint {
    date: string;
    period?: string | null;
    fiscalYear?: number | null;
    currency?: string | null;
    revenue?: number | null;
    grossProfit?: number | null;
    operatingIncome?: number | null;
    netIncome?: number | null;
    eps?: number | null;
    ebitda?: number | null;
    totalAssets?: number | null;
    totalLiabilities?: number | null;
    totalEquity?: number | null;
    cashAndEquivalents?: number | null;
    totalDebt?: number | null;
    operatingCashFlow?: number | null;
    capex?: number | null;
    freeCashFlow?: number | null;
}

export interface EarningsPoint {
    date: string;
    actualEps?: number | null;
    estimatedEps?: number | null;
    surprisePct?: number | null;
}

export interface FundamentalMetrics {
    marketCap: number | null;
    enterpriseValue: number | null;
    peRatio: number | null;
    roe: number | null;
    roic: number | null;
    debtToEquity: number | null;
    netMargin: number | null;
    freeCashFlow: number | null;
    revenueGrowthCagr: number | null;
}

export interface DerivedFundamentalData {
    dcfSimple: number | null;
    finixFundamentalScore: number | null;
    sectorComparison: {
        sector?: string | null;
        percentile?: number | null;
        note?: string | null;
    } | null;
}

export interface FundamentalQuality {
    coverage: number;
    missingFields: string[];
    cacheHit: boolean;
    stale: boolean;
    warnings: string[];
}

export interface FundamentalStatements {
    incomeStatement: StatementPoint[];
    balanceSheet: StatementPoint[];
    cashFlow: StatementPoint[];
    earnings: EarningsPoint[];
}

export interface FundamentalResponse {
    instrument: NormalizedInstrument;
    statements: FundamentalStatements;
    metrics: FundamentalMetrics;
    derived: DerivedFundamentalData;
    quality: FundamentalQuality;
    source: {
        latencyMs?: number;
        requestId: string;
        providersTried: FundamentalProviderId[];
        errors: {
            provider: FundamentalProviderId;
            message: string;
        }[];
        fetchedAt: string;
        staleFromCache: boolean;
    };
}

export interface FundamentalSearchItem {
    input: string;
    tvSymbol: string;
    normalizedTicker: string;
    exchange: string;
    assetType: AssetType;
    name: string;
}

export interface ResolvedSymbol {
    input: string;
    tvSymbol: string;
    normalizedTicker: string;
    exchange: string;
    assetType: AssetType;
    name: string;
}

export interface ProviderFundamentalPayload {
    instrument: {
        normalizedTicker: string;
        tvSymbol: string;
        exchange: string;
        assetType: AssetType;
        name: string;
    };
    statements: Partial<FundamentalStatements>;
    metrics: Partial<FundamentalMetrics>;
    meta?: {
        sector?: string | null;
        currency?: string | null;
    };
}
