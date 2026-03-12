import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma.service';
export declare class PostsService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    private getActorUsername;
    private loadCommentRepliesMap;
    private collectCommentThreadLevels;
    createPost(userId: string, dto: {
        content?: string;
        type?: string;
        assetSymbol?: string;
        analysisType?: string;
        riskLevel?: string;
        tickers?: string[];
        mediaUrls?: {
            url: string;
            mediaType: string;
        }[];
        parentId?: string;
        quotedPostId?: string;
    }): Promise<any>;
    getFeed(userId: string | undefined, opts: {
        cursor?: string;
        limit?: number;
        sort?: 'recent' | 'popular' | 'following' | 'trending';
        type?: string;
    }): Promise<{
        posts: any[];
        nextCursor: string;
        hasMore: boolean;
    }>;
    getPostById(postId: string, userId?: string): Promise<any>;
    updatePost(postId: string, userId: string, content: string): Promise<{
        likes: {
            userId: string;
        }[];
        reposts: {
            userId: string;
        }[];
        saves: {
            userId: string;
        }[];
        _count: {
            likes: number;
            reposts: number;
            saves: number;
            replies: number;
            quotes: number;
        };
        author: {
            id: string;
            username: string;
            avatarUrl: string;
            isInfluencer: boolean;
            isVerified: boolean;
            plan: string;
            isCreator: boolean;
        };
        parent: {
            author: {
                id: string;
                username: string;
                avatarUrl: string;
                isInfluencer: boolean;
                isVerified: boolean;
                plan: string;
                isCreator: boolean;
            };
        } & {
            id: string;
            type: string;
            content: string;
            createdAt: Date;
            updatedAt: Date;
            visibility: string;
            deletedAt: Date | null;
            assetSymbol: string | null;
            analysisType: string | null;
            riskLevel: string | null;
            contentEditedAt: Date | null;
            tickers: string;
            viewCount: number;
            authorId: string;
            parentId: string | null;
            quotedPostId: string | null;
        };
        quotedPost: {
            author: {
                id: string;
                username: string;
                avatarUrl: string;
                isInfluencer: boolean;
                isVerified: boolean;
                plan: string;
                isCreator: boolean;
            };
            media: {
                id: string;
                createdAt: Date;
                url: string;
                mediaType: string;
                order: number;
                postId: string;
            }[];
        } & {
            id: string;
            type: string;
            content: string;
            createdAt: Date;
            updatedAt: Date;
            visibility: string;
            deletedAt: Date | null;
            assetSymbol: string | null;
            analysisType: string | null;
            riskLevel: string | null;
            contentEditedAt: Date | null;
            tickers: string;
            viewCount: number;
            authorId: string;
            parentId: string | null;
            quotedPostId: string | null;
        };
        media: {
            id: string;
            createdAt: Date;
            url: string;
            mediaType: string;
            order: number;
            postId: string;
        }[];
    } & {
        id: string;
        type: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        visibility: string;
        deletedAt: Date | null;
        assetSymbol: string | null;
        analysisType: string | null;
        riskLevel: string | null;
        contentEditedAt: Date | null;
        tickers: string;
        viewCount: number;
        authorId: string;
        parentId: string | null;
        quotedPostId: string | null;
    }>;
    deletePost(postId: string, userId: string, isAdmin?: boolean): Promise<{
        success: boolean;
    }>;
    toggleLike(postId: string, userId: string): Promise<{
        liked: boolean;
    }>;
    addComment(postId: string, userId: string, content: string, parentId?: string): Promise<any>;
    getComments(postId: string, userId?: string, cursor?: string, limit?: number): Promise<{
        comments: any[];
        nextCursor: string;
        hasMore: boolean;
        totalCount: number;
    }>;
    deleteComment(commentId: string, userId: string): Promise<{
        success: boolean;
        removedCount: number;
    }>;
    toggleCommentLike(commentId: string, userId: string): Promise<{
        liked: boolean;
    }>;
    toggleRepost(postId: string, userId: string, comment?: string): Promise<{
        reposted: boolean;
    }>;
    toggleSave(postId: string, userId: string): Promise<{
        saved: boolean;
    }>;
    getSavedPosts(userId: string, cursor?: string, limit?: number): Promise<{
        posts: any[];
        nextCursor: string;
        hasMore: boolean;
    }>;
    reportPost(postId: string, userId: string, reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getUserPosts(username: string, viewerId?: string, cursor?: string, limit?: number): Promise<{
        posts: any[];
        nextCursor: string;
        hasMore: boolean;
    }>;
    getAllPosts(page?: number, limit?: number, viewerId?: string): Promise<{
        posts: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
