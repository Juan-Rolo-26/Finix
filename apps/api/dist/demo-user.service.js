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
exports.DemoUserService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("./prisma.service");
let DemoUserService = class DemoUserService {
    constructor(prisma) {
        this.prisma = prisma;
        this.cachedId = null;
    }
    async getOrCreateDemoUserId() {
        if (this.cachedId) {
            return this.cachedId;
        }
        const email = 'demo@finix.local';
        const username = 'demo_user';
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username },
                ],
            },
            select: { id: true },
        });
        if (existing?.id) {
            this.cachedId = existing.id;
            return existing.id;
        }
        try {
            const created = await this.prisma.user.create({
                data: {
                    email,
                    username,
                    password: 'demo',
                    role: 'USER',
                    isInfluencer: false,
                },
                select: { id: true },
            });
            this.cachedId = created.id;
            return created.id;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const fallbackUsername = `demo_${Math.random().toString(36).slice(2, 8)}`;
                const created = await this.prisma.user.create({
                    data: {
                        email,
                        username: fallbackUsername,
                        password: 'demo',
                        role: 'USER',
                        isInfluencer: false,
                    },
                    select: { id: true },
                });
                this.cachedId = created.id;
                return created.id;
            }
            throw error;
        }
    }
};
exports.DemoUserService = DemoUserService;
exports.DemoUserService = DemoUserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DemoUserService);
//# sourceMappingURL=demo-user.service.js.map