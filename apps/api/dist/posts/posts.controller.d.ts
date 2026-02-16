import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { DemoUserService } from '../demo-user.service';
export declare class PostsController {
    private postsService;
    private demoUserService;
    constructor(postsService: PostsService, demoUserService: DemoUserService);
    private resolveUserId;
    createPost(req: any, dto: CreatePostDto): Promise<{
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
    getAllPosts(page?: string, limit?: string): Promise<{
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
    getPostById(id: string): Promise<{
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
    updatePost(req: any, id: string, dto: UpdatePostDto): Promise<{
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
    deletePost(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        mediaUrl: string | null;
        tickers: string;
        authorId: string;
    }>;
    likePost(req: any, id: string): Promise<{
        liked: boolean;
    }>;
    addComment(req: any, id: string, content: string): Promise<{
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
