import { FundamentalProviderId } from '../types/provider.types';

export class ProviderApiError extends Error {
    public readonly provider: FundamentalProviderId;
    public readonly retryable: boolean;
    public readonly statusCode?: number;

    constructor(params: {
        provider: FundamentalProviderId;
        message: string;
        retryable?: boolean;
        statusCode?: number;
    }) {
        super(params.message);
        this.name = 'ProviderApiError';
        this.provider = params.provider;
        this.retryable = params.retryable ?? false;
        this.statusCode = params.statusCode;
    }
}

export function isRetryableStatus(status: number): boolean {
    return status === 408 || status === 425 || status === 429 || status >= 500;
}
