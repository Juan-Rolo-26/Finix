import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FundamentalResponse } from '../types/fundamental.types';
import { FundamentalProviderId } from '../types/provider.types';

interface MemoryCacheEntry {
    value: FundamentalResponse;
    expiresAt: number;
    staleAt: number;
}

@Injectable()
export class FundamentalCacheService {
    private readonly logger = new Logger(FundamentalCacheService.name);
    private readonly memoryCache = new Map<string, MemoryCacheEntry>();
    private readonly memoryTtlMs = 90_000;

    constructor(private readonly prisma: PrismaService) {}

    private isMissingStorage(error: any): boolean {
        const code = typeof error?.code === 'string' ? error.code : '';
        const message = String(error?.message || '').toLowerCase();
        return code === 'P2021' || message.includes('no such table') || message.includes('does not exist');
    }

    buildCacheKey(ticker: string, providerRequested: FundamentalProviderId): string {
        return `${providerRequested}:${ticker.toUpperCase()}`;
    }

    async get(cacheKey: string): Promise<{ data: FundamentalResponse; stale: boolean; cacheHit: boolean } | null> {
        const memory = this.memoryCache.get(cacheKey);
        const now = Date.now();

        if (memory) {
            if (now <= memory.expiresAt) {
                return { data: memory.value, stale: false, cacheHit: true };
            }
            if (now <= memory.staleAt) {
                return { data: memory.value, stale: true, cacheHit: true };
            }
            this.memoryCache.delete(cacheKey);
        }

        let snapshot: any = null;
        try {
            snapshot = await this.prisma.fundamentalSnapshot.findUnique({
                where: { cacheKey },
            });
        } catch (error: any) {
            if (this.isMissingStorage(error)) {
                this.logger.warn('FundamentalSnapshot table unavailable. Continuing with memory cache only.');
                return null;
            }
            throw error;
        }

        if (!snapshot) return null;

        try {
            const payload = JSON.parse(snapshot.payload) as FundamentalResponse;
            const expiresAt = snapshot.expiresAt.getTime();
            const staleAt = snapshot.staleAt?.getTime() || expiresAt;
            const stale = now > expiresAt && now <= staleAt;

            if (now > staleAt) {
                return null;
            }

            this.memoryCache.set(cacheKey, {
                value: payload,
                expiresAt: Math.min(expiresAt, now + this.memoryTtlMs),
                staleAt: Math.max(staleAt, now + this.memoryTtlMs),
            });

            return {
                data: payload,
                stale,
                cacheHit: true,
            };
        } catch (error: any) {
            this.logger.warn(`Invalid cached payload for ${cacheKey}: ${error?.message || 'unknown error'}`);
            return null;
        }
    }

    async set(params: {
        cacheKey: string;
        ticker: string;
        providerRequested: FundamentalProviderId;
        providerUsed: FundamentalProviderId;
        data: FundamentalResponse;
        ttlMs: number;
        staleTtlMs: number;
    }): Promise<void> {
        const now = Date.now();
        const expiresAt = now + Math.max(1_000, params.ttlMs);
        const staleAt = expiresAt + Math.max(0, params.staleTtlMs);

        this.memoryCache.set(params.cacheKey, {
            value: params.data,
            expiresAt: Math.min(expiresAt, now + this.memoryTtlMs),
            staleAt: staleAt,
        });

        try {
            await this.prisma.fundamentalSnapshot.upsert({
                where: { cacheKey: params.cacheKey },
                create: {
                    cacheKey: params.cacheKey,
                    ticker: params.ticker,
                    providerRequested: params.providerRequested,
                    providerUsed: params.providerUsed,
                    payload: JSON.stringify(params.data),
                    expiresAt: new Date(expiresAt),
                    staleAt: new Date(staleAt),
                },
                update: {
                    providerUsed: params.providerUsed,
                    payload: JSON.stringify(params.data),
                    fetchedAt: new Date(now),
                    expiresAt: new Date(expiresAt),
                    staleAt: new Date(staleAt),
                },
            });
        } catch (error: any) {
            if (this.isMissingStorage(error)) {
                this.logger.warn('FundamentalSnapshot table unavailable. Skipping DB cache write.');
                return;
            }
            throw error;
        }
    }
}
