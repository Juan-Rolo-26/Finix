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
const argon2 = require("argon2");
const prisma_service_1 = require("./prisma.service");
let DemoUserService = class DemoUserService {
    constructor(prisma) {
        this.prisma = prisma;
        this.cachedId = null;
        this.demoEmail = 'demo@finix.local';
        this.demoUsername = 'demo_user';
        this.demoPassword = 'finixdemo123';
    }
    async buildDemoPasswordHash() {
        return argon2.hash(this.demoPassword);
    }
    demoUserData(passwordHash) {
        return {
            email: this.demoEmail,
            username: this.demoUsername,
            password: passwordHash,
            role: 'USER',
            isInfluencer: false,
            isVerified: true,
            emailVerified: true,
            plan: 'FREE',
            onboardingCompleted: true,
            onboardingStep: 5,
            bio: 'Usuario demo de Finix para pruebas locales.',
            location: 'Cordoba, Argentina',
        };
    }
    async getOrCreateDemoUser() {
        if (this.cachedId) {
            const cachedUser = await this.prisma.user.findUnique({
                where: { id: this.cachedId },
            });
            if (cachedUser) {
                return cachedUser;
            }
            this.cachedId = null;
        }
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: this.demoEmail },
                    { username: this.demoUsername },
                ],
            },
        });
        const passwordHash = await this.buildDemoPasswordHash();
        const demoData = this.demoUserData(passwordHash);
        if (existing?.id) {
            const updated = await this.prisma.user.update({
                where: { id: existing.id },
                data: {
                    ...demoData,
                    username: existing.username === this.demoUsername ? this.demoUsername : existing.username,
                },
            });
            this.cachedId = updated.id;
            return updated;
        }
        try {
            const created = await this.prisma.user.create({
                data: demoData,
            });
            this.cachedId = created.id;
            return created;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const fallbackUsername = `demo_${Math.random().toString(36).slice(2, 8)}`;
                const created = await this.prisma.user.create({
                    data: {
                        ...demoData,
                        username: fallbackUsername,
                    },
                });
                this.cachedId = created.id;
                return created;
            }
            throw error;
        }
    }
    getDemoCredentials() {
        return {
            email: this.demoEmail,
            username: this.demoUsername,
            password: this.demoPassword,
        };
    }
};
exports.DemoUserService = DemoUserService;
exports.DemoUserService = DemoUserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DemoUserService);
//# sourceMappingURL=demo-user.service.js.map