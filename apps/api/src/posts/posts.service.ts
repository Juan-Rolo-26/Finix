import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// ─── Constants ────────────────────────────────────────────────────────────────
const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BANNED_WORDS = ['spam', 'scam', 'estafa']; // extend as needed

const AUTHOR_SELECT = {
    id: true,
    username: true,
    avatarUrl: true,
    isVerified: true,
    isInfluencer: true,
    isCreator: true,
    plan: true,
};

const POST_INCLUDE = (userId?: string) => ({
    author: { select: AUTHOR_SELECT },
    media: { orderBy: { order: 'asc' as const } },
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitize(text: string): string {
    // Basic XSS: strip HTML tags
    return text.replace(/<[^>]*>/g, '').trim();
}

function moderateContent(text: string): void {
    const lower = text.toLowerCase();
    for (const word of BANNED_WORDS) {
        if (lower.includes(word)) {
            throw new BadRequestException(`Contenido no permitido: "${word}"`);
        }
    }
}

function enrichPost(post: any, userId?: string) {
    return {
        ...post,
        likedByMe: userId ? post.likes?.some((l: any) => l.userId === userId) : false,
        repostedByMe: userId ? post.reposts?.some((r: any) => r.userId === userId) : false,
        savedByMe: userId ? post.saves?.some((s: any) => s.userId === userId) : false,
        likesCount: post._count?.likes ?? post.likes?.length ?? 0,
        commentsCount: (post._count?.comments ?? 0) + (post._count?.replies ?? 0),
        repostsCount: (post._count?.reposts ?? 0) + (post._count?.quotes ?? 0),
        savesCount: post._count?.saves ?? 0,
    };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) { }

    // ── CREATE ────────────────────────────────────────────────────────────────

    async createPost(
        userId: string,
        dto: {
            content?: string;
            type?: string;
            assetSymbol?: string;
            analysisType?: string;
            riskLevel?: string;
            tickers?: string[];
            mediaUrls?: { url: string; mediaType: string }[];
            parentId?: string;
            quotedPostId?: string;
        },
    ) {
        const content = sanitize(dto.content || '');
        if (!content && (!dto.mediaUrls || dto.mediaUrls.length === 0)) {
            throw new BadRequestException('El post debe tener contenido o media');
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

    // ── FEED ──────────────────────────────────────────────────────────────────

    async getFeed(
        userId: string | undefined,
        opts: {
            cursor?: string;
            limit?: number;
            sort?: 'recent' | 'popular' | 'following' | 'trending';
            type?: string;
        },
    ) {
        const limit = Math.min(opts.limit ?? 20, 50);
        const sort = opts.sort ?? 'recent';

        let followingIds: string[] = [];
        if (sort === 'following' && userId) {
            const follows = await this.prisma.follow.findMany({
                where: { followerId: userId },
                select: { followingId: true },
            });
            followingIds = follows.map((f) => f.followingId);
        }

        const where: any = { parentId: null }; // Main feed shows only top-level posts initially
        if (sort === 'following') {
            where.authorId = { in: followingIds };
        }
        if (opts.type) {
            where.type = opts.type;
        }

        const orderBy: any =
            sort === 'popular' || sort === 'trending'
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

    // ── GET ONE ───────────────────────────────────────────────────────────────

    async getPostById(postId: string, userId?: string) {
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
                // Also keep legacy comments for backward compatibility until frontend is fully migrated
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

        if (!post) throw new NotFoundException('Post no encontrado');
        return enrichPost(post, userId);
    }

    // ── UPDATE (text only, 15 min window) ─────────────────────────────────────

    async updatePost(postId: string, userId: string, content: string) {
        const post = await this.prisma.post.findFirst({
            where: { id: postId, authorId: userId },
        });
        if (!post) throw new NotFoundException('Post no encontrado o sin permisos');

        const ageMs = Date.now() - post.createdAt.getTime();
        if (ageMs > EDIT_WINDOW_MS) {
            throw new ForbiddenException('Solo podés editar el texto dentro de los primeros 15 minutos');
        }

        const sanitized = sanitize(content);
        moderateContent(sanitized);

        return this.prisma.post.update({
            where: { id: postId },
            data: { content: sanitized, contentEditedAt: new Date() },
            include: POST_INCLUDE(userId),
        });
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    async deletePost(postId: string, userId: string, isAdmin = false) {
        const where = isAdmin ? { id: postId } : { id: postId, authorId: userId };
        const post = await this.prisma.post.findFirst({ where });
        if (!post) throw new NotFoundException('Post no encontrado o sin permisos');
        await this.prisma.post.delete({ where: { id: postId } });
        return { success: true };
    }

    // ── LIKE / UNLIKE ─────────────────────────────────────────────────────────

    async toggleLike(postId: string, userId: string) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post no encontrado');

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

    // ── COMMENT ───────────────────────────────────────────────────────────────

    async addComment(postId: string, userId: string, content: string, parentId?: string) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post no encontrado');

        const sanitized = sanitize(content);
        if (!sanitized) throw new BadRequestException('El comentario no puede estar vacío');
        moderateContent(sanitized);

        if (parentId) {
            const parent = await this.prisma.comment.findUnique({ where: { id: parentId } });
            if (!parent || parent.postId !== postId) throw new NotFoundException('Comentario padre no encontrado');
        }

        return this.prisma.comment.create({
            data: { postId, authorId: userId, content: sanitized, parentId: parentId || null },
            include: {
                author: { select: AUTHOR_SELECT },
                _count: { select: { likes: true, replies: true } },
            },
        });
    }

    async getComments(postId: string, userId?: string, cursor?: string, limit = 20) {
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

    async deleteComment(commentId: string, userId: string) {
        const comment = await this.prisma.comment.findFirst({
            where: { id: commentId, authorId: userId },
        });
        if (!comment) throw new NotFoundException('Comentario no encontrado o sin permisos');
        await this.prisma.comment.delete({ where: { id: commentId } });
        return { success: true };
    }

    async toggleCommentLike(commentId: string, userId: string) {
        const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) throw new NotFoundException('Comentario no encontrado');

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

    // ── REPOST ────────────────────────────────────────────────────────────────

    async toggleRepost(postId: string, userId: string, comment?: string) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post no encontrado');

        const existing = await this.prisma.repost.findUnique({
            where: { userId_postId: { userId, postId } },
        });

        if (existing) {
            await this.prisma.repost.delete({ where: { userId_postId: { userId, postId } } });
            return { reposted: false };
        }

        // We no longer use "comment" on the repost table. A quote is created via createPost
        await this.prisma.repost.create({
            data: { userId, postId },
        });
        return { reposted: true };
    }

    // ── SAVE / BOOKMARK ───────────────────────────────────────────────────────

    async toggleSave(postId: string, userId: string) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post no encontrado');

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

    async getSavedPosts(userId: string, cursor?: string, limit = 20) {
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

    // ── REPORT ────────────────────────────────────────────────────────────────

    async reportPost(postId: string, userId: string, reason: string) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post no encontrado');

        await this.prisma.postReport.upsert({
            where: { postId_userId: { postId, userId } },
            create: { postId, userId, reason },
            update: { reason },
        });
        return { success: true, message: 'Reporte enviado' };
    }

    // ── USER POSTS ────────────────────────────────────────────────────────────

    async getUserPosts(username: string, viewerId?: string, cursor?: string, limit = 20) {
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (!user) throw new NotFoundException('Usuario no encontrado');

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

    // ── LEGACY (kept for backward compat) ─────────────────────────────────────

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
}
