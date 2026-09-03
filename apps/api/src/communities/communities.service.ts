import {
    BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

const ACTIVE_MEMBER_STATUSES = new Set(['ACTIVE']);

@Injectable()
export class CommunitiesService {
    constructor(private readonly prisma: PrismaService) { }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private isMembershipActive(membership: any): boolean {
        if (!membership) return false;
        const sub = String(membership.subscriptionStatus || '').toUpperCase();
        return ACTIVE_MEMBER_STATUSES.has(sub);
    }

    private async assertOwnerOrAdmin(communityId: string, userId: string) {
        const community = await this.prisma.community.findUnique({ where: { id: communityId } });
        if (!community) throw new NotFoundException('Comunidad no encontrada');
        if (community.creatorId !== userId) {
            // Also allow platform admins
            const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
            const adminRoles = new Set(['ADMIN', 'SUPER_ADMIN']);
            if (!user || !adminRoles.has(user.role)) {
                throw new ForbiddenException('No tenés permisos para realizar esta acción.');
            }
        }
        return community;
    }

    private communityInclude(userId?: string) {
        return {
            creator: {
                select: {
                    id: true, username: true, avatarUrl: true, isVerified: true,
                    bio: true, title: true, isInfluencer: true,
                },
            },
            plans: { orderBy: { tierLevel: 'asc' as const } },
            _count: {
                select: { members: true, posts: true, resources: true, events: true },
            },
        };
    }

    private async enrichWithMembership(community: any, userId?: string) {
        if (!userId) {
            return { ...community, isMember: false, membership: null, tierLevel: 0 };
        }
        if (community.creatorId === userId) {
            return {
                ...community, isMember: true,
                membership: { role: 'OWNER' }, tierLevel: 999,
            };
        }
        const membership = await this.prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId: community.id, userId } },
            include: { plan: true },
        });
        const active = this.isMembershipActive(membership);
        return {
            ...community,
            isMember: active,
            membership,
            tierLevel: active ? (membership?.plan?.tierLevel ?? 0) : 0,
        };
    }

    // ─── Discovery ────────────────────────────────────────────────────────────

    async findAll(query: any, userId?: string) {
        const { category, search, sort = 'members', limit = 20, offset = 0 } = query;
        const where: any = {};

        if (category && category !== 'all') where.category = category;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        let orderBy: any = {};
        if (sort === 'members') orderBy = { members: { _count: 'desc' } };
        else if (sort === 'recent') orderBy = { createdAt: 'desc' };
        else if (sort === 'posts') orderBy = { posts: { _count: 'desc' } };

        const communities = await this.prisma.community.findMany({
            where,
            orderBy,
            take: Number(limit),
            skip: Number(offset),
            include: this.communityInclude(userId),
        });

        const enriched = await Promise.all(
            communities.map(c => this.enrichWithMembership(c, userId))
        );
        return enriched;
    }

    async findOne(id: string, userId?: string) {
        const community = await this.prisma.community.findUnique({
            where: { id },
            include: this.communityInclude(userId),
        });
        if (!community) throw new NotFoundException('Comunidad no encontrada');
        return this.enrichWithMembership(community, userId);
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    async create(userId: string, dto: any) {
        // Any authenticated user can create communities (removed creator restriction)
        const community = await this.prisma.community.create({
            data: {
                creatorId: userId,
                name: dto.name,
                description: dto.description,
                category: dto.category,
                privacyType: dto.privacyType || 'PUBLIC',
                rules: dto.rules || '',
                imageUrl: dto.imageUrl,
                bannerUrl: dto.bannerUrl,
                maxMembers: dto.maxMembers ?? null,
            },
        });

        // Create plans
        if (dto.plans && Array.isArray(dto.plans) && dto.plans.length > 0) {
            for (const plan of dto.plans) {
                await this.prisma.communityPlan.create({
                    data: {
                        communityId: community.id,
                        name: plan.name,
                        price: plan.price || 0,
                        interval: plan.interval || 'monthly',
                        features: JSON.stringify(plan.features || []),
                        tierLevel: plan.tierLevel || 0,
                    },
                });
            }
        } else {
            // Default free plan
            await this.prisma.communityPlan.create({
                data: {
                    communityId: community.id,
                    name: 'Gratis',
                    price: 0,
                    interval: 'monthly',
                    features: JSON.stringify(['Acceso a publicaciones públicas', 'Interacción con miembros']),
                    tierLevel: 0,
                },
            });
        }

        // Creator auto-joins as OWNER using the lowest tier plan or any available plan
        const firstPlan = await this.prisma.communityPlan.findFirst({
            where: { communityId: community.id },
            orderBy: { price: 'asc' },
        });
        if (firstPlan) {
            await this.prisma.communityMember.create({
                data: {
                    communityId: community.id,
                    userId,
                    planId: firstPlan.id,
                    role: 'OWNER',
                    subscriptionStatus: 'ACTIVE',
                    paymentStatus: 'SUCCEEDED',
                },
            });
        }

        // Mark user as creator
        await this.prisma.user.update({
            where: { id: userId },
            data: { isCreator: true },
        });

        return this.findOne(community.id, userId);
    }

    async update(id: string, userId: string, dto: any) {
        await this.assertOwnerOrAdmin(id, userId);
        const community = await this.prisma.community.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                category: dto.category,
                privacyType: dto.privacyType,
                rules: dto.rules,
                imageUrl: dto.imageUrl,
                bannerUrl: dto.bannerUrl,
                maxMembers: dto.maxMembers,
            },
            include: this.communityInclude(userId),
        });
        return this.enrichWithMembership(community, userId);
    }

    async remove(id: string, userId: string) {
        await this.assertOwnerOrAdmin(id, userId);
        await this.prisma.community.delete({ where: { id } });
        return { success: true };
    }

    // ─── Members ─────────────────────────────────────────────────────────────

    async getJoinedCommunities(userId: string) {
        const memberships = await this.prisma.communityMember.findMany({
            where: { userId, subscriptionStatus: 'ACTIVE' },
            include: {
                community: {
                    include: {
                        creator: { select: { id: true, username: true, avatarUrl: true } },
                        _count: { select: { members: true, posts: true } },
                    },
                },
                plan: true,
            },
            orderBy: { joinedAt: 'desc' },
        });
        return memberships.map(m => ({ ...m.community, membership: m }));
    }

    async joinFree(userId: string, communityId: string, planId?: string) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            include: { plans: true },
        });
        if (!community) throw new NotFoundException('Comunidad no encontrada');
        if (community.privacyType === 'EXCLUSIVE') {
            throw new ForbiddenException('Esta comunidad es exclusiva por invitación.');
        }

        const chosenPlan = planId
            ? community.plans.find(p => p.id === planId)
            : community.plans.find(p => Number(p.price) === 0);

        if (!chosenPlan) throw new NotFoundException('Plan no encontrado');
        if (Number(chosenPlan.price) > 0) {
            throw new ForbiddenException('Este plan requiere pago. Usa el flujo de suscripción.');
        }

        const existing = await this.prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId } },
        });

        if (existing && this.isMembershipActive(existing)) {
            throw new BadRequestException('Ya sos miembro.');
        }

        if (existing) {
            return this.prisma.communityMember.update({
                where: { id: existing.id },
                data: {
                    planId: chosenPlan.id,
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
                planId: chosenPlan.id,
                role: 'MEMBER',
                subscriptionStatus: 'ACTIVE',
                paymentStatus: 'SUCCEEDED',
            },
        });
    }

    async leave(userId: string, communityId: string) {
        const community = await this.prisma.community.findUnique({ where: { id: communityId } });
        if (!community) throw new NotFoundException();
        if (community.creatorId === userId) {
            throw new ForbiddenException('El creador no puede abandonar su propia comunidad.');
        }

        await this.prisma.communityMember.updateMany({
            where: { communityId, userId },
            data: { subscriptionStatus: 'CANCELED' },
        });

        return { success: true };
    }

    async getMembers(communityId: string, query: any) {
        const { limit = 20, offset = 0, search } = query;
        const where: any = { communityId, subscriptionStatus: 'ACTIVE' };
        if (search) {
            where.user = { username: { contains: search, mode: 'insensitive' } };
        }

        return this.prisma.communityMember.findMany({
            where,
            take: Number(limit),
            skip: Number(offset),
            include: {
                user: {
                    select: {
                        id: true, username: true, avatarUrl: true,
                        isVerified: true, bio: true, title: true,
                    },
                },
                plan: true,
            },
            orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        });
    }

    async removeMember(communityId: string, targetUserId: string, requesterId: string) {
        await this.assertOwnerOrAdmin(communityId, requesterId);
        await this.prisma.communityMember.updateMany({
            where: { communityId, userId: targetUserId },
            data: { subscriptionStatus: 'CANCELED' },
        });
        return { success: true };
    }

    // ─── Posts ────────────────────────────────────────────────────────────────

    async listPosts(communityId: string, userId?: string, query: any = {}) {
        const { limit = 20, cursor, tab = 'all' } = query;
        const community = await this.findOne(communityId, userId);
        const myTier = community.tierLevel ?? 0;

        const where: any = { communityId, deletedAt: null };
        if (tab === 'exclusive') where.requiredTierLevel = { gt: 0 };
        if (cursor) where.createdAt = { lt: new Date(cursor) };

        const posts = await this.prisma.post.findMany({
            where,
            include: {
                author: {
                    select: { id: true, username: true, avatarUrl: true, isVerified: true },
                },
                _count: { select: { likes: true, comments: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit) + 1,
        });

        const hasMore = posts.length > Number(limit);
        const page = hasMore ? posts.slice(0, Number(limit)) : posts;

        return {
            posts: page.map(post => {
                const required = (post as any).requiredTierLevel ?? 0;
                const hasAccess = myTier >= required;
                if (!hasAccess && required > 0) {
                    return {
                        ...post,
                        content: null,
                        isLocked: true,
                        requiredTierLevel: required,
                    };
                }
                return { ...post, isLocked: false };
            }),
            hasMore,
            nextCursor: hasMore ? page[page.length - 1].createdAt.toISOString() : null,
        };
    }

    async createPost(userId: string, communityId: string, dto: any) {
        const community = await this.findOne(communityId, userId);
        if (!community.isMember) {
            throw new ForbiddenException('Debés ser miembro para publicar.');
        }

        return this.prisma.post.create({
            data: {
                communityId,
                authorId: userId,
                content: dto.content,
                targetVisibility: dto.targetVisibility || 'PUBLIC',
                requiredTierLevel: dto.requiredTierLevel || 0,
                visibility: 'VISIBLE',
                type: dto.type || 'post',
                tickers: dto.tickers || '',
                analysisType: dto.analysisType,
                assetSymbol: dto.assetSymbol,
                riskLevel: dto.riskLevel,
                media: dto.mediaUrls?.length
                    ? {
                        create: dto.mediaUrls.map((m: any, i: number) => ({
                            url: m.url,
                            mediaType: m.mediaType || 'image',
                            order: i,
                        })),
                    }
                    : undefined,
            },
            include: {
                author: {
                    select: { id: true, username: true, avatarUrl: true, isVerified: true },
                },
                _count: { select: { likes: true, comments: true } },
            },
        });
    }

    async deletePost(communityId: string, postId: string, userId: string) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post || post.communityId !== communityId) throw new NotFoundException();
        const community = await this.prisma.community.findUnique({ where: { id: communityId } });
        if (post.authorId !== userId && community?.creatorId !== userId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
            const adminRoles = new Set(['ADMIN', 'SUPER_ADMIN']);
            if (!user || !adminRoles.has(user.role)) {
                throw new ForbiddenException('No podés eliminar esta publicación.');
            }
        }
        await this.prisma.post.update({ where: { id: postId }, data: { deletedAt: new Date() } });
        return { success: true };
    }

    // ─── Resources ────────────────────────────────────────────────────────────

    async listResources(communityId: string, userId?: string) {
        const community = await this.findOne(communityId, userId);
        const myTier = community.tierLevel ?? 0;

        const resources = await this.prisma.communityResource.findMany({
            where: { communityId },
            include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return resources.filter(r => {
            if (r.isPublic) return true;
            return myTier >= r.requiredTierLevel;
        });
    }

    async createResource(communityId: string, userId: string, dto: any) {
        await this.assertOwnerOrAdmin(communityId, userId);
        return this.prisma.communityResource.create({
            data: {
                communityId,
                authorId: userId,
                title: dto.title,
                description: dto.description,
                resourceUrl: dto.resourceUrl,
                isPublic: dto.isPublic ?? false,
                requiredTierLevel: dto.requiredTierLevel ?? 0,
            },
            include: {
                author: { select: { id: true, username: true } },
            },
        });
    }

    async deleteResource(communityId: string, resourceId: string, userId: string) {
        await this.assertOwnerOrAdmin(communityId, userId);
        await this.prisma.communityResource.delete({ where: { id: resourceId } });
        return { success: true };
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    async listEvents(communityId: string, userId?: string) {
        return this.prisma.communityEvent.findMany({
            where: { communityId },
            orderBy: { eventDate: 'asc' },
        });
    }

    async createEvent(communityId: string, userId: string, dto: any) {
        await this.assertOwnerOrAdmin(communityId, userId);
        return this.prisma.communityEvent.create({
            data: {
                communityId,
                title: dto.title,
                description: dto.description,
                eventDate: new Date(dto.eventDate),
                requiredTierLevel: dto.requiredTierLevel ?? 0,
                link: dto.link,
            },
        });
    }

    async deleteEvent(communityId: string, eventId: string, userId: string) {
        await this.assertOwnerOrAdmin(communityId, userId);
        await this.prisma.communityEvent.delete({ where: { id: eventId } });
        return { success: true };
    }

    // ─── Plans ────────────────────────────────────────────────────────────────

    async createPlan(communityId: string, userId: string, dto: any) {
        await this.assertOwnerOrAdmin(communityId, userId);
        return this.prisma.communityPlan.create({
            data: {
                communityId,
                name: dto.name,
                price: dto.price ?? 0,
                interval: dto.interval || 'monthly',
                features: JSON.stringify(dto.features || []),
                tierLevel: dto.tierLevel ?? 0,
            },
        });
    }

    async deletePlan(communityId: string, planId: string, userId: string) {
        await this.assertOwnerOrAdmin(communityId, userId);
        await this.prisma.communityPlan.delete({ where: { id: planId } });
        return { success: true };
    }

    // ─── Analytics ────────────────────────────────────────────────────────────

    async getAnalytics(communityId: string, userId: string) {
        await this.assertOwnerOrAdmin(communityId, userId);

        const [totalMembers, activeMembers, totalPosts, payments, recentMembers] = await Promise.all([
            this.prisma.communityMember.count({ where: { communityId } }),
            this.prisma.communityMember.count({ where: { communityId, subscriptionStatus: 'ACTIVE' } }),
            this.prisma.post.count({ where: { communityId, deletedAt: null } }),
            this.prisma.communityPayment.findMany({
                where: { communityId },
                orderBy: { createdAt: 'desc' },
                take: 100,
            }),
            this.prisma.communityMember.findMany({
                where: { communityId, subscriptionStatus: 'ACTIVE' },
                orderBy: { joinedAt: 'desc' },
                take: 10,
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true } },
                    plan: true,
                },
            }),
        ]);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyRevenue = payments
            .filter(p => p.createdAt >= startOfMonth)
            .reduce((sum, p) => sum + Number(p.creatorAmount), 0);
        const totalRevenue = payments.reduce((sum, p) => sum + Number(p.creatorAmount), 0);
        const paidSubscribers = payments.filter(p => p.createdAt >= startOfMonth).length;

        // MRR = sum of all active PAID subscriber monthly values
        const paidMembers = await this.prisma.communityMember.findMany({
            where: {
                communityId,
                subscriptionStatus: 'ACTIVE',
                plan: { price: { gt: 0 } },
            },
            include: { plan: true },
        });
        const mrr = paidMembers.reduce((sum, m) => {
            const price = Number(m.plan?.price ?? 0);
            const interval = m.plan?.interval || 'monthly';
            return sum + (interval === 'yearly' ? price / 12 : price);
        }, 0);

        return {
            totalMembers,
            activeMembers,
            totalPosts,
            paidSubscribers: paidMembers.length,
            monthlyRevenue,
            totalRevenue,
            mrr,
            recentMembers,
            payments: payments.slice(0, 20),
        };
    }

    // ─── My Communities ───────────────────────────────────────────────────────

    async getMyCommunities(userId: string) {
        return this.prisma.community.findMany({
            where: { creatorId: userId },
            include: {
                creator: { select: { id: true, username: true, avatarUrl: true } },
                plans: { orderBy: { tierLevel: 'asc' } },
                _count: { select: { members: true, posts: true, resources: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
