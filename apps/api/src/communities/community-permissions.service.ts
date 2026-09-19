import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['ACTIVE']);
const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

@Injectable()
export class CommunityPermissionsService {
    constructor(private readonly prisma: PrismaService) {}

    isPlatformAdmin(user: { role?: string } | null | undefined): boolean {
        return Boolean(user?.role && ADMIN_ROLES.has(user.role));
    }

    canCreateCommunity(user: {
        id: string;
        role?: string;
        plan?: string;
        accountType?: string;
        isCreator?: boolean;
        subscriptionStatus?: string;
    }): boolean {
        if (this.isPlatformAdmin(user)) return true;

        const hasCreatorFlag = Boolean(
            user.isCreator ||
            user.role === 'CREATOR' ||
            user.accountType === 'CREATOR' ||
            user.plan === 'CREATOR' ||
            user.plan === 'PRO_CREATOR'
        );

        const isActive = Boolean(
            user.isCreator ||
            user.role === 'CREATOR' ||
            ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus || '')
        );

        return hasCreatorFlag && isActive;
    }

    async assertCanCreateCommunity(userId: string) {
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

        if (!user) throw new NotFoundException('Usuario no encontrado.');

        if (!this.canCreateCommunity(user)) {
            throw new ForbiddenException(
                'Esta funcionalidad requiere el Plan Creator de Finix. Necesitas actualizar tu cuenta a Creator para crear comunidades.'
            );
        }

        return user;
    }

    async getMemberRole(communityId: string, userId?: string): Promise<string | null> {
        if (!userId) return null;
        const member = await this.prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId } },
            select: { role: true, subscriptionStatus: true },
        });
        if (!member || member.subscriptionStatus !== 'ACTIVE') return null;
        return member.role;
    }

    async assertCanManageCommunity(communityId: string, userId: string) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            select: { id: true, creatorId: true, name: true },
        });
        if (!community) throw new NotFoundException('Comunidad no encontrada.');

        if (community.creatorId === userId) return community;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (this.isPlatformAdmin(user)) return community;

        const memberRole = await this.getMemberRole(communityId, userId);
        if (memberRole === 'OWNER' || memberRole === 'ADMIN') {
            return community;
        }

        throw new ForbiddenException('No tienes permisos administrativos sobre esta comunidad.');
    }

    async assertCanEditCommunity(communityId: string, userId: string) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            select: { id: true, creatorId: true, name: true },
        });
        if (!community) throw new NotFoundException('Comunidad no encontrada.');

        if (community.creatorId === userId) return community;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (this.isPlatformAdmin(user)) return community;

        throw new ForbiddenException('Solo el propietario de la comunidad o un administrador general pueden modificar o eliminar la comunidad.');
    }

    async assertCanModerateCommunity(communityId: string, userId: string) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            select: { id: true, creatorId: true, name: true },
        });
        if (!community) throw new NotFoundException('Comunidad no encontrada.');

        if (community.creatorId === userId) return community;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (this.isPlatformAdmin(user)) return community;

        const memberRole = await this.getMemberRole(communityId, userId);
        if (memberRole === 'OWNER' || memberRole === 'ADMIN' || memberRole === 'MODERATOR') {
            return community;
        }

        throw new ForbiddenException('No tienes permisos de moderador en esta comunidad.');
    }

    async assertCanManagePayments(communityId: string, userId: string) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            select: { id: true, creatorId: true, name: true },
        });
        if (!community) throw new NotFoundException('Comunidad no encontrada.');

        if (community.creatorId === userId) return community;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (this.isPlatformAdmin(user)) return community;

        throw new ForbiddenException('Solo el creador de la comunidad puede gestionar precios y pagos.');
    }

    async canAccessCommunity(userId: string | undefined, communityId: string): Promise<{
        canView: boolean;
        isMember: boolean;
        role: string | null;
        tierLevel: number;
    }> {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            select: { id: true, creatorId: true, privacyType: true, status: true, showContentBeforeJoin: true },
        });

        if (!community) {
            throw new NotFoundException('Comunidad no encontrada.');
        }

        if (!userId) {
            return {
                canView: community.privacyType === 'PUBLIC' || community.showContentBeforeJoin,
                isMember: false,
                role: null,
                tierLevel: 0,
            };
        }

        if (community.creatorId === userId) {
            return { canView: true, isMember: true, role: 'OWNER', tierLevel: 999 };
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (this.isPlatformAdmin(user)) {
            return { canView: true, isMember: true, role: 'ADMIN', tierLevel: 999 };
        }

        const member = await this.prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId } },
            include: { plan: true },
        });

        const isActive = member && member.subscriptionStatus === 'ACTIVE';
        const tierLevel = isActive ? (member?.plan?.tierLevel ?? 0) : 0;

        const canView = isActive || community.privacyType === 'PUBLIC' || community.showContentBeforeJoin;

        return {
            canView,
            isMember: Boolean(isActive),
            role: isActive ? member.role : null,
            tierLevel,
        };
    }
}
