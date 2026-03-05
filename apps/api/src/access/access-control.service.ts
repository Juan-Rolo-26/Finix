import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['ACTIVE']);
const ACTIVE_COMMUNITY_STATUSES = new Set(['ACTIVE']);

@Injectable()
export class AccessControlService {
    constructor(private readonly prisma: PrismaService) { }

    async requirePro(userId: string) {
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
            throw new NotFoundException('Usuario no encontrado');
        }

        if (user.role === 'ADMIN') {
            return user;
        }

        const isPro = user.plan === 'PRO' && ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus);
        if (!isPro) {
            throw new ForbiddenException('Esta funcionalidad requiere un plan PRO activo.');
        }

        return user;
    }

    async limitFreePortfolio(userId: string) {
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
            throw new NotFoundException('Usuario no encontrado');
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
            throw new ForbiddenException('El plan gratis permite solo 1 portafolio. Actualiza a PRO para crear más.');
        }

        return true;
    }

    async requirePaidCommunityAccess(userId: string, communityId: string) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            select: {
                id: true,
                creatorId: true,
                isPaid: true,
            },
        });

        if (!community) {
            throw new NotFoundException('Comunidad no encontrada');
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
            throw new ForbiddenException('Debes tener una membresía paga activa para acceder.');
        }

        const notExpired = !membership.expiresAt || membership.expiresAt.getTime() > Date.now();
        const active = ACTIVE_COMMUNITY_STATUSES.has(membership.subscriptionStatus) && notExpired;
        if (!active) {
            throw new ForbiddenException('Tu acceso a esta comunidad paga no está activo.');
        }

        return true;
    }

    async requireCreator(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                isCreator: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (!user.isCreator) {
            throw new ForbiddenException('Debes ser un Creador verificado para realizar esta acción.');
        }

        return user;
    }

    async requirePlan(userId: string, allowedPlans: string[]) {
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
            throw new NotFoundException('Usuario no encontrado');
        }

        if (user.role === 'ADMIN') {
            return user;
        }

        const isPlanAllowed = allowedPlans.includes(user.plan);
        const isActive = user.plan === 'FREE' || ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus);

        if (!isPlanAllowed || !isActive) {
            throw new ForbiddenException(`Esta funcionalidad requiere uno de los siguientes planes: ${allowedPlans.join(', ')} y una suscripción activa.`);
        }

        return user;
    }
}

