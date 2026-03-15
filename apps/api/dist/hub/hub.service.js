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
exports.HubService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);
const isAdmin = (role) => ADMIN_ROLES.has(role);
const AUTHOR_SELECT = {
    id: true,
    username: true,
    avatarUrl: true,
    role: true,
    isVerified: true,
};
const DEFAULT_CHANNELS = [
    { slug: 'general', name: 'General', icon: '💬', type: 'CHAT', order: 0, description: 'Chat general de la comunidad' },
    { slug: 'noticias', name: 'Noticias', icon: '📰', type: 'FEED', order: 1, description: 'Noticias y análisis del mercado' },
    { slug: 'argentina', name: 'Argentina', icon: '🇦🇷', type: 'CHAT', order: 2, description: 'Mercado argentino, CEDEARs y economía local' },
    { slug: 'crypto', name: 'Crypto', icon: '₿', type: 'CHAT', order: 3, description: 'Criptomonedas y blockchain' },
    { slug: 'acciones-usa', name: 'Acciones USA', icon: '🇺🇸', type: 'CHAT', order: 4, description: 'Bolsas americanas y acciones NYSE/NASDAQ' },
    { slug: 'etfs', name: 'ETFs', icon: '📊', type: 'CHAT', order: 5, description: 'ETFs, fondos indexados y diversificación' },
    { slug: 'macro', name: 'Macro', icon: '🌍', type: 'CHAT', order: 6, description: 'Economía global, tasas y geopolítica' },
    { slug: 'principiantes', name: 'Principiantes', icon: '🌱', type: 'CHAT', order: 7, description: 'Dudas básicas, bienvenidos todos' },
];
let HubService = class HubService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async seedChannels() {
        for (const ch of DEFAULT_CHANNELS) {
            await this.prisma.hubChannel.upsert({
                where: { slug: ch.slug },
                update: {},
                create: ch,
            });
        }
        return { seeded: DEFAULT_CHANNELS.length };
    }
    async getChannels() {
        return this.prisma.hubChannel.findMany({ orderBy: { order: 'asc' } });
    }
    async createChannel(userRole, dto) {
        if (!isAdmin(userRole))
            throw new common_1.ForbiddenException('Solo admins pueden crear canales');
        return this.prisma.hubChannel.create({ data: dto });
    }
    async updateChannel(userRole, channelId, dto) {
        if (!isAdmin(userRole))
            throw new common_1.ForbiddenException();
        return this.prisma.hubChannel.update({ where: { id: channelId }, data: dto });
    }
    async deleteChannel(userRole, channelId) {
        if (!isAdmin(userRole))
            throw new common_1.ForbiddenException();
        return this.prisma.hubChannel.delete({ where: { id: channelId } });
    }
    async getMessages(channelId, cursor, limit = 50) {
        const msgs = await this.prisma.hubMessage.findMany({
            where: { channelId },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: { author: { select: AUTHOR_SELECT } },
        });
        const hasMore = msgs.length > limit;
        return { messages: msgs.slice(0, limit).reverse(), hasMore };
    }
    async sendMessage(userId, channelId, dto) {
        const channel = await this.prisma.hubChannel.findUnique({ where: { id: channelId } });
        if (!channel)
            throw new common_1.NotFoundException('Canal no encontrado');
        return this.prisma.hubMessage.create({
            data: { channelId, authorId: userId, content: dto.content, mediaUrl: dto.mediaUrl },
            include: { author: { select: AUTHOR_SELECT } },
        });
    }
    async pinMessage(userRole, messageId, pinned) {
        if (!isAdmin(userRole))
            throw new common_1.ForbiddenException();
        return this.prisma.hubMessage.update({ where: { id: messageId }, data: { isPinned: pinned } });
    }
    async deleteMessage(userId, userRole, messageId) {
        const msg = await this.prisma.hubMessage.findUnique({ where: { id: messageId } });
        if (!msg)
            throw new common_1.NotFoundException();
        if (msg.authorId !== userId && !isAdmin(userRole))
            throw new common_1.ForbiddenException();
        return this.prisma.hubMessage.delete({ where: { id: messageId } });
    }
    async getPosts(channelId, cursor, limit = 20) {
        const posts = await this.prisma.hubPost.findMany({
            where: { channelId },
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                author: { select: AUTHOR_SELECT },
                _count: { select: { comments: true } },
            },
        });
        const hasMore = posts.length > limit;
        return { posts: posts.slice(0, limit), hasMore };
    }
    async getAllPosts(cursor, limit = 20) {
        const posts = await this.prisma.hubPost.findMany({
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                author: { select: AUTHOR_SELECT },
                channel: { select: { id: true, name: true, slug: true, icon: true } },
                _count: { select: { comments: true } },
            },
        });
        const hasMore = posts.length > limit;
        return { posts: posts.slice(0, limit), hasMore };
    }
    async createPost(userId, userRole, channelId, dto) {
        if (!isAdmin(userRole))
            throw new common_1.ForbiddenException('Solo admins pueden publicar en el feed');
        const channel = await this.prisma.hubChannel.findUnique({ where: { id: channelId } });
        if (!channel)
            throw new common_1.NotFoundException('Canal no encontrado');
        return this.prisma.hubPost.create({
            data: { channelId, authorId: userId, ...dto },
            include: {
                author: { select: AUTHOR_SELECT },
                _count: { select: { comments: true } },
            },
        });
    }
    async pinPost(userRole, postId, pinned) {
        if (!isAdmin(userRole))
            throw new common_1.ForbiddenException();
        return this.prisma.hubPost.update({ where: { id: postId }, data: { isPinned: pinned } });
    }
    async deletePost(userId, userRole, postId) {
        const post = await this.prisma.hubPost.findUnique({ where: { id: postId } });
        if (!post)
            throw new common_1.NotFoundException();
        if (post.authorId !== userId && !isAdmin(userRole))
            throw new common_1.ForbiddenException();
        return this.prisma.hubPost.delete({ where: { id: postId } });
    }
    async getComments(postId) {
        return this.prisma.hubComment.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
            include: { author: { select: AUTHOR_SELECT } },
        });
    }
    async addComment(userId, postId, dto) {
        const post = await this.prisma.hubPost.findUnique({ where: { id: postId } });
        if (!post)
            throw new common_1.NotFoundException('Publicación no encontrada');
        return this.prisma.hubComment.create({
            data: { postId, authorId: userId, content: dto.content },
            include: { author: { select: AUTHOR_SELECT } },
        });
    }
    async deleteComment(userId, userRole, commentId) {
        const c = await this.prisma.hubComment.findUnique({ where: { id: commentId } });
        if (!c)
            throw new common_1.NotFoundException();
        if (c.authorId !== userId && !isAdmin(userRole))
            throw new common_1.ForbiddenException();
        return this.prisma.hubComment.delete({ where: { id: commentId } });
    }
    async getEvents() {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.prisma.hubEvent.findMany({
            where: { startsAt: { gte: since } },
            orderBy: { startsAt: 'asc' },
            include: { author: { select: { id: true, username: true } } },
        });
    }
    async createEvent(userId, userRole, dto) {
        if (!isAdmin(userRole))
            throw new common_1.ForbiddenException('Solo admins pueden crear eventos');
        return this.prisma.hubEvent.create({
            data: {
                authorId: userId,
                title: dto.title,
                description: dto.description,
                startsAt: new Date(dto.startsAt),
                endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
                link: dto.link,
            },
        });
    }
    async deleteEvent(userRole, eventId) {
        if (!isAdmin(userRole))
            throw new common_1.ForbiddenException();
        return this.prisma.hubEvent.delete({ where: { id: eventId } });
    }
    async getResources() {
        return this.prisma.hubResource.findMany({
            orderBy: [{ category: 'asc' }, { order: 'asc' }],
            include: { author: { select: { id: true, username: true } } },
        });
    }
    async createResource(userId, userRole, dto) {
        if (!isAdmin(userRole))
            throw new common_1.ForbiddenException('Solo admins pueden agregar recursos');
        return this.prisma.hubResource.create({ data: { authorId: userId, ...dto } });
    }
    async deleteResource(userRole, resourceId) {
        if (!isAdmin(userRole))
            throw new common_1.ForbiddenException();
        return this.prisma.hubResource.delete({ where: { id: resourceId } });
    }
    async getAdminStats(userRole) {
        if (!isAdmin(userRole))
            throw new common_1.ForbiddenException();
        const [totalMessages, totalPosts, totalComments, totalChannels, totalResources, totalEvents, totalMembers] = await Promise.all([
            this.prisma.hubMessage.count(),
            this.prisma.hubPost.count(),
            this.prisma.hubComment.count(),
            this.prisma.hubChannel.count(),
            this.prisma.hubResource.count(),
            this.prisma.hubEvent.count(),
            this.prisma.user.count(),
        ]);
        return { totalMessages, totalPosts, totalComments, totalChannels, totalResources, totalEvents, totalMembers };
    }
    async getAdminMembers(userRole) {
        if (!isAdmin(userRole))
            throw new common_1.ForbiddenException();
        return this.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                role: true,
                isVerified: true,
                createdAt: true,
                _count: { select: { hubMessages: true, hubPosts: true, hubComments: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }
};
exports.HubService = HubService;
exports.HubService = HubService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HubService);
//# sourceMappingURL=hub.service.js.map