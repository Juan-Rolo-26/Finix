"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchJsonWithRetry = fetchJsonWithRetry;
const provider_error_util_1 = require("./provider-error.util");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function fetchOnce(config) {
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
            throw new provider_error_util_1.ProviderApiError({
                provider: config.provider,
                message: `${config.provider} HTTP ${response.status}: ${text.slice(0, 160)}`,
                statusCode: response.status,
                retryable: (0, provider_error_util_1.isRetryableStatus)(response.status),
            });
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
            const raw = await response.text();
            throw new provider_error_util_1.ProviderApiError({
                provider: config.provider,
                message: `${config.provider} returned non-JSON payload: ${raw.slice(0, 160)}`,
                retryable: false,
            });
        }
        return response.json();
    }
    catch (error) {
        if (error?.name === 'AbortError') {
            throw new provider_error_util_1.ProviderApiError({
                provider: config.provider,
                message: `${config.provider} request timeout after ${timeoutMs}ms`,
                retryable: true,
            });
        }
        if (error instanceof provider_error_util_1.ProviderApiError) {
            throw error;
        }
        throw new provider_error_util_1.ProviderApiError({
            provider: config.provider,
            message: `${config.provider} request failed: ${error?.message || 'unknown error'}`,
            retryable: true,
        });
    }
    finally {
        clearTimeout(timeout);
    }
}
async function fetchJsonWithRetry(config) {
    const retries = Math.max(0, config.retries ?? 2);
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return (await fetchOnce(config));
        }
        catch (error) {
            lastError = error;
            const retryable = error instanceof provider_error_util_1.ProviderApiError ? error.retryable : false;
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
//# sourceMappingURL=http.util.js.map