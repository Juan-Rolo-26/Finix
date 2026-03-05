import { FundamentalProviderId } from '../types/provider.types';
export declare class ProviderApiError extends Error {
    readonly provider: FundamentalProviderId;
    readonly retryable: boolean;
    readonly statusCode?: number;
    constructor(params: {
        provider: FundamentalProviderId;
        message: string;
        retryable?: boolean;
        statusCode?: number;
    });
}
export declare function isRetryableStatus(status: number): boolean;
