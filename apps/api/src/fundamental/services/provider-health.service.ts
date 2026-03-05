import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FundamentalProviderId } from '../types/provider.types';

interface HealthState {
    failCount: number;
    consecutive429: number;
    cooldownUntil?: number;
    lastError?: string;
}

@Injectable()
export class ProviderHealthService {
    private readonly logger = new Logger(ProviderHealthService.name);
    private readonly states = new Map<FundamentalProviderId, HealthState>();

    constructor(private readonly prisma: PrismaService) {}

    private isMissingStorage(error: any): boolean {
        const code = typeof error?.code === 'string' ? error.code : '';
        const message = String(error?.message || '').toLowerCase();
        return code === 'P2021' || message.includes('no such table') || message.includes('does not exist');
    }

    private getState(provider: FundamentalProviderId): HealthState {
        return this.states.get(provider) || { failCount: 0, consecutive429: 0 };
    }

    async isOpen(provider: FundamentalProviderId): Promise<boolean> {
        const state = this.getState(provider);
        const now = Date.now();

        if (state.cooldownUntil && now < state.cooldownUntil) {
            return true;
        }

        if (state.cooldownUntil && now >= state.cooldownUntil) {
            state.cooldownUntil = undefined;
            this.states.set(provider, state);
            await this.persist(provider, state, 'healthy');
        }

        return false;
    }

    async recordSuccess(provider: FundamentalProviderId): Promise<void> {
        const state: HealthState = {
            failCount: 0,
            consecutive429: 0,
            cooldownUntil: undefined,
            lastError: undefined,
        };
        this.states.set(provider, state);
        await this.persist(provider, state, 'healthy');
    }

    async recordFailure(params: {
        provider: FundamentalProviderId;
        message: string;
        statusCode?: number;
    }): Promise<void> {
        const state = this.getState(params.provider);
        state.failCount += 1;
        state.lastError = params.message.slice(0, 250);

        if (params.statusCode === 429) {
            state.consecutive429 += 1;
        } else {
            state.consecutive429 = 0;
        }

        const cooldownMs =
            params.statusCode === 429
                ? 60_000 * Math.max(1, state.consecutive429)
                : state.failCount >= 3
                    ? 30_000
                    : 0;

        if (cooldownMs > 0) {
            state.cooldownUntil = Date.now() + cooldownMs;
        }

        this.states.set(params.provider, state);

        if (state.cooldownUntil) {
            this.logger.warn(`Provider ${params.provider} opened for ${Math.round(cooldownMs / 1000)}s due to repeated failures`);
        }

        const dbState = state.cooldownUntil ? 'open' : state.failCount > 0 ? 'degraded' : 'healthy';
        await this.persist(params.provider, state, dbState);
    }

    private async persist(provider: FundamentalProviderId, state: HealthState, status: string): Promise<void> {
        try {
            await this.prisma.providerHealth.upsert({
                where: { provider },
                create: {
                    provider,
                    state: status,
                    failCount: state.failCount,
                    consecutive429: state.consecutive429,
                    lastError: state.lastError,
                    lastFailureAt: state.lastError ? new Date() : null,
                    cooldownUntil: state.cooldownUntil ? new Date(state.cooldownUntil) : null,
                },
                update: {
                    state: status,
                    failCount: state.failCount,
                    consecutive429: state.consecutive429,
                    lastError: state.lastError,
                    lastFailureAt: state.lastError ? new Date() : null,
                    cooldownUntil: state.cooldownUntil ? new Date(state.cooldownUntil) : null,
                },
            });
        } catch (error: any) {
            if (this.isMissingStorage(error)) {
                this.logger.warn('ProviderHealth table unavailable. Keeping health state in memory only.');
                return;
            }
            throw error;
        }
    }
}
