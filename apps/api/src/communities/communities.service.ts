import {
    BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { CommunityPermissionsService } from './community-permissions.service';
import { StripeService } from '../stripe/stripe.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { PayWithCardDto } from './dto/create-community.dto';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';

const ACTIVE_MEMBER_STATUSES = new Set(['ACTIVE']);
const MAX_POST_CONTENT_LENGTH = 1000;

@Injectable()
export class CommunitiesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
        private readonly permissions: CommunityPermissionsService,
        private readonly stripeService: StripeService,
        private readonly mercadoPagoService: MercadoPagoService,
    ) { }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private isMembershipActive(membership: any): boolean {
        if (!membership) return false;
        const sub = String(membership.subscriptionStatus || '').toUpperCase();
        return ACTIVE_MEMBER_STATUSES.has(sub);
    }

    private slugify(text: string): string {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    private async createAuditLog(communityId: string, actorId: string, action: string, targetId?: string, metadata?: any) {
        try {
            await this.prisma.communityAuditLog.create({
                data: {
                    communityId,
                    actorId,
                    action,
                    targetId,
                    metadata: metadata ? JSON.stringify(metadata) : null,
                },
            });
        } catch (e) {
            console.error('Failed to create community audit log:', e);
        }
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
            sections: {
                where: { isActive: true },
                orderBy: { order: 'asc' as const },
            },
            _count: {
                select: { members: true, posts: true, resources: true, events: true },
            },
        };
    }

    private async enrichWithMembership(community: any, userId?: string) {
        if (!userId) {
            return {
                ...community,
                isMember: false,
                membership: null,
                tierLevel: 0,
                canManage: false,
                canModerate: false,
                isOwner: false,
            };
        }

        const isOwner = community.creatorId === userId;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        const isPlatformAdmin = this.permissions.isPlatformAdmin(user);

        if (isOwner || isPlatformAdmin) {
            return {
                ...community,
                isMember: true,
                membership: { role: isOwner ? 'OWNER' : 'ADMIN' },
                tierLevel: 999,
                canManage: true,
                canModerate: true,
                isOwner,
            };
        }

        const membership = await this.prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId: community.id, userId } },
            include: { plan: true },
        });
        const active = this.isMembershipActive(membership);
        const role = active ? (membership?.role || 'MEMBER') : null;

        return {
            ...community,
            isMember: active,
            membership,
            tierLevel: active ? (membership?.plan?.tierLevel ?? 0) : 0,
            canManage: role === 'OWNER' || role === 'ADMIN',
            canModerate: role === 'OWNER' || role === 'ADMIN' || role === 'MODERATOR',
            isOwner: false,
        };
    }

    // ─── Discovery ────────────────────────────────────────────────────────────

    async findAll(query: any, userId?: string) {
        const {
            category,
            search,
            sort = 'popular',
            tab = 'all',
            limit = 20,
            offset = 0,
            page = 1,
        } = query;

        const effectiveLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
        const effectiveOffset = offset ? Number(offset) : (Math.max(Number(page) || 1, 1) - 1) * effectiveLimit;

        const where: Prisma.CommunityWhereInput = {
            status: 'PUBLISHED',
        };

        if (category && category !== 'all') {
            where.category = category;
        }

        if (search && search.trim()) {
            const clean = search.trim();
            where.OR = [
                { name: { contains: clean, mode: 'insensitive' } },
                { description: { contains: clean, mode: 'insensitive' } },
                { slug: { contains: clean, mode: 'insensitive' } },
                { tags: { contains: clean, mode: 'insensitive' } },
                { category: { contains: clean, mode: 'insensitive' } },
                { creator: { username: { contains: clean, mode: 'insensitive' } } },
            ];
        }

        if (tab === 'featured') {
            where.isFeatured = true;
        }

        let orderBy: any = [];
        if (sort === 'popular') {
            orderBy = [{ isFeatured: 'desc' }, { popularityScore: 'desc' }, { members: { _count: 'desc' } }];
        } else if (sort === 'new' || sort === 'recent') {
            orderBy = [{ createdAt: 'desc' }];
        } else if (sort === 'active') {
            orderBy = [{ posts: { _count: 'desc' } }, { updatedAt: 'desc' }];
        } else if (sort === 'members') {
            orderBy = [{ members: { _count: 'desc' } }];
        } else {
            orderBy = [{ isFeatured: 'desc' }, { popularityScore: 'desc' }];
        }

        const [communities, total] = await Promise.all([
            this.prisma.community.findMany({
                where,
                orderBy,
                take: effectiveLimit,
                skip: effectiveOffset,
                include: this.communityInclude(userId),
            }),
            this.prisma.community.count({ where }),
        ]);

        const enriched = await Promise.all(
            communities.map(c => this.enrichWithMembership(c, userId))
        );

        return enriched;
    }

    async findOne(idOrSlug: string, userId?: string) {
        // Try finding by ID first, then by slug
        const community = await this.prisma.community.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { slug: idOrSlug },
                ],
            },
            include: this.communityInclude(userId),
        });

        if (!community) throw new NotFoundException('Comunidad no encontrada');
        return this.enrichWithMembership(community, userId);
    }

    // ─── My Communities ───────────────────────────────────────────────────────

    async getMyCommunities(userId: string) {
        const communities = await this.prisma.community.findMany({
            where: { creatorId: userId },
            include: this.communityInclude(userId),
            orderBy: { createdAt: 'desc' },
        });
        return Promise.all(communities.map(c => this.enrichWithMembership(c, userId)));
    }

    async getJoinedCommunities(userId: string) {
        const memberships = await this.prisma.communityMember.findMany({
            where: { userId, subscriptionStatus: 'ACTIVE' },
            include: {
                community: {
                    include: {
                        creator: { select: { id: true, username: true, avatarUrl: true, isVerified: true } },
                        _count: { select: { members: true, posts: true } },
                    },
                },
                plan: true,
            },
            orderBy: { joinedAt: 'desc' },
        });

        return memberships.map(m => ({
            ...m.community,
            membership: m,
            isMember: true,
            tierLevel: m.plan?.tierLevel ?? 0,
        }));
    }

    // ─── CRUD (Creator Only) ──────────────────────────────────────────────────

    async create(userId: string, dto: any) {
        // Toda persona autenticada puede crear una comunidad. Solo las cuentas
        // verificadas reciben la insignia de comunidad verificada.
        const creatorAccount = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { isVerified: true },
        });
        if (!creatorAccount) throw new NotFoundException('Usuario no encontrado');

        // 2. Generate slug
        let baseSlug = this.slugify(dto.slug || dto.name);
        if (!baseSlug) baseSlug = `comunidad-${Date.now()}`;
        let uniqueSlug = baseSlug;
        let counter = 1;
        while (await this.prisma.community.findUnique({ where: { slug: uniqueSlug } })) {
            uniqueSlug = `${baseSlug}-${counter++}`;
        }

        // 3. Create Community
        const community = await this.prisma.community.create({
            data: {
                creatorId: userId,
                slug: uniqueSlug,
                name: dto.name,
                description: dto.description,
                category: dto.category,
                privacyType: dto.privacyType || 'PUBLIC',
                rules: dto.rules || '',
                imageUrl: dto.imageUrl,
                bannerUrl: dto.bannerUrl,
                accentColor: dto.accentColor || '#10B981',
                tags: dto.tags || '',
                showContentBeforeJoin: dto.showContentBeforeJoin ?? true,
                status: dto.status || 'PUBLISHED',
                isVerified: creatorAccount.isVerified,
                maxMembers: dto.maxMembers ?? null,
                paymentGatewayConfig: dto.paymentGatewayConfig || null,
                popularityScore: 10, // Initial boost
            },
        });

        // 4. Default Sections
        const defaultSections = [
            { name: 'General', description: 'Discusión general de la comunidad', icon: 'Hash', order: 0 },
            { name: 'Análisis', description: 'Tesis e informes financieros', icon: 'BarChart3', order: 1 },
            { name: 'Noticias', description: 'Novedades y actualidad de mercado', icon: 'Newspaper', order: 2 },
        ];
        await this.prisma.communitySection.createMany({
            data: defaultSections.map(s => ({
                ...s,
                communityId: community.id,
                visibility: 'PUBLIC',
                isActive: true,
            })),
        });

        // 5. Create Plans
        if (dto.plans && Array.isArray(dto.plans) && dto.plans.length > 0) {
            await this.prisma.communityPlan.createMany({
                data: dto.plans.map((plan: any) => ({
                    communityId: community.id,
                    name: plan.name,
                    price: plan.price || 0,
                    interval: plan.interval || 'monthly',
                    features: JSON.stringify(plan.features || []),
                    tierLevel: plan.tierLevel || 0,
                })),
            });
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

        // 6. Creator auto-joins as OWNER
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

        // Audit Log
        await this.createAuditLog(community.id, userId, 'COMMUNITY_CREATED', community.id, { name: community.name });

        // Alert Admin
        const creator = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, email: true },
        });
        this.mailService.sendAdminAlert({
            eventType: 'COMMUNITY_CREATED',
            title: `Nueva Comunidad Creada: "${community.name}"`,
            badgeText: 'NUEVA COMUNIDAD',
            badgeColor: '#8b5cf6',
            summary: `Se ha creado una nueva comunidad en Finix por @${creator?.username || 'usuario'}.`,
            details: [
                { label: 'Nombre de Comunidad', value: community.name },
                { label: 'Handle / Slug', value: `@${community.slug}` },
                { label: 'Creador', value: `@${creator?.username || 'N/A'}` },
                { label: 'Categoría', value: community.category },
                { label: 'Privacidad', value: community.privacyType },
            ],
            actionUrl: `${(this.mailService?.getAppUrl ? this.mailService.getAppUrl() : (process.env.FRONTEND_URL || 'http://localhost:5173'))}/comunidades/${community.slug || community.id}`,
            actionLabel: 'Ver Comunidad en Finix',
        });

        return this.findOne(community.id, userId);
    }

    async update(id: string, userId: string, dto: any) {
        await this.permissions.assertCanManageCommunity(id, userId);

        const dataToUpdate: Prisma.CommunityUpdateInput = {
            ...(dto.name && { name: dto.name }),
            ...(dto.description && { description: dto.description }),
            ...(dto.category && { category: dto.category }),
            ...(dto.privacyType && { privacyType: dto.privacyType }),
            ...(dto.rules !== undefined && { rules: dto.rules }),
            ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
            ...(dto.bannerUrl !== undefined && { bannerUrl: dto.bannerUrl }),
            ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
            ...(dto.tags !== undefined && { tags: dto.tags }),
            ...(dto.showContentBeforeJoin !== undefined && { showContentBeforeJoin: dto.showContentBeforeJoin }),
            ...(dto.status && { status: dto.status }),
            ...(dto.maxMembers !== undefined && { maxMembers: dto.maxMembers }),
            ...(dto.paymentGatewayConfig !== undefined && {
                paymentGatewayConfig: typeof dto.paymentGatewayConfig === 'string'
                    ? dto.paymentGatewayConfig
                    : JSON.stringify(dto.paymentGatewayConfig),
            }),
        };

        if (dto.slug) {
            const cleanSlug = this.slugify(dto.slug);
            const existing = await this.prisma.community.findUnique({ where: { slug: cleanSlug } });
            if (existing && existing.id !== id) {
                throw new BadRequestException('El handle/slug de la comunidad ya está en uso.');
            }
            dataToUpdate.slug = cleanSlug;
        }

        const community = await this.prisma.community.update({
            where: { id },
            data: dataToUpdate,
            include: this.communityInclude(userId),
        });

        await this.createAuditLog(id, userId, 'COMMUNITY_UPDATED', id, dto);

        return this.enrichWithMembership(community, userId);
    }

    async remove(id: string, userId: string) {
        await this.permissions.assertCanEditCommunity(id, userId);

        await this.prisma.$transaction([
            this.prisma.communityMember.deleteMany({ where: { communityId: id } }),
            this.prisma.communityPlan.deleteMany({ where: { communityId: id } }),
            this.prisma.communitySection.deleteMany({ where: { communityId: id } }),
            this.prisma.communityResource.deleteMany({ where: { communityId: id } }),
            this.prisma.communityEvent.deleteMany({ where: { communityId: id } }),
            this.prisma.communityJoinRequest.deleteMany({ where: { communityId: id } }),
            this.prisma.communityInvite.deleteMany({ where: { communityId: id } }),
            this.prisma.communityReport.deleteMany({ where: { communityId: id } }),
            this.prisma.communityAuditLog.deleteMany({ where: { communityId: id } }),
            this.prisma.post.deleteMany({ where: { communityId: id } }),
            this.prisma.community.delete({ where: { id } }),
        ]);

        return { success: true };
    }

    // ─── Sections ─────────────────────────────────────────────────────────────

    async listSections(communityId: string, userId?: string) {
        const access = await this.permissions.canAccessCommunity(userId, communityId);
        const where: Prisma.CommunitySectionWhereInput = { communityId };
        if (!access.canView && !access.isMember) {
            where.isActive = true;
            where.visibility = 'PUBLIC';
        }
        return this.prisma.communitySection.findMany({
            where,
            orderBy: { order: 'asc' },
            include: {
                _count: { select: { posts: true } },
            },
        });
    }

    async createSection(communityId: string, userId: string, dto: any) {
        await this.permissions.assertCanManageCommunity(communityId, userId);

        const count = await this.prisma.communitySection.count({ where: { communityId } });
        const section = await this.prisma.communitySection.create({
            data: {
                communityId,
                name: dto.name,
                description: dto.description || '',
                icon: dto.icon || 'Hash',
                order: dto.order ?? count,
                visibility: dto.visibility || 'PUBLIC',
                isActive: true,
            },
        });

        await this.createAuditLog(communityId, userId, 'SECTION_CREATED', section.id, { name: section.name });
        return section;
    }

    async updateSection(communityId: string, sectionId: string, userId: string, dto: any) {
        await this.permissions.assertCanManageCommunity(communityId, userId);

        const section = await this.prisma.communitySection.update({
            where: { id: sectionId },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.icon && { icon: dto.icon }),
                ...(dto.order !== undefined && { order: dto.order }),
                ...(dto.visibility && { visibility: dto.visibility }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });

        await this.createAuditLog(communityId, userId, 'SECTION_UPDATED', section.id, dto);
        return section;
    }

    async deleteSection(communityId: string, sectionId: string, userId: string) {
        await this.permissions.assertCanManageCommunity(communityId, userId);

        // Disassociate posts before deleting
        await this.prisma.post.updateMany({
            where: { sectionId },
            data: { sectionId: null },
        });

        await this.prisma.communitySection.delete({ where: { id: sectionId } });
        await this.createAuditLog(communityId, userId, 'SECTION_DELETED', sectionId);

        return { success: true };
    }

    async reorderSections(communityId: string, userId: string, sectionIds: string[]) {
        await this.permissions.assertCanManageCommunity(communityId, userId);

        await Promise.all(
            sectionIds.map((id, index) =>
                this.prisma.communitySection.updateMany({
                    where: { id, communityId },
                    data: { order: index },
                })
            )
        );

        return this.listSections(communityId, userId);
    }

    // ─── Posts ────────────────────────────────────────────────────────────────

    async listPosts(communityId: string, userId?: string, query: any = {}) {
        const { limit = 20, cursor, sectionId, tab = 'all' } = query;
        const community = await this.findOne(communityId, userId);
        const myTier = community.tierLevel ?? 0;

        const where: Prisma.PostWhereInput = {
            communityId,
            deletedAt: null,
            visibility: 'VISIBLE',
        };

        if (sectionId) {
            where.sectionId = sectionId;
        }

        if (tab === 'exclusive') {
            where.requiredTierLevel = { gt: 0 };
        }

        if (cursor) {
            where.createdAt = { lt: new Date(cursor) };
        }

        const posts = await this.prisma.post.findMany({
            where,
            take: Math.min(Number(limit) || 20, 50),
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' },
            ],
            include: {
                author: {
                    select: {
                        id: true, username: true, avatarUrl: true, isVerified: true,
                        bio: true, title: true, isInfluencer: true,
                    },
                },
                section: true,
                media: true,
                _count: {
                    select: { likes: true, comments: true },
                },
            },
        });

        // Content masking for users without required membership tier
        return posts.map(p => {
            const isAuthor = p.authorId === userId;
            const isCreatorOrAdmin = community.canManage;
            const hasTier = myTier >= (p.requiredTierLevel ?? 0);
            const isMembersOnly = p.targetVisibility === 'MEMBERS' && !community.isMember;
            const isLocked = !isAuthor && !isCreatorOrAdmin && (!hasTier || isMembersOnly);

            if (isLocked) {
                return {
                    ...p,
                    content: null,
                    isLocked: true,
                    media: [],
                };
            }

            return {
                ...p,
                isLocked: false,
            };
        });
    }

    async createPost(userId: string, communityId: string, dto: any) {
        const community = await this.findOne(communityId, userId);

        const content = String(dto.content ?? '');
        if (content.length > MAX_POST_CONTENT_LENGTH) {
            throw new BadRequestException(`La publicación no puede superar los ${MAX_POST_CONTENT_LENGTH} caracteres`);
        }

        if (!community.isMember && !community.canManage) {
            throw new ForbiddenException('Debes unirte a la comunidad para poder publicar.');
        }

        // Only managers can pin posts on creation
        const isPinned = dto.isPinned && community.canModerate;

        const post = await this.prisma.post.create({
            data: {
                authorId: userId,
                communityId,
                sectionId: dto.sectionId || null,
                content,
                type: dto.mediaUrls?.length ? 'image' : 'post',
                targetVisibility: dto.targetVisibility || 'PUBLIC',
                requiredTierLevel: dto.requiredTierLevel || 0,
                isPinned: Boolean(isPinned),
                pinnedAt: isPinned ? new Date() : null,
                media: dto.mediaUrls?.length
                    ? { create: dto.mediaUrls.map((m: any) => ({ url: m.url })) }
                    : undefined,
            },
            include: {
                author: {
                    select: { id: true, username: true, avatarUrl: true, isVerified: true },
                },
                section: true,
                media: true,
                _count: { select: { likes: true, comments: true } },
            },
        });

        // Boost popularity score
        await this.prisma.community.update({
            where: { id: communityId },
            data: { popularityScore: { increment: 3 } },
        });

        return { ...post, isLocked: false };
    }

    async pinPost(communityId: string, postId: string, userId: string, isPinned: boolean) {
        await this.permissions.assertCanModerateCommunity(communityId, userId);

        const post = await this.prisma.post.update({
            where: { id: postId },
            data: {
                isPinned,
                pinnedAt: isPinned ? new Date() : null,
            },
        });

        await this.createAuditLog(communityId, userId, isPinned ? 'POST_PINNED' : 'POST_UNPINNED', postId);
        return post;
    }

    async deletePost(communityId: string, postId: string, userId: string) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Publicación no encontrada.');

        const isAuthor = post.authorId === userId;
        if (!isAuthor) {
            await this.permissions.assertCanModerateCommunity(communityId, userId);
        }

        await this.prisma.post.update({
            where: { id: postId },
            data: { deletedAt: new Date(), visibility: 'HIDDEN' },
        });

        await this.createAuditLog(communityId, userId, 'POST_DELETED', postId);
        return { success: true };
    }

    // ─── Members ─────────────────────────────────────────────────────────────

    async getMembers(communityId: string, query: any) {
        const { limit = 20, offset = 0, search, role } = query;
        const where: Prisma.CommunityMemberWhereInput = {
            communityId,
            subscriptionStatus: 'ACTIVE',
        };

        if (role) {
            where.role = role;
        }

        if (search) {
            where.user = {
                OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        const [members, total] = await Promise.all([
            this.prisma.communityMember.findMany({
                where,
                take: Math.min(Number(limit) || 20, 50),
                skip: Number(offset) || 0,
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
            }),
            this.prisma.communityMember.count({ where }),
        ]);

        return { members, total };
    }

    async manageMemberRole(communityId: string, targetUserId: string, newRole: string, actorUserId: string) {
        await this.permissions.assertCanManageCommunity(communityId, actorUserId);

        const community = await this.prisma.community.findUnique({ where: { id: communityId } });
        if (targetUserId === community?.creatorId) {
            throw new ForbiddenException('No se puede alterar el rol del propietario de la comunidad.');
        }

        const member = await this.prisma.communityMember.update({
            where: { communityId_userId: { communityId, userId: targetUserId } },
            data: { role: newRole },
        });

        await this.createAuditLog(communityId, actorUserId, 'ROLE_CHANGED', targetUserId, { newRole });
        return member;
    }

    async removeMember(communityId: string, targetUserId: string, actorUserId: string) {
        await this.permissions.assertCanManageCommunity(communityId, actorUserId);

        const community = await this.prisma.community.findUnique({ where: { id: communityId } });
        if (targetUserId === community?.creatorId) {
            throw new ForbiddenException('No se puede expulsar al creador de su propia comunidad.');
        }

        await this.prisma.communityMember.updateMany({
            where: { communityId, userId: targetUserId },
            data: { subscriptionStatus: 'CANCELED' },
        });

        await this.createAuditLog(communityId, actorUserId, 'MEMBER_REMOVED', targetUserId);
        return { success: true };
    }

    // ─── Free Join & Leave ───────────────────────────────────────────────────

    async joinFree(userId: string, communityId: string, planId?: string) {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            include: { plans: true },
        });
        if (!community) throw new NotFoundException('Comunidad no encontrada');

        if (community.privacyType === 'PRIVATE') {
            throw new ForbiddenException('Esta comunidad es privada. Debes enviar una solicitud de ingreso.');
        }

        let chosenPlan: any;
        if (planId) {
            chosenPlan = community.plans.find(p => p.id === planId);
            if (!chosenPlan) throw new NotFoundException('Plan no encontrado');
            if (Number(chosenPlan.price) > 0) {
                throw new BadRequestException('Este plan requiere pago. Utiliza el checkout de suscripción.');
            }
        } else {
            chosenPlan = community.plans.find(p => Number(p.price) === 0);
            if (!chosenPlan) {
                throw new BadRequestException('Esta comunidad es exclusivamente paga. Requiere suscripción.');
            }
        }

        const member = await this.prisma.communityMember.upsert({
            where: { communityId_userId: { communityId, userId } },
            update: {
                planId: chosenPlan.id,
                subscriptionStatus: 'ACTIVE',
                paymentStatus: 'SUCCEEDED',
            },
            create: {
                communityId,
                userId,
                planId: chosenPlan.id,
                role: 'MEMBER',
                subscriptionStatus: 'ACTIVE',
                paymentStatus: 'SUCCEEDED',
            },
        });

        // Boost popularity score
        await this.prisma.community.update({
            where: { id: communityId },
            data: { popularityScore: { increment: 2 } },
        });

        return member;
    }

    async leave(userId: string, communityId: string) {
        const community = await this.prisma.community.findUnique({ where: { id: communityId } });
        if (!community) throw new NotFoundException('Comunidad no encontrada');
        if (community.creatorId === userId) {
            throw new ForbiddenException('El creador no puede abandonar su propia comunidad.');
        }

        await this.stripeService.cancelCommunitySubscription(userId, communityId);

        await this.prisma.communityMember.updateMany({
            where: { communityId, userId },
            data: { subscriptionStatus: 'CANCELED' },
        });

        return { success: true };
    }

    // ─── Payments & Subscriptions ─────────────────────────────────────────────

    async createCheckoutSession(userId: string, communityId: string, planId: string, provider: string = 'stripe') {
        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            include: { plans: true },
        });
        if (!community) throw new NotFoundException('Comunidad no encontrada');

        const plan = community.plans.find(p => p.id === planId);
        if (!plan) throw new NotFoundException('Plan no encontrado');

        if (Number(plan.price) === 0) {
            const member = await this.joinFree(userId, communityId, planId);
            return { freeJoined: true, member };
        }

        if (provider === 'mercadopago') {
            return this.mercadoPagoService.createCommunityPreference(userId, communityId, planId);
        }
        if (provider === 'stripe') {
            return this.stripeService.createCommunityPayment(userId, communityId, planId);
        }

        throw new BadRequestException('Proveedor de pagos no soportado actualmente.');
    }

    async processCardPayment(userId: string, communityId: string, dto: PayWithCardDto) {
        throw new BadRequestException('Los pagos con tarjeta se procesan exclusivamente mediante el checkout seguro de Mercado Pago.');
        const { planId, cardNumber, cardholderName, expiryDate, cvc } = dto;

        const community = await this.prisma.community.findUnique({
            where: { id: communityId },
            include: { plans: true },
        });
        if (!community) throw new NotFoundException('Comunidad no encontrada.');

        const plan = community.plans.find(p => p.id === planId);
        if (!plan) throw new NotFoundException('Plan no encontrado.');

        if (Number(plan.price) === 0) {
            const member = await this.joinFree(userId, communityId, planId);
            return { success: true, freeJoined: true, member };
        }

        // Clean card number & validation
        const cleanNumber = String(cardNumber || '').replace(/\D/g, '');
        if (cleanNumber.length < 13 || cleanNumber.length > 19) {
            throw new BadRequestException('Número de tarjeta inválido. Debe contener entre 13 y 19 dígitos.');
        }

        // Detect brand (Visa starts with 4, Mastercard starts with 51-55 or 2221-2720)
        let brand = 'VISA';
        if (/^4/.test(cleanNumber)) {
            brand = 'VISA';
        } else if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(cleanNumber)) {
            brand = 'MASTERCARD';
        } else if (/^3[47]/.test(cleanNumber)) {
            brand = 'AMEX';
        } else {
            brand = (dto.brand || 'VISA').toUpperCase();
        }

        // Luhn algorithm check
        let sum = 0;
        let shouldDouble = false;
        for (let i = cleanNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cleanNumber.charAt(i), 10);
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        if (sum % 10 !== 0) {
            throw new BadRequestException('El número de tarjeta ingresado no es válido (verificación Luhn falló).');
        }

        // Expiration date check (MM/YY or MM/YYYY)
        const parts = String(expiryDate || '').split(/[\/\-]/);
        if (parts.length !== 2) {
            throw new BadRequestException('Fecha de vencimiento inválida. Usa formato MM/AA.');
        }
        const expMonth = parseInt(parts[0].trim(), 10);
        let expYear = parseInt(parts[1].trim(), 10);
        if (expYear < 100) expYear += 2000;

        if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
            throw new BadRequestException('Mes de vencimiento inválido (1 a 12).');
        }

        const now = new Date();
        const expiryEndOfMonth = new Date(expYear, expMonth, 0, 23, 59, 59);
        if (expiryEndOfMonth < now) {
            throw new BadRequestException('La tarjeta se encuentra vencida.');
        }

        // CVC check
        const cleanCvc = String(cvc || '').trim();
        if (cleanCvc.length < 3 || cleanCvc.length > 4) {
            throw new BadRequestException('El código de seguridad (CVC/CVV) debe tener 3 o 4 dígitos.');
        }

        // Name check
        if (!cardholderName || cardholderName.trim().length < 3) {
            throw new BadRequestException('Nombre del titular de la tarjeta requerido.');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, email: true },
        });
        if (!user) throw new NotFoundException('Usuario no encontrado.');

        const priceNum = Number(plan.price);
        const commissionAmount = priceNum * 0.05; // 5% Finix fee
        const creatorAmount = priceNum * 0.95;    // 95% Net Creator payout
        const last4 = cleanNumber.slice(-4);
        const providerPaymentId = `pay_${brand.toLowerCase()}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        const periodDays = (plan.interval === 'yearly' || plan.interval === 'year') ? 365 : 30;
        const expiresAt = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);

        // Atomic transaction: Create payment, upsert membership with ACTIVE status, audit log
        const result = await this.prisma.$transaction(async (tx) => {
            const payment = await tx.communityPayment.create({
                data: {
                    communityId,
                    userId,
                    creatorId: community.creatorId,
                    amount: new Prisma.Decimal(priceNum),
                    commissionAmount: new Prisma.Decimal(commissionAmount),
                    creatorAmount: new Prisma.Decimal(creatorAmount),
                    stripePaymentId: providerPaymentId,
                    status: 'SUCCEEDED',
                    billingType: plan.interval || 'monthly',
                },
            });

            const member = await tx.communityMember.upsert({
                where: { communityId_userId: { communityId, userId } },
                update: {
                    subscriptionStatus: 'ACTIVE',
                    paymentStatus: 'SUCCEEDED',
                    planId: plan.id,
                    stripePaymentId: providerPaymentId,
                    expiresAt,
                },
                create: {
                    communityId,
                    userId,
                    subscriptionStatus: 'ACTIVE',
                    paymentStatus: 'SUCCEEDED',
                    planId: plan.id,
                    stripePaymentId: providerPaymentId,
                    expiresAt,
                    role: 'MEMBER',
                },
            });

            await tx.communityAuditLog.create({
                data: {
                    communityId,
                    actorId: userId,
                    action: 'MEMBER_SUBSCRIBED',
                    targetId: plan.id,
                    metadata: JSON.stringify({
                        amount: priceNum,
                        planName: plan.name,
                        brand,
                        last4,
                        paymentId: payment.id,
                    }),
                },
            });

            return { payment, member };
        });

        // Notify community creator
        try {
            await this.prisma.notification.create({
                data: {
                    userId: community.creatorId,
                    type: 'COMMUNITY_NEW_SUBSCRIBER',
                    title: '¡Nuevo miembro suscriptor!',
                    message: `@${user.username} se suscribió a "${plan.name}" en tu comunidad con tarjeta ${brand} (•••• ${last4}).`,
                    link: `/comunidades/${community.slug || community.id}`,
                    entityType: 'COMMUNITY',
                    entityId: community.id,
                    actorId: user.id,
                },
            });
        } catch (e) {
            // non-blocking
        }

        // Notify Admin about the new community subscription payment
        try {
            this.mailService.sendAdminAlert({
                eventType: 'PAYMENT_RECEIVED',
                title: `Pago Recibido: Membresía a "${community.name}" ($${priceNum} USD)`,
                badgeText: 'PAGO MEMBRESÍA',
                badgeColor: '#10b981',
                summary: `@${user.username} ha pagado una membresía con tarjeta ${brand} (•••• ${last4}).`,
                details: [
                    { label: 'Comunidad', value: community.name },
                    { label: 'Plan', value: plan.name },
                    { label: 'Monto Total', value: `$${priceNum.toFixed(2)} USD` },
                    { label: 'Comisión Finix (10%)', value: `$${commissionAmount.toFixed(2)} USD` },
                    { label: 'Creador (90%)', value: `$${creatorAmount.toFixed(2)} USD` },
                    { label: 'Usuario', value: `@${user.username} (${user.email})` },
                    { label: 'Tarjeta', value: `${brand} •••• ${last4}` },
                    { label: 'Titular', value: cardholderName },
                ],
                actionUrl: `${(this.mailService?.getAppUrl ? this.mailService.getAppUrl() : (process.env.FRONTEND_URL || 'https://finixarg.com'))}/comunidades/${community.slug || community.id}`,
                actionLabel: 'Ver Comunidad en Finix',
            });
        } catch (e) {
            // non-blocking
        }

        return {
            success: true,
            message: `¡Pago exitoso con ${brand}! Tu suscripción a ${plan.name} está activa.`,
            paymentId: result.payment.id,
            brand,
            last4,
            planName: plan.name,
            amount: priceNum,
            expiresAt,
            member: result.member,
        };
    }

    async cancelSubscription(userId: string, communityId: string) {
        const membership = await this.stripeService.cancelCommunitySubscription(userId, communityId);

        if (!membership) {
            throw new NotFoundException('Membresía no encontrada.');
        }

        await this.prisma.communityMember.update({
            where: { communityId_userId: { communityId, userId } },
            data: {
                subscriptionStatus: membership.expiresAt && membership.expiresAt > new Date() ? 'ACTIVE' : 'CANCELED',
            },
        });

        await this.createAuditLog(communityId, userId, 'COMMUNITY_SUBSCRIPTION_CANCELED', userId);

        return {
            success: true,
            message: 'Tu suscripción ha sido cancelada. Tu acceso continuará hasta el fin de tu período actual.',
            expiresAt: membership.expiresAt,
        };
    }

    // ─── Join Requests (Private Communities) ──────────────────────────────────

    async createJoinRequest(communityId: string, userId: string, note?: string) {
        const community = await this.prisma.community.findUnique({ where: { id: communityId } });
        if (!community) throw new NotFoundException('Comunidad no encontrada.');

        const existingMember = await this.prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId } },
        });
        if (existingMember && existingMember.subscriptionStatus === 'ACTIVE') {
            throw new BadRequestException('Ya eres miembro de esta comunidad.');
        }

        return this.prisma.communityJoinRequest.upsert({
            where: { communityId_userId: { communityId, userId } },
            update: { status: 'PENDING', note },
            create: { communityId, userId, note, status: 'PENDING' },
        });
    }

    async listJoinRequests(communityId: string, userId: string, status = 'PENDING') {
        await this.permissions.assertCanManageCommunity(communityId, userId);

        return this.prisma.communityJoinRequest.findMany({
            where: { communityId, status },
            include: {
                user: { select: { id: true, username: true, avatarUrl: true, bio: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async reviewJoinRequest(communityId: string, requestId: string, status: string, reviewerId: string) {
        await this.permissions.assertCanManageCommunity(communityId, reviewerId);

        const request = await this.prisma.communityJoinRequest.findUnique({
            where: { id: requestId },
        });
        if (!request) throw new NotFoundException('Solicitud no encontrada.');

        await this.prisma.communityJoinRequest.update({
            where: { id: requestId },
            data: { status, reviewedById: reviewerId },
        });

        if (status === 'APPROVED') {
            const firstPlan = await this.prisma.communityPlan.findFirst({
                where: { communityId },
                orderBy: { price: 'asc' },
            });
            await this.prisma.communityMember.upsert({
                where: { communityId_userId: { communityId, userId: request.userId } },
                update: { subscriptionStatus: 'ACTIVE', role: 'MEMBER', planId: firstPlan?.id },
                create: {
                    communityId,
                    userId: request.userId,
                    planId: firstPlan?.id,
                    role: 'MEMBER',
                    subscriptionStatus: 'ACTIVE',
                    paymentStatus: 'SUCCEEDED',
                },
            });
        }

        return { success: true, status };
    }

    // ─── Invites ──────────────────────────────────────────────────────────────

    async createInvite(communityId: string, userId: string, dto: any) {
        await this.permissions.assertCanManageCommunity(communityId, userId);

        const code = crypto.randomBytes(6).toString('hex');
        const expiresAt = dto.expiresInDays
            ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
            : null;

        const invite = await this.prisma.communityInvite.create({
            data: {
                communityId,
                code,
                createdById: userId,
                expiresAt,
                maxUses: dto.maxUses || null,
            },
        });

        return {
            ...invite,
            inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/comunidades/invite/${code}`,
        };
    }

    async getInvite(code: string) {
        const invite = await this.prisma.communityInvite.findUnique({
            where: { code },
            include: {
                community: {
                    select: {
                        id: true, name: true, slug: true, description: true,
                        imageUrl: true, bannerUrl: true, category: true,
                        _count: { select: { members: true } },
                    },
                },
            },
        });

        if (!invite) throw new NotFoundException('Invitación no válida.');
        if (invite.expiresAt && invite.expiresAt < new Date()) {
            throw new BadRequestException('Esta invitación ha expirado.');
        }
        if (invite.maxUses && invite.usedCount >= invite.maxUses) {
            throw new BadRequestException('Esta invitación ha alcanzado su límite de usos.');
        }

        return invite;
    }

    async acceptInvite(code: string, userId: string) {
        const invite = await this.getInvite(code);

        const firstPlan = await this.prisma.communityPlan.findFirst({
            where: { communityId: invite.communityId },
            orderBy: { price: 'asc' },
        });

        const member = await this.prisma.communityMember.upsert({
            where: { communityId_userId: { communityId: invite.communityId, userId } },
            update: { subscriptionStatus: 'ACTIVE', role: 'MEMBER' },
            create: {
                communityId: invite.communityId,
                userId,
                planId: firstPlan?.id,
                role: 'MEMBER',
                subscriptionStatus: 'ACTIVE',
                paymentStatus: 'SUCCEEDED',
            },
        });

        await this.prisma.communityInvite.update({
            where: { id: invite.id },
            data: { usedCount: { increment: 1 } },
        });

        return member;
    }

    // ─── Moderation & Reports ─────────────────────────────────────────────────

    async createReport(communityId: string, reporterId: string, dto: any) {
        return this.prisma.communityReport.create({
            data: {
                communityId,
                reporterId,
                targetType: dto.targetType,
                targetId: dto.targetId,
                reason: dto.reason,
                details: dto.details || null,
                status: 'PENDING',
            },
        });
    }

    async listReports(communityId: string, userId: string, status = 'PENDING') {
        await this.permissions.assertCanModerateCommunity(communityId, userId);

        return this.prisma.communityReport.findMany({
            where: { communityId, status },
            include: {
                reporter: { select: { id: true, username: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async resolveReport(communityId: string, reportId: string, actorUserId: string, dto: any) {
        await this.permissions.assertCanModerateCommunity(communityId, actorUserId);

        const report = await this.prisma.communityReport.findUnique({ where: { id: reportId } });
        if (!report) throw new NotFoundException('Reporte no encontrado.');

        const updated = await this.prisma.communityReport.update({
            where: { id: reportId },
            data: {
                status: dto.status || 'RESOLVED',
                actionTaken: dto.actionTaken || 'NONE',
                reviewedById: actorUserId,
            },
        });

        if (dto.actionTaken === 'DELETED' && report.targetType === 'POST') {
            await this.prisma.post.update({
                where: { id: report.targetId },
                data: { deletedAt: new Date(), visibility: 'HIDDEN' },
            });
        }

        await this.createAuditLog(communityId, actorUserId, 'REPORT_RESOLVED', reportId, dto);
        return updated;
    }

    // ─── Plans ────────────────────────────────────────────────────────────────

    async createPlan(communityId: string, userId: string, dto: any) {
        await this.permissions.assertCanManagePayments(communityId, userId);

        const plan = await this.prisma.communityPlan.create({
            data: {
                communityId,
                name: dto.name,
                price: dto.price,
                interval: dto.interval || 'monthly',
                features: JSON.stringify(dto.features || []),
                tierLevel: dto.tierLevel || 0,
            },
        });

        await this.createAuditLog(communityId, userId, 'PLAN_CREATED', plan.id, { name: plan.name, price: plan.price });
        return plan;
    }

    async deletePlan(communityId: string, planId: string, userId: string) {
        await this.permissions.assertCanManagePayments(communityId, userId);

        await this.prisma.communityPlan.delete({ where: { id: planId } });
        await this.createAuditLog(communityId, userId, 'PLAN_DELETED', planId);

        return { success: true };
    }

    // ─── Resources ────────────────────────────────────────────────────────────

    async listResources(communityId: string, userId?: string) {
        const community = await this.findOne(communityId, userId);
        const myTier = community.tierLevel ?? 0;

        const resources = await this.prisma.communityResource.findMany({
            where: { communityId },
            include: { author: { select: { id: true, username: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return resources.map(r => ({
            ...r,
            isLocked: !community.canManage && myTier < r.requiredTierLevel,
        }));
    }

    async createResource(communityId: string, userId: string, dto: any) {
        await this.permissions.assertCanManageCommunity(communityId, userId);

        return this.prisma.communityResource.create({
            data: {
                communityId,
                title: dto.title,
                description: dto.description,
                resourceUrl: dto.resourceUrl,
                isPublic: dto.isPublic ?? false,
                requiredTierLevel: dto.requiredTierLevel ?? 0,
                authorId: userId,
            },
        });
    }

    async deleteResource(communityId: string, resourceId: string, userId: string) {
        await this.permissions.assertCanManageCommunity(communityId, userId);
        await this.prisma.communityResource.delete({ where: { id: resourceId } });
        return { success: true };
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    async listEvents(communityId: string, userId?: string) {
        const community = await this.findOne(communityId, userId);
        const myTier = community.tierLevel ?? 0;

        const events = await this.prisma.communityEvent.findMany({
            where: { communityId },
            orderBy: { eventDate: 'asc' },
        });

        return events.map(e => ({
            ...e,
            isLocked: !community.canManage && myTier < e.requiredTierLevel,
        }));
    }

    async createEvent(communityId: string, userId: string, dto: any) {
        await this.permissions.assertCanManageCommunity(communityId, userId);

        return this.prisma.communityEvent.create({
            data: {
                communityId,
                title: dto.title,
                description: dto.description,
                eventDate: new Date(dto.date),
                link: dto.link,
            },
        });
    }

    async deleteEvent(communityId: string, eventId: string, userId: string) {
        await this.permissions.assertCanManageCommunity(communityId, userId);
        await this.prisma.communityEvent.delete({ where: { id: eventId } });
        return { success: true };
    }

    // ─── Creator Studio & Real Analytics ──────────────────────────────────────

    async getAnalytics(communityId: string, userId: string) {
        await this.permissions.assertCanManageCommunity(communityId, userId);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [
            totalMembers,
            activePaidMembers,
            newMembersThisMonth,
            newMembersPrevMonth,
            totalPosts,
            payments,
            activeMembersData,
            plans,
            recentAudit,
        ] = await Promise.all([
            this.prisma.communityMember.count({
                where: { communityId, subscriptionStatus: 'ACTIVE' },
            }),
            this.prisma.communityMember.count({
                where: {
                    communityId,
                    subscriptionStatus: 'ACTIVE',
                    plan: { price: { gt: 0 } },
                },
            }),
            this.prisma.communityMember.count({
                where: {
                    communityId,
                    joinedAt: { gte: startOfMonth },
                },
            }),
            this.prisma.communityMember.count({
                where: {
                    communityId,
                    joinedAt: { gte: startOfPrevMonth, lt: startOfMonth },
                },
            }),
            this.prisma.post.count({
                where: { communityId, deletedAt: null },
            }),
            this.prisma.communityPayment.findMany({
                where: { communityId, status: 'SUCCEEDED' },
                select: {
                    amount: true,
                    creatorAmount: true,
                    commissionAmount: true,
                    createdAt: true,
                    billingType: true,
                },
            }),
            this.prisma.communityMember.findMany({
                where: { communityId },
                include: { plan: true },
            }),
            this.prisma.communityPlan.findMany({
                where: { communityId },
                include: { _count: { select: { members: true } } },
            }),
            this.prisma.communityAuditLog.findMany({
                where: { communityId },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { actor: { select: { username: true } } },
            }),
        ]);

        const grossRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);
        const netCreatorRevenue = payments.reduce((acc, p) => acc + Number(p.creatorAmount), 0);

        // MRR Calculation
        const monthlyRecurringRevenue = activeMembersData.reduce((acc, m) => {
            if (m.subscriptionStatus === 'ACTIVE' && m.plan && Number(m.plan.price) > 0) {
                const price = Number(m.plan.price);
                return acc + (m.plan.interval === 'yearly' ? price / 12 : price);
            }
            return acc;
        }, 0);

        // Growth rate
        const memberGrowthRate = newMembersPrevMonth > 0
            ? Math.round(((newMembersThisMonth - newMembersPrevMonth) / newMembersPrevMonth) * 100)
            : 100;

        return {
            membersCount: totalMembers,
            activePaidMembers,
            newMembersThisMonth,
            memberGrowthRate,
            postsCount: totalPosts,
            grossRevenue,
            netCreatorRevenue,
            monthlyRecurringRevenue,
            annualRecurringRevenue: monthlyRecurringRevenue * 12,
            plans: plans.map(p => ({
                id: p.id,
                name: p.name,
                price: Number(p.price),
                interval: p.interval,
                membersCount: p._count.members,
            })),
            recentAudit,
        };
    }

    async getFinancials(communityId: string, userId: string) {
        await this.permissions.assertCanManagePayments(communityId, userId);

        const [payments, community] = await Promise.all([
            this.prisma.communityPayment.findMany({
                where: { communityId },
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    user: { select: { id: true, username: true, avatarUrl: true, email: true } },
                },
            }),
            (this.prisma.community as any).findUnique({
                where: { id: communityId },
                select: { id: true, name: true, paymentGatewayConfig: true },
            }),
        ]);

        const gross = payments.filter(p => p.status === 'SUCCEEDED').reduce((a, b) => a + Number(b.amount), 0);
        const commissions = payments.filter(p => p.status === 'SUCCEEDED').reduce((a, b) => a + Number(b.commissionAmount), 0);
        const net = payments.filter(p => p.status === 'SUCCEEDED').reduce((a, b) => a + Number(b.creatorAmount), 0);

        let parsedGatewayConfig: any = null;
        if ((community as any)?.paymentGatewayConfig) {
            try {
                parsedGatewayConfig = JSON.parse((community as any).paymentGatewayConfig);
            } catch {
                parsedGatewayConfig = null;
            }
        }

        return {
            summary: {
                gross,
                commissions,
                net,
                totalTransactions: payments.length,
            },
            payments,
            paymentGatewayConfig: parsedGatewayConfig,
        };
    }

    async updatePaymentGateway(communityId: string, userId: string, config: any) {
        await this.permissions.assertCanManagePayments(communityId, userId);

        const serialized = typeof config === 'string' ? config : JSON.stringify(config);

        const community: any = await (this.prisma.community as any).update({
            where: { id: communityId },
            data: { paymentGatewayConfig: serialized },
            select: { id: true, name: true, paymentGatewayConfig: true },
        });

        await this.createAuditLog(communityId, userId, 'PAYOUT_UPDATED', communityId, {
            provider: config?.provider,
            currency: config?.currency,
            isEnabled: config?.isEnabled,
        });

        let parsed: any = null;
        try {
            parsed = community?.paymentGatewayConfig ? JSON.parse(community.paymentGatewayConfig) : null;
        } catch {
            parsed = null;
        }

        return {
            success: true,
            message: 'Configuración de pasarela de pago guardada exitosamente.',
            paymentGatewayConfig: parsed,
        };
    }

    // ─── Platform Admin Controls (Finix Admin Only) ───────────────────────────

    async setFeatured(communityId: string, adminUserId: string, isFeatured: boolean) {
        const user = await this.prisma.user.findUnique({ where: { id: adminUserId }, select: { role: true } });
        if (!this.permissions.isPlatformAdmin(user)) {
            throw new ForbiddenException('Solo los administradores generales de Finix pueden destacar comunidades.');
        }

        const community = await this.prisma.community.update({
            where: { id: communityId },
            data: { isFeatured },
        });

        await this.createAuditLog(communityId, adminUserId, 'COMMUNITY_FEATURED_TOGGLED', communityId, { isFeatured });
        return community;
    }
}
