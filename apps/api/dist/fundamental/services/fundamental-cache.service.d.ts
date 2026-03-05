import { PrismaService } from '../../prisma.service';
import { FundamentalResponse } from '../types/fundamental.types';
import { FundamentalProviderId } from '../types/provider.types';
export declare class FundamentalCacheService {
    private readonly prisma;
    private readonly logger;
    private readonly memoryCache;
    private readonly memoryTtlMs;
    constructor(prisma: PrismaService);
    private isMissingStorage;
    buildCacheKey(ticker: string, providerRequested: FundamentalProviderId): string;
    get(cacheKey: string): Promise<{
        data: FundamentalResponse;
        stale: boolean;
        cacheHit: boolean;
    } | null>;
    set(params: {
        cacheKey: string;
        ticker: string;
        providerRequested: FundamentalProviderId;
        providerUsed: FundamentalProviderId;
        data: FundamentalResponse;
        ttlMs: number;
        staleTtlMs: number;
    }): Promise<void>;
}
