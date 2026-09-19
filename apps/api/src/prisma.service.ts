import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const normalizeDatabaseUrl = (rawUrl?: string) => {
    if (!rawUrl) {
        return rawUrl;
    }

    try {
        const url = new URL(rawUrl);
        if (url.hostname.endsWith('.pooler.supabase.com')) {
            if (!url.port || url.port === '5432') {
                url.port = '6543';
            }
            if (!url.searchParams.has('pgbouncer')) {
                url.searchParams.set('pgbouncer', 'true');
            }
            if (!url.searchParams.has('connection_limit')) {
                url.searchParams.set('connection_limit', '10');
            }
            // Timeout de conexión: falla rápido si Supabase no responde
            if (!url.searchParams.has('connect_timeout')) {
                url.searchParams.set('connect_timeout', '10');
            }
            // Timeout de pool: no esperar más de 15s para obtener una conexión libre
            if (!url.searchParams.has('pool_timeout')) {
                url.searchParams.set('pool_timeout', '15');
            }
        }
        return url.toString();
    } catch {
        return rawUrl;
    }
};

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private reconnectTimer?: NodeJS.Timeout;
    private reconnectScheduled = false;
    private shuttingDown = false;

    constructor() {
        const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

        super(
            databaseUrl
                ? {
                    datasources: {
                        db: { url: databaseUrl },
                    },
                    // Timeout global de queries: 30s máximo antes de fallar
                    // Evita que las queries cuelguen indefinidamente
                    log: process.env.NODE_ENV !== 'production' ? ['warn', 'error'] : ['error'],
                }
                : undefined,
        );
    }

    async onModuleInit() {
        // Register the middleware before the first query so every database
        // operation has the same bounded timeout.
        this.$use(async (params, next) => {
            let timeoutId: NodeJS.Timeout | undefined;
            const timeout = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new Error(`[Prisma] Query timeout: ${params.model}.${params.action} exceeded 20s`)),
                    20_000,
                );
            });

            try {
                return await Promise.race([next(params), timeout]);
            } finally {
                // Do not leave thousands of pending timers behind after fast queries.
                if (timeoutId) clearTimeout(timeoutId);
            }
        });

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
            console.error('⚠️ [Prisma] No se pudo conectar a la base de datos:', err?.message || err);
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
