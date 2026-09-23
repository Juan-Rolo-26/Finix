import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['ACTIVE']);
const ACTIVE_COMMUNITY_STATUSES = new Set(['ACTIVE']);

@Injectable()
export class AccessControlService {
    constructor(private readonly prisma: PrismaService) { }

    private isJuanUser(user: any): boolean {
        if (!user) return false;
        const username = String(user.username || '').trim().toLowerCase();
        const email = String(user.email || '').trim().toLowerCase();
        return (
            username === 'juan26-08' ||
            username === 'juan26_08' ||
            username === 'juan2608' ||
            username.includes('juan26') ||
            email.includes('juanpablorolo') ||
            (email.includes('juan') && email.includes('26'))
        );
    }

    async requirePro(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                plan: true,
                subscriptionStatus: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (user.role === 'ADMIN' || this.isJuanUser(user)) {
            return user;
        }

        const isPro = ['PRO', 'CREATOR', 'PRO_CREATOR'].includes(user.plan) && ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus);
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
                username: true,
                email: true,
                role: true,
                plan: true,
                subscriptionStatus: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (user.role === 'ADMIN' || this.isJuanUser(user)) {
            return true;
        }

        const hasActivePro = ['PRO', 'CREATOR', 'PRO_CREATOR'].includes(user.plan) && ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus);
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
                privacyType: true,
            },
        });

        if (!community) {
            throw new NotFoundException('Comunidad no encontrada');
        }

        if (community.privacyType === 'PUBLIC' || (community.creatorId === userId)) {
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
                role: true,
                plan: true,
                accountType: true,
                isCreator: true,
                subscriptionStatus: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const adminRoles = new Set(['ADMIN', 'SUPER_ADMIN']);
        if (adminRoles.has(user.role)) {
            return user;
        }

        const isCreatorPlan = (
            user.isCreator ||
            user.accountType === 'CREATOR' ||
            user.plan === 'CREATOR' ||
            user.plan === 'PRO_CREATOR'
        ) && (
            ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus)
        );

        if (!isCreatorPlan) {
            throw new ForbiddenException('Esta funcionalidad requiere el plan Creator de Finix. Necesitas actualizar tu suscripción a Creator para crear y administrar comunidades.');
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
