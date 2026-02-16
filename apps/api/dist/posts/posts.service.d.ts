import { PrismaService } from '../prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
export declare class PostsService {
    private prisma;
    constructor(prisma: PrismaService);
    createPost(userId: string, dto: CreatePostDto): Promise<{
        comments: ({
            author: {
                id: string;
                username: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            postId: string;
        })[];
        likes: {
            userId: string;
            postId: string;
        }[];
        author: {
            id: string;
            email: string;
            username: string;
            role: string;
            bio: string;
            avatarUrl: string;
            isInfluencer: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        mediaUrl: string | null;
        tickers: string;
        authorId: string;
    }>;
    getAllPosts(page?: number, limit?: number): Promise<{
        posts: ({
            comments: ({
                author: {
                    id: string;
                    username: string;
                    avatarUrl: string;
                };
            } & {
                id: string;
                createdAt: Date;
                content: string;
                authorId: string;
                postId: string;
            })[];
            likes: {
                userId: string;
                postId: string;
            }[];
            author: {
                id: string;
                email: string;
                username: string;
                role: string;
                bio: string;
                avatarUrl: string;
                isInfluencer: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            mediaUrl: string | null;
            tickers: string;
            authorId: string;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getPostById(postId: string): Promise<{
        comments: ({
            author: {
                id: string;
                username: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            postId: string;
        })[];
        likes: ({
            user: {
                id: string;
                username: string;
            };
        } & {
            userId: string;
            postId: string;
        })[];
        author: {
            id: string;
            email: string;
            username: string;
            role: string;
            bio: string;
            avatarUrl: string;
            isInfluencer: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        mediaUrl: string | null;
        tickers: string;
        authorId: string;
    }>;
    updatePost(postId: string, userId: string, dto: UpdatePostDto): Promise<{
        comments: {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            postId: string;
        }[];
        likes: {
            userId: string;
            postId: string;
        }[];
        author: {
            id: string;
            email: string;
            username: string;
            role: string;
            bio: string;
            avatarUrl: string;
            isInfluencer: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        mediaUrl: string | null;
        tickers: string;
        authorId: string;
    }>;
    deletePost(postId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        mediaUrl: string | null;
        tickers: string;
        authorId: string;
    }>;
    likePost(postId: string, userId: string): Promise<{
        liked: boolean;
    }>;
    addComment(postId: string, userId: string, content: string): Promise<{
        author: {
            id: string;
            username: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        authorId: string;
        postId: string;
    }>;
}
