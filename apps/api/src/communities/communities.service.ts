import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccessControlService } from '../access/access-control.service';
import { StripeService } from '../stripe/stripe.service';
import {
    CreateCommunityDto,
    CreateCommunityPostDto,
    CreateCommunityResourceDto,
    UpdateCommunityDto,
} from './dto/create-community.dto';

const ACTIVE_MEMBER_STATUSES = new Set(['ACTIVE']);
const SUCCESSFUL_PAYMENT_STATUSES = new Set(['SUCCEEDED', 'PAID', 'ACTIVE']);

@Injectable()
export class CommunitiesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly accessControlService: AccessControlService,
        private readonly stripeService: StripeService,
    ) { }

    async create(userId: string, dto: CreateCommunityDto) {
        await this.accessControlService.requireCreator(userId);

        if (dto.isPaid && (!dto.price || dto.price <= 0)) {
            throw new BadRequestException('Las comunidades pagas requieren un precio mayor a 0.');
        }

        return this.prisma.community.create({
            data: {
                creatorId: userId,
                name: dto.name,
                description: dto.description,
                category: dto.category,
                isPaid: dto.isPaid,
                price: dto.isPaid ? dto.price || 0 : 0,
                billingType: dto.billingType || 'monthly',
                imageUrl: dto.imageUrl,
                bannerUrl: dto.bannerUrl,
                maxMembers: dto.maxMembers ?? null,
            },
            include: {
                _count: {
                    select: {
                        members: true,
                        posts: true,
                        resources: true,
                        payments: true,
                    },
                },
            },
        });
    }

    async findAll(query: any) {
        const { category, isPaid, minPrice, maxPrice, sort, billingType, search } = query;
        const where: any = {};

        if (category) where.category = category;
        if (isPaid !== undefined) where.isPaid = isPaid === 'true';
        if (billingType) where.billingType = billingType;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = Number(minPrice);
            if (maxPrice) where.price.lte = Number(maxPrice);
        }

        let orderBy: any = { createdAt: 'desc' };
        if (sort === 'oldest') orderBy = { createdAt: 'asc' };
        if (sort === 'price_asc') orderBy = { price: 'asc' };
        if (sort === 'price_desc') orderBy = { price: 'desc' };
        if (sort === 'popular') orderBy = { members: { _count: 'desc' } };

        return this.prisma.community.findMany({
            where,
            orderBy,
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        isVerified: true,
                    },
                },
                _count: {
                    select: {
                        members: true,
                        posts: true,
                        resources: true,
                    },
                },
            },
        });
    }

    async findOne(id: string, userId?: string) {
        const community = await this.prisma.community.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        isVerified: true,
                        plan: true,
                    },
                },
                _count: {
                    select: {
                        members: true,
                        posts: true,
                        resources: true,
                    },
                },
            },
        });

        if (!community) {
            throw new NotFoundException('Comunidad no encontrada');
        }

        if (!userId) {
            return {
                ...community,
                isMember: false,
                hasPaidAccess: !community.isPaid,
                membership: null,
                requiresUpgrade: community.isPaid,
            };
        }

        const membership = await this.prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId: id,
                    userId,
                },
            },
        });

        const isMembershipActive = this.isMembershipActive(membership);
        const hasPaidAccess = !community.isPaid || community.creatorId === userId || isMembershipActive;

        return {
            ...community,
            isMember: isMembershipActive,
            hasPaidAccess,
            membership,
            requiresUpgrade: community.isPaid && !hasPaidAccess,
        };
    }

    async joinFree(userId: string, communityId: string) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            select: {
                id: true,
                isPaid: true,
                maxMembers: true,
            },
        });

        if (!community) {
            throw new NotFoundException('Comunidad no encontrada');
        }

        if (community.isPaid) {
            throw new ForbiddenException('Esta comunidad es paga. Debes suscribirte para acceder.');
        }

        if (community.maxMembers) {
            const activeMembers = await this.prisma.communityMember.count({
                where: {
                    communityId,
                    subscriptionStatus: 'ACTIVE',
                },
            });
            if (activeMembers >= community.maxMembers) {
                throw new BadRequestException('La comunidad alcanzó su límite de miembros.');
            }
        }

        const existing = await this.prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId,
                    userId,
                },
            },
        });

        if (existing && this.isMembershipActive(existing)) {
            throw new BadRequestException('Ya eres miembro de esta comunidad.');
        }

        if (existing) {
            return this.prisma.communityMember.update({
                where: { id: existing.id },
                data: {
                    subscriptionStatus: 'ACTIVE',
                    paymentStatus: 'SUCCEEDED',
                    joinedAt: new Date(),
                    expiresAt: null,
                },
            });
        }

        return this.prisma.communityMember.create({
            data: {
                communityId,
                userId,
                role: 'MEMBER',
                subscriptionStatus: 'ACTIVE',
                paymentStatus: 'SUCCEEDED',
            },
        });
    }

    async createSubscriptionSession(userId: string, communityId: string) {
        return this.stripeService.createCommunityPayment(userId, communityId);
    }

    async getMyCommunities(userId: string) {
        await this.accessControlService.requireCreator(userId);

        return this.prisma.community.findMany({
            where: { creatorId: userId },
            include: {
                _count: {
                    select: {
                        members: true,
                        posts: true,
                        resources: true,
                        payments: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getCreatorStats(userId: string) {
        await this.accessControlService.requireCreator(userId);

        const communities = await this.prisma.community.findMany({
            where: { creatorId: userId },
            select: {
                id: true,
                name: true,
            },
        });

        const communityIds = communities.map((community) => community.id);
        if (communityIds.length === 0) {
            return {
                activeMembers: 0,
                monthlyIncome: 0,
                totalIncome: 0,
                growthPercent: 0,
                churnRate: 0,
                communities: [],
            };
        }

        const now = new Date();
        const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [memberships, payments, churnedMembers] = await Promise.all([
            this.prisma.communityMember.findMany({
                where: {
                    communityId: { in: communityIds },
                    subscriptionStatus: 'ACTIVE',
                },
                select: {
                    communityId: true,
                },
            }),
            this.prisma.communityPayment.findMany({
                where: {
                    communityId: { in: communityIds },
                    createdAt: { gte: startPreviousMonth },
                    status: 'SUCCEEDED',
                },
                select: {
                    communityId: true,
                    creatorAmount: true,
                    createdAt: true,
                },
            }),
            this.prisma.communityMember.count({
                where: {
                    communityId: { in: communityIds },
                    subscriptionStatus: { in: ['CANCELED', 'EXPIRED'] },
                    joinedAt: { gte: startCurrentMonth },
                },
            }),
        ]);

        const activeMembers = memberships.length;
        let monthlyIncome = 0;
        let previousMonthIncome = 0;
        let totalIncome = 0;

        const perCommunity = new Map<string, number>();
        for (const payment of payments) {
            const amount = Number(payment.creatorAmount);
            totalIncome += amount;
            perCommunity.set(payment.communityId, (perCommunity.get(payment.communityId) || 0) + amount);
            if (payment.createdAt >= startCurrentMonth) {
                monthlyIncome += amount;
            } else {
                previousMonthIncome += amount;
            }
        }

        const growthPercent = previousMonthIncome > 0
            ? ((monthlyIncome - previousMonthIncome) / previousMonthIncome) * 100
            : (monthlyIncome > 0 ? 100 : 0);

        const activePlusChurned = activeMembers + churnedMembers;
        const churnRate = activePlusChurned > 0
            ? (churnedMembers / activePlusChurned) * 100
            : 0;

        const communitiesStats = communities.map((community) => ({
            communityId: community.id,
            communityName: community.name,
            income: this.round(perCommunity.get(community.id) || 0),
            members: memberships.filter((membership) => membership.communityId === community.id).length,
        }));

        return {
            activeMembers,
            monthlyIncome: this.round(monthlyIncome),
            totalIncome: this.round(totalIncome),
            growthPercent: this.round(growthPercent),
            churnRate: this.round(churnRate),
            communities: communitiesStats,
        };
    }

    async getCommunityMembers(userId: string, communityId: string) {
        await this.assertCreatorOwnership(userId, communityId);

        return this.prisma.communityMember.findMany({
            where: { communityId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        avatarUrl: true,
                        plan: true,
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });
    }

    async updatePricing(userId: string, communityId: string, dto: UpdateCommunityDto) {
        await this.assertCreatorOwnership(userId, communityId);

        if (dto.isPaid && (dto.price === undefined || dto.price <= 0)) {
            throw new BadRequestException('Las comunidades pagas requieren un precio mayor a 0.');
        }

        return this.prisma.community.update({
            where: { id: communityId },
            data: {
                isPaid: dto.isPaid,
                price: dto.isPaid ? (dto.price || 0) : 0,
                billingType: dto.billingType,
                maxMembers: dto.maxMembers,
                name: dto.name,
                description: dto.description,
                category: dto.category,
                imageUrl: dto.imageUrl,
            },
        });
    }

    async removeMember(userId: string, communityId: string, memberUserId: string) {
        await this.assertCreatorOwnership(userId, communityId);

        const member = await this.prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId,
                    userId: memberUserId,
                },
            },
        });

        if (!member) {
            throw new NotFoundException('Miembro no encontrado');
        }

        await this.prisma.communityMember.update({
            where: { id: member.id },
            data: {
                subscriptionStatus: 'CANCELED',
                paymentStatus: 'CANCELED',
                expiresAt: new Date(),
            },
        });

        return { ok: true };
    }

    async listPosts(communityId: string, userId?: string) {
        const { hasPaidAccess } = await this.resolveCommunityAccess(communityId, userId);

        return this.prisma.communityPost.findMany({
            where: {
                communityId,
                ...(hasPaidAccess ? {} : { isPublic: true }),
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }

    async createPost(userId: string, communityId: string, dto: CreateCommunityPostDto) {
        await this.assertCreatorOwnership(userId, communityId);

        return this.prisma.communityPost.create({
            data: {
                communityId,
                authorId: userId,
                content: dto.content,
                mediaUrl: dto.mediaUrl,
                isPublic: Boolean(dto.isPublic),
            },
        });
    }

    async listResources(communityId: string, userId?: string) {
        const { hasPaidAccess } = await this.resolveCommunityAccess(communityId, userId);

        return this.prisma.communityResource.findMany({
            where: {
                communityId,
                ...(hasPaidAccess ? {} : { isPublic: true }),
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }

    async createResource(userId: string, communityId: string, dto: CreateCommunityResourceDto) {
        await this.assertCreatorOwnership(userId, communityId);

        return this.prisma.communityResource.create({
            data: {
                communityId,
                authorId: userId,
                title: dto.title,
                description: dto.description,
                resourceUrl: dto.resourceUrl,
                isPublic: Boolean(dto.isPublic),
            },
        });
    }

    async getCommunityStats(communityId: string, userId?: string) {
        const { community, hasPaidAccess } = await this.resolveCommunityAccess(communityId, userId);

        const [membersCount, activeMembersCount, paymentsCount, monthlyRevenue] = await Promise.all([
            this.prisma.communityMember.count({ where: { communityId } }),
            this.prisma.communityMember.count({ where: { communityId, subscriptionStatus: 'ACTIVE' } }),
            this.prisma.communityPayment.count({ where: { communityId, status: 'SUCCEEDED' } }),
            this.prisma.communityPayment.aggregate({
                where: {
                    communityId,
                    status: 'SUCCEEDED',
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
                _sum: { amount: true },
            }),
        ]);

        return {
            communityId: community.id,
            isPaid: community.isPaid,
            hasPaidAccess,
            membersCount,
            activeMembersCount,
            paymentsCount,
            monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
        };
    }

    private async assertCreatorOwnership(userId: string, communityId: string) {
        await this.accessControlService.requireCreator(userId);

        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            select: { id: true, creatorId: true },
        });

        if (!community) {
            throw new NotFoundException('Comunidad no encontrada');
        }

        if (community.creatorId !== userId) {
            throw new ForbiddenException('No tienes permisos sobre esta comunidad.');
        }

        return community;
    }

    private async resolveCommunityAccess(communityId: string, userId?: string) {
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

        if (!community.isPaid) {
            return { community, hasPaidAccess: true };
        }

        if (!userId) {
            return { community, hasPaidAccess: false };
        }

        if (community.creatorId === userId) {
            return { community, hasPaidAccess: true };
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
                paymentStatus: true,
                expiresAt: true,
            },
        });

        return {
            community,
            hasPaidAccess: this.isMembershipActive(membership),
        };
    }

    private isMembershipActive(membership: {
        subscriptionStatus?: string | null;
        paymentStatus?: string | null;
        expiresAt?: Date | null;
    } | null) {
        if (!membership) {
            return false;
        }

        const subscriptionStatus = String(membership.subscriptionStatus || '').toUpperCase();
        const paymentStatus = String(membership.paymentStatus || 'SUCCEEDED').toUpperCase();
        const notExpired = !membership.expiresAt || membership.expiresAt.getTime() > Date.now();

        return ACTIVE_MEMBER_STATUSES.has(subscriptionStatus)
            && SUCCESSFUL_PAYMENT_STATUSES.has(paymentStatus)
            && notExpired;
    }

    private round(value: number) {
        return Math.round(value * 100) / 100;
    }
}
