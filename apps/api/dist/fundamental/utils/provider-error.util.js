"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderApiError = void 0;
exports.isRetryableStatus = isRetryableStatus;
class ProviderApiError extends Error {
    constructor(params) {
        super(params.message);
        this.name = 'ProviderApiError';
        this.provider = params.provider;
        this.retryable = params.retryable ?? false;
        this.statusCode = params.statusCode;
    }
}
exports.ProviderApiError = ProviderApiError;
function isRetryableStatus(status) {
    return status === 408 || status === 425 || status === 429 || status >= 500;
}
//# sourceMappingURL=provider-error.util.js.map