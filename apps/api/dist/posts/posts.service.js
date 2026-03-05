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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const EDIT_WINDOW_MS = 15 * 60 * 1000;
const BANNED_WORDS = ['spam', 'scam', 'estafa'];
const AUTHOR_SELECT = {
    id: true,
    username: true,
    avatarUrl: true,
    isVerified: true,
    isInfluencer: true,
    isCreator: true,
    plan: true,
};
const POST_INCLUDE = (userId) => ({
    author: { select: AUTHOR_SELECT },
    media: { orderBy: { order: 'asc' } },
    likes: { select: { userId: true } },
    reposts: { select: { userId: true } },
    saves: { select: { userId: true } },
    parent: {
        include: {
            author: { select: AUTHOR_SELECT },
        }
    },
    quotedPost: {
        include: {
            author: { select: AUTHOR_SELECT },
            media: true,
        }
    },
    _count: { select: { likes: true, replies: true, reposts: true, saves: true, quotes: true } },
});
function sanitize(text) {
    return text.replace(/<[^>]*>/g, '').trim();
}
function moderateContent(text) {
    const lower = text.toLowerCase();
    for (const word of BANNED_WORDS) {
        if (lower.includes(word)) {
            throw new common_1.BadRequestException(`Contenido no permitido: "${word}"`);
        }
    }
}
function enrichPost(post, userId) {
    return {
        ...post,
        likedByMe: userId ? post.likes?.some((l) => l.userId === userId) : false,
        repostedByMe: userId ? post.reposts?.some((r) => r.userId === userId) : false,
        savedByMe: userId ? post.saves?.some((s) => s.userId === userId) : false,
        likesCount: post._count?.likes ?? post.likes?.length ?? 0,
        commentsCount: (post._count?.comments ?? 0) + (post._count?.replies ?? 0),
        repostsCount: (post._count?.reposts ?? 0) + (post._count?.quotes ?? 0),
        savesCount: post._count?.saves ?? 0,
    };
}
let PostsService = class PostsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPost(userId, dto) {
        const content = sanitize(dto.content || '');
        if (!content && (!dto.mediaUrls || dto.mediaUrls.length === 0)) {
            throw new common_1.BadRequestException('El post debe tener contenido o media');
        }
        moderateContent(content);
        const type = dto.type || 'post';
        const tickers = dto.tickers ? dto.tickers.join(',') : '';
        const post = await this.prisma.post.create({
            data: {
                authorId: userId,
                content,
                type,
                assetSymbol: dto.assetSymbol || null,
                analysisType: dto.analysisType || null,
                riskLevel: dto.riskLevel || null,
                tickers,
                media: dto.mediaUrls?.length
                    ? {
                        create: dto.mediaUrls.map((m, i) => ({
                            url: m.url,
                            mediaType: m.mediaType,
                            order: i,
                        })),
                    }
                    : undefined,
                parentId: dto.parentId || null,
                quotedPostId: dto.quotedPostId || null,
            },
            include: POST_INCLUDE(userId),
        });
        return enrichPost(post, userId);
    }
    async getFeed(userId, opts) {
        const limit = Math.min(opts.limit ?? 20, 50);
        const sort = opts.sort ?? 'recent';
        let followingIds = [];
        if (sort === 'following' && userId) {
            const follows = await this.prisma.follow.findMany({
                where: { followerId: userId },
                select: { followingId: true },
            });
            followingIds = follows.map((f) => f.followingId);
        }
        const where = { parentId: null };
        if (sort === 'following') {
            where.authorId = { in: followingIds };
        }
        if (opts.type) {
            where.type = opts.type;
        }
        const orderBy = sort === 'popular' || sort === 'trending'
            ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }]
            : { createdAt: 'desc' };
        const posts = await this.prisma.post.findMany({
            where,
            take: limit + 1,
            ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
            orderBy,
            include: POST_INCLUDE(userId),
        });
        const hasMore = posts.length > limit;
        const items = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? items[items.length - 1].id : null;
        return {
            posts: items.map((p) => enrichPost(p, userId)),
            nextCursor,
            hasMore,
        };
    }
    async getPostById(postId, userId) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                ...POST_INCLUDE(userId),
                replies: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        ...POST_INCLUDE(userId),
                    }
                },
                comments: {
                    where: { parentId: null },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: {
                        author: { select: AUTHOR_SELECT },
                        likes: { select: { userId: true } },
                        _count: { select: { likes: true, replies: true } },
                        replies: {
                            take: 5,
                            orderBy: { createdAt: 'asc' },
                            include: {
                                author: { select: AUTHOR_SELECT },
                                likes: { select: { userId: true } },
                                _count: { select: { likes: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!post)
            throw new common_1.NotFoundException('Post no encontrado');
        return enrichPost(post, userId);
    }
    async updatePost(postId, userId, content) {
        const post = await this.prisma.post.findFirst({
            where: { id: postId, authorId: userId },
        });
        if (!post)
            throw new common_1.NotFoundException('Post no encontrado o sin permisos');
        const ageMs = Date.now() - post.createdAt.getTime();
        if (ageMs > EDIT_WINDOW_MS) {
            throw new common_1.ForbiddenException('Solo podés editar el texto dentro de los primeros 15 minutos');
        }
        const sanitized = sanitize(content);
        moderateContent(sanitized);
        return this.prisma.post.update({
            where: { id: postId },
            data: { content: sanitized, contentEditedAt: new Date() },
            include: POST_INCLUDE(userId),
        });
    }
    async deletePost(postId, userId, isAdmin = false) {
        const where = isAdmin ? { id: postId } : { id: postId, authorId: userId };
        const post = await this.prisma.post.findFirst({ where });
        if (!post)
            throw new common_1.NotFoundException('Post no encontrado o sin permisos');
        await this.prisma.post.delete({ where: { id: postId } });
        return { success: true };
    }
    async toggleLike(postId, userId) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post)
            throw new common_1.NotFoundException('Post no encontrado');
        const existing = await this.prisma.like.findUnique({
            where: { postId_userId: { postId, userId } },
        });
        if (existing) {
            await this.prisma.like.delete({ where: { postId_userId: { postId, userId } } });
            return { liked: false };
        }
        await this.prisma.like.create({ data: { postId, userId } });
        return { liked: true };
    }
    async addComment(postId, userId, content, parentId) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post)
            throw new common_1.NotFoundException('Post no encontrado');
        const sanitized = sanitize(content);
        if (!sanitized)
            throw new common_1.BadRequestException('El comentario no puede estar vacío');
        moderateContent(sanitized);
        if (parentId) {
            const parent = await this.prisma.comment.findUnique({ where: { id: parentId } });
            if (!parent || parent.postId !== postId)
                throw new common_1.NotFoundException('Comentario padre no encontrado');
        }
        return this.prisma.comment.create({
            data: { postId, authorId: userId, content: sanitized, parentId: parentId || null },
            include: {
                author: { select: AUTHOR_SELECT },
                _count: { select: { likes: true, replies: true } },
            },
        });
    }
    async getComments(postId, userId, cursor, limit = 20) {
        const comments = await this.prisma.comment.findMany({
            where: { postId, parentId: null },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
            include: {
                author: { select: AUTHOR_SELECT },
                likes: { select: { userId: true } },
                _count: { select: { likes: true, replies: true } },
                replies: {
                    take: 3,
                    orderBy: { createdAt: 'asc' },
                    include: {
                        author: { select: AUTHOR_SELECT },
                        likes: { select: { userId: true } },
                        _count: { select: { likes: true } },
                    },
                },
            },
        });
        const hasMore = comments.length > limit;
        const items = hasMore ? comments.slice(0, limit) : comments;
        return {
            comments: items.map((c) => ({
                ...c,
                likedByMe: userId ? c.likes.some((l) => l.userId === userId) : false,
                likesCount: c._count.likes,
                repliesCount: c._count.replies,
            })),
            nextCursor: hasMore ? items[items.length - 1].id : null,
            hasMore,
        };
    }
    async deleteComment(commentId, userId) {
        const comment = await this.prisma.comment.findFirst({
            where: { id: commentId, authorId: userId },
        });
        if (!comment)
            throw new common_1.NotFoundException('Comentario no encontrado o sin permisos');
        await this.prisma.comment.delete({ where: { id: commentId } });
        return { success: true };
    }
    async toggleCommentLike(commentId, userId) {
        const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw new common_1.NotFoundException('Comentario no encontrado');
        const existing = await this.prisma.commentLike.findUnique({
            where: { commentId_userId: { commentId, userId } },
        });
        if (existing) {
            await this.prisma.commentLike.delete({ where: { commentId_userId: { commentId, userId } } });
            return { liked: false };
        }
        await this.prisma.commentLike.create({ data: { commentId, userId } });
        return { liked: true };
    }
    async toggleRepost(postId, userId, comment) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post)
            throw new common_1.NotFoundException('Post no encontrado');
        const existing = await this.prisma.repost.findUnique({
            where: { userId_postId: { userId, postId } },
        });
        if (existing) {
            await this.prisma.repost.delete({ where: { userId_postId: { userId, postId } } });
            return { reposted: false };
        }
        await this.prisma.repost.create({
            data: { userId, postId },
        });
        return { reposted: true };
    }
    async toggleSave(postId, userId) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post)
            throw new common_1.NotFoundException('Post no encontrado');
        const existing = await this.prisma.save.findUnique({
            where: { userId_postId: { userId, postId } },
        });
        if (existing) {
            await this.prisma.save.delete({ where: { userId_postId: { userId, postId } } });
            return { saved: false };
        }
        await this.prisma.save.create({ data: { userId, postId } });
        return { saved: true };
    }
    async getSavedPosts(userId, cursor, limit = 20) {
        const saves = await this.prisma.save.findMany({
            where: { userId },
            take: limit + 1,
            ...(cursor ? { cursor: { userId_postId: { userId, postId: cursor } }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
            include: { post: { include: POST_INCLUDE(userId) } },
        });
        const hasMore = saves.length > limit;
        const items = hasMore ? saves.slice(0, limit) : saves;
        return {
            posts: items.map((s) => enrichPost(s.post, userId)),
            nextCursor: hasMore ? items[items.length - 1].postId : null,
            hasMore,
        };
    }
    async reportPost(postId, userId, reason) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post)
            throw new common_1.NotFoundException('Post no encontrado');
        await this.prisma.postReport.upsert({
            where: { postId_userId: { postId, userId } },
            create: { postId, userId, reason },
            update: { reason },
        });
        return { success: true, message: 'Reporte enviado' };
    }
    async getUserPosts(username, viewerId, cursor, limit = 20) {
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        const posts = await this.prisma.post.findMany({
            where: { authorId: user.id },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
            include: POST_INCLUDE(viewerId),
        });
        const hasMore = posts.length > limit;
        const items = hasMore ? posts.slice(0, limit) : posts;
        return {
            posts: items.map((p) => enrichPost(p, viewerId)),
            nextCursor: hasMore ? items[items.length - 1].id : null,
            hasMore,
        };
    }
    async getAllPosts(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: POST_INCLUDE(),
            }),
            this.prisma.post.count(),
        ]);
        return { posts: posts.map((p) => enrichPost(p)), total, page, totalPages: Math.ceil(total / limit) };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PostsService);
//# sourceMappingURL=posts.service.js.map