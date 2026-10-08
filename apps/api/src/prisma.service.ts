import { Injectable, Optional, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ReadCacheService } from './cache/read-cache.service';
import { Prisma, PrismaClient } from '@prisma/client';
import { normalizeDatabaseUrl } from './common/database-url';
import { requestMetrics } from './common/request-metrics';

const relationFields = new Map(Prisma.dmmf.datamodel.models.map(model => [
    model.name, new Set(model.fields.filter(field => field.kind === 'object').map(field => field.name)),
]));

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private reconnectTimer?: NodeJS.Timeout;
    private reconnectScheduled = false;
    private shuttingDown = false;

    constructor(@Optional() private readonly cache?: ReadCacheService) {
        const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

        super(
            databaseUrl
                ? {
                    datasources: {
                        db: { url: databaseUrl },
                    },
                    // Timeout global de queries: 30s máximo antes de fallar
                    // Evita que las queries cuelguen indefinidamente
                    // Query errors can contain financial descriptions and amounts.
                    // Do not print Prisma's argument formatter to application logs.
                    log: [],
                }
                : undefined,
        );

        // Enabling relationJoins changes Prisma's default. Preserve the existing
        // strategy everywhere; only explicitly profiled reads opt into SQL joins.
        this.$use(async (params, next) => {
            const loadsRelations = params.args?.include || Object.keys(params.args?.select || {})
                .some(key => relationFields.get(params.model)?.has(key));
            if (loadsRelations && ['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany'].includes(params.action)) {
                params.args = { relationLoadStrategy: 'query', ...params.args };
            }
            return next(params);
        });
        const publicCacheModels = new Set(['User', 'Portfolio', 'Holding', 'Transaction', 'CashAccount', 'Post', 'PostLike', 'Community', 'AssetAnalysis']);
        this.$use(async (params, next) => {
            const started = performance.now();
            let result: any;
            try { result = await next(params); }
            finally {
                const elapsedMs = performance.now() - started;
                const metrics = requestMetrics.getStore();
                if (metrics) { metrics.dbOperations++; metrics.dbMs += elapsedMs; }
                if (elapsedMs >= 500) console.log(JSON.stringify({ event: 'database_slow_operation', model: params.model || 'raw', action: params.action, elapsedMs: Number(elapsedMs.toFixed(2)), requestId: metrics?.id }));
            }
            if (cache && publicCacheModels.has(params.model) && /^(create|update|upsert|delete)/.test(params.action)) {
                const transaction = cache.transaction.getStore();
                if (transaction) transaction.mutated = true;
                else await cache.invalidate();
            }
            return result;
        });
        if (cache) {
            const transaction = this.$transaction.bind(this);
            Object.defineProperty(this, '$transaction', { value: async (...args: any[]) => {
                const context = { mutated: false };
                const result = await cache.transaction.run(context, () => (transaction as any)(...args));
                // Invalidate after successful COMMIT, never after a rollback.
                if (context.mutated) await cache.invalidate();
                return result;
            } });
        }
    }

    async onModuleInit() {
        // PostgreSQL's role-level statement_timeout cancels the actual query.
        // Promise.race cannot cancel writes and can report failure after a commit.
        await this.connectToDatabase();
    }

    /**
     * Used by readiness checks. A failed probe schedules a single reconnect in
     * the background, so a short Supabase outage does not require a manual API
     * restart to recover.
     */
    async isDatabaseReady(): Promise<boolean> {
        try {
            await this.$queryRawUnsafe('SELECT 1');
            return true;
        } catch (err: any) {
            this.scheduleReconnect();
            return false;
        }
    }

    private async connectToDatabase(): Promise<void> {
        try {
            await this.$connect();
            console.log('✅ [Prisma] Conectado a la base de datos');
        } catch (err: any) {
            console.error(JSON.stringify({ event: 'database_connect_failed', code: err?.code || 'unavailable' }));
            console.error('⚠️ La API seguirá viva, pero no estará lista hasta recuperar DATABASE_URL.');
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (this.shuttingDown || this.reconnectScheduled) return;

        this.reconnectScheduled = true;
        this.reconnectTimer = setTimeout(async () => {
            this.reconnectScheduled = false;
            await this.connectToDatabase();
        }, 5_000);
        this.reconnectTimer.unref?.();
    }

    async onModuleDestroy() {
        this.shuttingDown = true;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        await this.$disconnect();
    }

    get marketCalendarEvent(): any {
        return (this as any).marketCalendarEvent;
    }

    get marketEarningsEvent(): any {
        return (this as any).marketEarningsEvent;
    }

    get calendarSyncLog(): any {
        return (this as any).calendarSyncLog;
    }
}
