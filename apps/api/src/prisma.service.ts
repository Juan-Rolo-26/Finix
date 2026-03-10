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
                url.searchParams.set('connection_limit', '1');
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
                }
                : undefined,
        );
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
