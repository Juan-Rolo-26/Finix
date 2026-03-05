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
exports.AccessControlService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['ACTIVE']);
const ACTIVE_COMMUNITY_STATUSES = new Set(['ACTIVE']);
let AccessControlService = class AccessControlService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async requirePro(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                plan: true,
                subscriptionStatus: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (user.role === 'ADMIN') {
            return user;
        }
        const isPro = user.plan === 'PRO' && ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus);
        if (!isPro) {
            throw new common_1.ForbiddenException('Esta funcionalidad requiere un plan PRO activo.');
        }
        return user;
    }
    async limitFreePortfolio(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                plan: true,
                subscriptionStatus: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (user.role === 'ADMIN') {
            return true;
        }
        const hasActivePro = user.plan === 'PRO' && ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus);
        if (hasActivePro) {
            return true;
        }
        const portfoliosCount = await this.prisma.portfolio.count({
            where: { userId },
        });
        if (portfoliosCount >= 1) {
            throw new common_1.ForbiddenException('El plan gratis permite solo 1 portafolio. Actualiza a PRO para crear más.');
        }
        return true;
    }
    async requirePaidCommunityAccess(userId, communityId) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            select: {
                id: true,
                creatorId: true,
                isPaid: true,
            },
        });
        if (!community) {
            throw new common_1.NotFoundException('Comunidad no encontrada');
        }
        if (!community.isPaid || community.creatorId === userId) {
            return true;
        }
        const membership = await this.prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId,
                    userId,
                },
            },
            select: {
                subscriptionStatus: true,
                expiresAt: true,
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Debes tener una membresía paga activa para acceder.');
        }
        const notExpired = !membership.expiresAt || membership.expiresAt.getTime() > Date.now();
        const active = ACTIVE_COMMUNITY_STATUSES.has(membership.subscriptionStatus) && notExpired;
        if (!active) {
            throw new common_1.ForbiddenException('Tu acceso a esta comunidad paga no está activo.');
        }
        return true;
    }
    async requireCreator(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                isCreator: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (!user.isCreator) {
            throw new common_1.ForbiddenException('Debes ser un Creador verificado para realizar esta acción.');
        }
        return user;
    }
    async requirePlan(userId, allowedPlans) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                plan: true,
                subscriptionStatus: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (user.role === 'ADMIN') {
            return user;
        }
        const isPlanAllowed = allowedPlans.includes(user.plan);
        const isActive = user.plan === 'FREE' || ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus);
        if (!isPlanAllowed || !isActive) {
            throw new common_1.ForbiddenException(`Esta funcionalidad requiere uno de los siguientes planes: ${allowedPlans.join(', ')} y una suscripción activa.`);
        }
        return user;
    }
};
exports.AccessControlService = AccessControlService;
exports.AccessControlService = AccessControlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccessControlService);
//# sourceMappingURL=access-control.service.js.map