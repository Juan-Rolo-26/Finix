import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['ACTIVE']);
const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

@Injectable()
export class CommunityPermissionsService {
    constructor(private readonly prisma: PrismaService) {}

    isPlatformAdmin(user: { role?: string } | null | undefined): boolean {
        return ADMIN_ROLES.has(String(user?.role || '').toUpperCase());
    }

    canCreateCommunity(user: {
        id: string;
        role?: string;
        plan?: string;
        accountType?: string;
        isCreator?: boolean;
        subscriptionStatus?: string;
        proAccessOverride?: boolean | null;
    }): boolean {
        if (this.isPlatformAdmin(user)) return true;
        if (user.proAccessOverride === false) return false;

        const role = String(user.role || '').toUpperCase();
        const accountType = String(user.accountType || '').toUpperCase();
        const plan = String(user.plan || '').toUpperCase();
        const hasCreatorFlag = Boolean(
            user.isCreator ||
            role === 'CREATOR' ||
            accountType === 'CREATOR' ||
            plan === 'CREATOR' ||
            plan === 'PRO_CREATOR'
        );

        const isActive = ACTIVE_SUBSCRIPTION_STATUSES.has(String(user.subscriptionStatus || '').toUpperCase());

        return hasCreatorFlag && isActive;
    }

    canViewCommunities(user: {
        role?: string;
        plan?: string;
        accountType?: string;
        isCreator?: boolean;
        subscriptionStatus?: string;
        proAccessOverride?: boolean | null;
    }): boolean {
        if (this.isPlatformAdmin(user)) return true;
        if (user.proAccessOverride === false) return false;
        if (user.proAccessOverride === true) return true;

        const isActive = ACTIVE_SUBSCRIPTION_STATUSES.has(String(user.subscriptionStatus || '').toUpperCase());
        if (!isActive) return false;

        const plan = String(user.plan || '').toUpperCase();
        const accountType = String(user.accountType || '').toUpperCase();
        return (
            plan === 'PRO' ||
            plan === 'CREATOR' ||
            plan === 'PRO_CREATOR' ||
            accountType === 'PRO' ||
            accountType === 'CREATOR' ||
            Boolean(user.isCreator)
        );
    }

    async assertCanViewCommunities(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                plan: true,
                accountType: true,
                isCreator: true,
                subscriptionStatus: true,
                proAccessOverride: true,
            },
        });

        if (!user) throw new NotFoundException('Usuario no encontrado.');

        if (!this.canViewCommunities(user)) {
            throw new ForbiddenException(
                'El acceso a Comunidades requiere una suscripción PRO activa de Finix.'
            );
        }

        return user;
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
                proAccessOverride: true,
                isVerified: true,
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
        await this.assertCanViewCommunities(userId);

        const member = await this.prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId } },
            select: { role: true, subscriptionStatus: true },
        });
        if (!member || member.subscriptionStatus !== 'ACTIVE') return null;
        return member.role;
    }

    async assertCanManageCommunity(communityId: string, userId: string) {
        await this.assertCanViewCommunities(userId);
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
        await this.assertCanViewCommunities(userId);
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
        await this.assertCanViewCommunities(userId);
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
        await this.assertCanViewCommunities(userId);
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
                canView: false,
                isMember: false,
                role: null,
                tierLevel: 0,
            };
        }

        await this.assertCanViewCommunities(userId);

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
