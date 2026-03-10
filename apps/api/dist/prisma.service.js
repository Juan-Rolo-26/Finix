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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const normalizeDatabaseUrl = (rawUrl) => {
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
    }
    catch {
        return rawUrl;
    }
};
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor() {
        const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
        super(databaseUrl
            ? {
                datasources: {
                    db: { url: databaseUrl },
                },
            }
            : undefined);
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map