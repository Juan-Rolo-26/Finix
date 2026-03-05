"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FundamentalCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundamentalCacheService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
let FundamentalCacheService = FundamentalCacheService_1 = class FundamentalCacheService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(FundamentalCacheService_1.name);
        this.memoryCache = new Map();
        this.memoryTtlMs = 90_000;
    }
    isMissingStorage(error) {
        const code = typeof error?.code === 'string' ? error.code : '';
        const message = String(error?.message || '').toLowerCase();
        return code === 'P2021' || message.includes('no such table') || message.includes('does not exist');
    }
    buildCacheKey(ticker, providerRequested) {
        return `${providerRequested}:${ticker.toUpperCase()}`;
    }
    async get(cacheKey) {
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
        let snapshot = null;
        try {
            snapshot = await this.prisma.fundamentalSnapshot.findUnique({
                where: { cacheKey },
            });
        }
        catch (error) {
            if (this.isMissingStorage(error)) {
                this.logger.warn('FundamentalSnapshot table unavailable. Continuing with memory cache only.');
                return null;
            }
            throw error;
        }
        if (!snapshot)
            return null;
        try {
            const payload = JSON.parse(snapshot.payload);
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
        }
        catch (error) {
            this.logger.warn(`Invalid cached payload for ${cacheKey}: ${error?.message || 'unknown error'}`);
            return null;
        }
    }
    async set(params) {
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
        }
        catch (error) {
            if (this.isMissingStorage(error)) {
                this.logger.warn('FundamentalSnapshot table unavailable. Skipping DB cache write.');
                return;
            }
            throw error;
        }
    }
};
exports.FundamentalCacheService = FundamentalCacheService;
exports.FundamentalCacheService = FundamentalCacheService = FundamentalCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FundamentalCacheService);
//# sourceMappingURL=fundamental-cache.service.js.map