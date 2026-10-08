import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';
import { AsyncLocalStorage } from 'node:async_hooks';

@Injectable()
export class ReadCacheService implements OnModuleInit, OnModuleDestroy {
    private client?: ReturnType<typeof createClient>;
    private generation = 0;
    private entries = new Map<string, { expires: number; value: any }>();
    private pending = new Map<string, Promise<any>>();
    readonly transaction = new AsyncLocalStorage<{ mutated: boolean }>();
    private readonly prefix = process.env.FINIX_CACHE_PREFIX || 'finix:v1';

    async onModuleInit() {
        if (!process.env.REDIS_URL) return;
        const url = new URL(process.env.REDIS_URL);
        if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Redis must use loopback');
        this.client = createClient({ url: url.toString(), disableOfflineQueue: true, commandsQueueMaxLength: 128, commandOptions: { timeout: 500 }, socket: { connectTimeout: 1000, reconnectStrategy: retries => Math.min(250 + retries * 100, 3000) } });
        this.client.on('error', () => { /* No connection strings in logs. Read-through fallback remains available. */ });
        void this.client.connect().catch(() => undefined);
    }

    private async version(): Promise<string> {
        if (this.client?.isReady) {
            try { return String(await this.client.get(`${this.prefix}:generation`) || '0'); } catch { /* fallback */ }
        }
        return `local-${this.generation}`;
    }

    async remember<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
        // Never share uncommitted results with another request.
        if (this.transaction.getStore()) return loader();
        const version = await this.version();
        const cacheKey = `${this.prefix}:${version}:${key}`;
        const local = this.entries.get(cacheKey);
        if (local && local.expires > Date.now()) return local.value;
        const running = this.pending.get(cacheKey);
        if (running) return running;
        const task = (async () => {
            if (this.client?.isReady) {
                try { const value = await this.client.get(cacheKey); if (value !== null) return JSON.parse(String(value)) as T; } catch { /* fallback */ }
            }
            const value = await loader();
            if (version === await this.version()) {
                if (this.entries.size >= 200) this.entries.delete(this.entries.keys().next().value);
                this.entries.set(cacheKey, { value, expires: Date.now() + ttlMs });
                if (this.client?.isReady) try { await this.client.set(cacheKey, JSON.stringify(value), { PX: ttlMs }); } catch { /* bounded local cache */ }
            }
            return value;
        })();
        this.pending.set(cacheKey, task);
        try { return await task; } finally { this.pending.delete(cacheKey); }
    }

    async invalidate() {
        this.generation++; this.entries.clear();
        if (this.client?.isReady) try { await this.client.incr(`${this.prefix}:generation`); } catch { /* TTL bounds other clients */ }
    }

    async isReady(): Promise<boolean> {
        if (!process.env.REDIS_URL) return true;
        if (!this.client?.isReady) return false;
        try { return await this.client.ping() === 'PONG'; } catch { return false; }
    }

    async onModuleDestroy() { if (this.client?.isOpen) this.client.destroy(); }
}
