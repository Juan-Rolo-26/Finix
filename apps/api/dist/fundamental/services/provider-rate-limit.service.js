"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRateLimitService = void 0;
const common_1 = require("@nestjs/common");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let ProviderRateLimitService = class ProviderRateLimitService {
    constructor() {
        this.limits = new Map([
            ['fmp', { maxRequests: 240, windowMs: 60_000 }],
            ['finnhub', { maxRequests: 55, windowMs: 60_000 }],
            ['alphavantage', { maxRequests: 5, windowMs: 60_000 }],
            ['investing', { maxRequests: 25, windowMs: 60_000 }],
            ['polygon', { maxRequests: 200, windowMs: 60_000 }],
        ]);
        this.states = new Map();
        this.queues = new Map();
    }
    async waitForSlot(provider) {
        const limit = this.limits.get(provider);
        if (!limit)
            return;
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
    async schedule(provider, task) {
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
};
exports.ProviderRateLimitService = ProviderRateLimitService;
exports.ProviderRateLimitService = ProviderRateLimitService = __decorate([
    (0, common_1.Injectable)()
], ProviderRateLimitService);
//# sourceMappingURL=provider-rate-limit.service.js.map