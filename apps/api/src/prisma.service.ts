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
        await this.$connect();

        // Setea statement_timeout = 20s por sesión.
        // Si una query tarda más de 20s, PostgreSQL la cancela automáticamente
        // y Prisma lanza un error controlado en lugar de colgar indefinidamente.
        this.$use(async (params, next) => {
            const timeout = new Promise<never>((_, reject) =>
                setTimeout(
                    () => reject(new Error(`[Prisma] Query timeout: ${params.model}.${params.action} exceeded 20s`)),
                    20_000,
                ),
            );
            return Promise.race([next(params), timeout]);
        });
    }

    async onModuleDestroy() {
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
