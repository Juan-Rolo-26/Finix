import { ProviderApiError, isRetryableStatus } from './provider-error.util';
import { FundamentalProviderId } from '../types/provider.types';

export interface JsonRequestConfig {
    provider: FundamentalProviderId;
    url: string;
    timeoutMs?: number;
    headers?: Record<string, string>;
    retries?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchOnce(config: JsonRequestConfig): Promise<unknown> {
    const controller = new AbortController();
    const timeoutMs = config.timeoutMs ?? 8000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(config.url, {
            headers: {
                Accept: 'application/json,text/plain,*/*',
                'User-Agent': 'Finix-Fundamental/1.0',
                ...config.headers,
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new ProviderApiError({
                provider: config.provider,
                message: `${config.provider} HTTP ${response.status}: ${text.slice(0, 160)}`,
                statusCode: response.status,
                retryable: isRetryableStatus(response.status),
            });
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
            const raw = await response.text();
            throw new ProviderApiError({
                provider: config.provider,
                message: `${config.provider} returned non-JSON payload: ${raw.slice(0, 160)}`,
                retryable: false,
            });
        }

        return response.json();
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            throw new ProviderApiError({
                provider: config.provider,
                message: `${config.provider} request timeout after ${timeoutMs}ms`,
                retryable: true,
            });
        }
        if (error instanceof ProviderApiError) {
            throw error;
        }
        throw new ProviderApiError({
            provider: config.provider,
            message: `${config.provider} request failed: ${error?.message || 'unknown error'}`,
            retryable: true,
        });
    } finally {
        clearTimeout(timeout);
    }
}

export async function fetchJsonWithRetry<T = unknown>(config: JsonRequestConfig): Promise<T> {
    const retries = Math.max(0, config.retries ?? 2);
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return (await fetchOnce(config)) as T;
        } catch (error: any) {
            lastError = error;
            const retryable = error instanceof ProviderApiError ? error.retryable : false;
            if (!retryable || attempt === retries) {
                throw error;
            }

            const jitter = Math.floor(Math.random() * 120);
            const backoff = 200 * Math.pow(2, attempt) + jitter;
            await sleep(backoff);
        }
    }

    throw lastError;
}
