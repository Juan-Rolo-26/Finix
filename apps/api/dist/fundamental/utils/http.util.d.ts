import { FundamentalProviderId } from '../types/provider.types';
export interface JsonRequestConfig {
    provider: FundamentalProviderId;
    url: string;
    timeoutMs?: number;
    headers?: Record<string, string>;
    retries?: number;
}
export declare function fetchJsonWithRetry<T = unknown>(config: JsonRequestConfig): Promise<T>;
