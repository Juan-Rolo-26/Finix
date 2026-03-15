import { Response } from 'express';
import { PostsService } from './posts.service';
export declare class PostsController {
    private postsService;
    constructor(postsService: PostsService);
    getFeed(req: any, cursor?: string, limit?: string, sort?: string, type?: string): Promise<{
        posts: any[];
        nextCursor: string;
        hasMore: boolean;
    }>;
    getSaved(req: any, cursor?: string, limit?: string): Promise<{
        posts: any[];
        nextCursor: string;
        hasMore: boolean;
    }>;
    getUserPosts(req: any, username: string, cursor?: string, limit?: string): Promise<{
        posts: any[];
        nextCursor: string;
        hasMore: boolean;
    }>;
    proxyImage(url: string, res: Response): Promise<void>;
    uploadMedia(files: Express.Multer.File[]): {
        url: string;
        mediaType: string;
        originalName: string;
        size: number;
    }[];
    createPost(req: any, body: any): Promise<any>;
    getPost(req: any, id: string): Promise<any>;
    updatePost(req: any, id: string, content: string): Promise<{
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
            content: string;
            authorId: string;
            type: string;
            visibility: string;
            deletedAt: Date | null;
            assetSymbol: string | null;
            analysisType: string | null;
            riskLevel: string | null;
            contentEditedAt: Date | null;
            tickers: string;
            parentId: string | null;
            quotedPostId: string | null;
            viewCount: number;
            createdAt: Date;
            updatedAt: Date;
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
                postId: string;
                url: string;
                mediaType: string;
                order: number;
            }[];
        } & {
            id: string;
            content: string;
            authorId: string;
            type: string;
            visibility: string;
            deletedAt: Date | null;
            assetSymbol: string | null;
            analysisType: string | null;
            riskLevel: string | null;
            contentEditedAt: Date | null;
            tickers: string;
            parentId: string | null;
            quotedPostId: string | null;
            viewCount: number;
            createdAt: Date;
            updatedAt: Date;
        };
        media: {
            id: string;
            createdAt: Date;
            postId: string;
            url: string;
            mediaType: string;
            order: number;
        }[];
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
            replies: number;
            quotes: number;
            likes: number;
            reposts: number;
            saves: number;
        };
    } & {
        id: string;
        content: string;
        authorId: string;
        type: string;
        visibility: string;
        deletedAt: Date | null;
        assetSymbol: string | null;
        analysisType: string | null;
        riskLevel: string | null;
        contentEditedAt: Date | null;
        tickers: string;
        parentId: string | null;
        quotedPostId: string | null;
        viewCount: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePost(req: any, id: string): Promise<{
        success: boolean;
    }>;
    toggleLike(req: any, id: string): Promise<{
        liked: boolean;
    }>;
    getComments(req: any, id: string, cursor?: string, limit?: string): Promise<{
        comments: any[];
        nextCursor: string;
        hasMore: boolean;
        totalCount: number;
    }>;
    addComment(req: any, id: string, content: string, parentId?: string): Promise<any>;
    deleteComment(req: any, commentId: string): Promise<{
        success: boolean;
        removedCount: number;
    }>;
    toggleCommentLike(req: any, commentId: string): Promise<{
        liked: boolean;
    }>;
    toggleRepost(req: any, id: string, comment?: string): Promise<{
        reposted: boolean;
    }>;
    toggleSave(req: any, id: string): Promise<{
        saved: boolean;
    }>;
    reportPost(req: any, id: string, reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllPosts(req: any, page?: string, limit?: string): Promise<{
        posts: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
