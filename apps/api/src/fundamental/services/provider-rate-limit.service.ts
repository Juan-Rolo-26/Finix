import { Injectable } from '@nestjs/common';
import { FundamentalProviderId } from '../types/provider.types';

interface ProviderLimitConfig {
    maxRequests: number;
    windowMs: number;
}

interface ProviderLimitState {
    count: number;
    windowStart: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class ProviderRateLimitService {
    private readonly limits = new Map<FundamentalProviderId, ProviderLimitConfig>([
        ['fmp', { maxRequests: 240, windowMs: 60_000 }],
        ['finnhub', { maxRequests: 55, windowMs: 60_000 }],
        ['alphavantage', { maxRequests: 5, windowMs: 60_000 }],
        ['investing', { maxRequests: 25, windowMs: 60_000 }],
        ['polygon', { maxRequests: 200, windowMs: 60_000 }],
    ]);

    private readonly states = new Map<FundamentalProviderId, ProviderLimitState>();
    private readonly queues = new Map<FundamentalProviderId, Promise<unknown>>();

    private async waitForSlot(provider: FundamentalProviderId): Promise<void> {
        const limit = this.limits.get(provider);
        if (!limit) return;

        const now = Date.now();
        const state = this.states.get(provider) || { count: 0, windowStart: now };

        if (now - state.windowStart >= limit.windowMs) {
            state.windowStart = now;
            state.count = 0;
        }

        if (state.count >= limit.maxRequests) {
            const waitMs = limit.windowMs - (now - state.windowStart);
            if (waitMs > 0) {
                await sleep(waitMs);
            }
            state.windowStart = Date.now();
            state.count = 0;
        }

        state.count += 1;
        this.states.set(provider, state);
    }

    async schedule<T>(provider: FundamentalProviderId, task: () => Promise<T>): Promise<T> {
        const previous = this.queues.get(provider) || Promise.resolve();

        const current = previous
            .catch(() => undefined)
            .then(async () => {
                await this.waitForSlot(provider);
                return task();
            });

        this.queues.set(provider, current.then(() => undefined, () => undefined));
        return current;
    }
}
