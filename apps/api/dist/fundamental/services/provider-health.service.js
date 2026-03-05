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
var ProviderHealthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderHealthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
let ProviderHealthService = ProviderHealthService_1 = class ProviderHealthService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ProviderHealthService_1.name);
        this.states = new Map();
    }
    isMissingStorage(error) {
        const code = typeof error?.code === 'string' ? error.code : '';
        const message = String(error?.message || '').toLowerCase();
        return code === 'P2021' || message.includes('no such table') || message.includes('does not exist');
    }
    getState(provider) {
        return this.states.get(provider) || { failCount: 0, consecutive429: 0 };
    }
    async isOpen(provider) {
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
    async recordSuccess(provider) {
        const state = {
            failCount: 0,
            consecutive429: 0,
            cooldownUntil: undefined,
            lastError: undefined,
        };
        this.states.set(provider, state);
        await this.persist(provider, state, 'healthy');
    }
    async recordFailure(params) {
        const state = this.getState(params.provider);
        state.failCount += 1;
        state.lastError = params.message.slice(0, 250);
        if (params.statusCode === 429) {
            state.consecutive429 += 1;
        }
        else {
            state.consecutive429 = 0;
        }
        const cooldownMs = params.statusCode === 429
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
    async persist(provider, state, status) {
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
        }
        catch (error) {
            if (this.isMissingStorage(error)) {
                this.logger.warn('ProviderHealth table unavailable. Keeping health state in memory only.');
                return;
            }
            throw error;
        }
    }
};
exports.ProviderHealthService = ProviderHealthService;
exports.ProviderHealthService = ProviderHealthService = ProviderHealthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProviderHealthService);
//# sourceMappingURL=provider-health.service.js.map