export const FUNDAMENTAL_PROVIDER_IDS = ['fmp', 'finnhub', 'alphavantage', 'investing', 'polygon'] as const;

export type FundamentalProviderId = typeof FUNDAMENTAL_PROVIDER_IDS[number];

export interface ProviderDescriptor {
    id: FundamentalProviderId;
    name: string;
    enabled: boolean;
    supportsSearch: boolean;
    supportsFundamentals: boolean;
    notes?: string;
}

export interface ProviderRequestContext {
    provider: FundamentalProviderId;
    ticker: string;
    normalizedTicker: string;
    tvSymbol: string;
    exchange: string;
    assetType: string;
}

export interface ProviderErrorInfo {
    provider: FundamentalProviderId;
    message: string;
    retryable: boolean;
    statusCode?: number;
}
