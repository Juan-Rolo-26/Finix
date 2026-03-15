import { PrismaService } from '../prisma.service';
import { CreateChannelDto, UpdateChannelDto, CreateMessageDto, CreatePostDto, CreateCommentDto, CreateEventDto, CreateResourceDto } from './dto/hub.dto';
export declare class HubService {
    private prisma;
    constructor(prisma: PrismaService);
    seedChannels(): Promise<{
        seeded: number;
    }>;
    getChannels(): Promise<{
        id: string;
        slug: string;
        name: string;
        description: string | null;
        icon: string | null;
        type: string;
        order: number;
        createdAt: Date;
    }[]>;
    createChannel(userRole: string, dto: CreateChannelDto): Promise<{
        id: string;
        slug: string;
        name: string;
        description: string | null;
        icon: string | null;
        type: string;
        order: number;
        createdAt: Date;
    }>;
    updateChannel(userRole: string, channelId: string, dto: UpdateChannelDto): Promise<{
        id: string;
        slug: string;
        name: string;
        description: string | null;
        icon: string | null;
        type: string;
        order: number;
        createdAt: Date;
    }>;
    deleteChannel(userRole: string, channelId: string): Promise<{
        id: string;
        slug: string;
        name: string;
        description: string | null;
        icon: string | null;
        type: string;
        order: number;
        createdAt: Date;
    }>;
    getMessages(channelId: string, cursor?: string, limit?: number): Promise<{
        messages: ({
            author: {
                id: string;
                username: string;
                role: string;
                avatarUrl: string;
                isVerified: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            channelId: string;
            authorId: string;
            content: string;
            mediaUrl: string | null;
            isPinned: boolean;
            editedAt: Date | null;
        })[];
        hasMore: boolean;
    }>;
    sendMessage(userId: string, channelId: string, dto: CreateMessageDto): Promise<{
        author: {
            id: string;
            username: string;
            role: string;
            avatarUrl: string;
            isVerified: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        channelId: string;
        authorId: string;
        content: string;
        mediaUrl: string | null;
        isPinned: boolean;
        editedAt: Date | null;
    }>;
    pinMessage(userRole: string, messageId: string, pinned: boolean): Promise<{
        id: string;
        createdAt: Date;
        channelId: string;
        authorId: string;
        content: string;
        mediaUrl: string | null;
        isPinned: boolean;
        editedAt: Date | null;
    }>;
    deleteMessage(userId: string, userRole: string, messageId: string): Promise<{
        id: string;
        createdAt: Date;
        channelId: string;
        authorId: string;
        content: string;
        mediaUrl: string | null;
        isPinned: boolean;
        editedAt: Date | null;
    }>;
    getPosts(channelId: string, cursor?: string, limit?: number): Promise<{
        posts: ({
            _count: {
                comments: number;
            };
            author: {
                id: string;
                username: string;
                role: string;
                avatarUrl: string;
                isVerified: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            channelId: string;
            authorId: string;
            content: string;
            mediaUrl: string | null;
            isPinned: boolean;
            title: string | null;
            updatedAt: Date;
        })[];
        hasMore: boolean;
    }>;
    getAllPosts(cursor?: string, limit?: number): Promise<{
        posts: ({
            _count: {
                comments: number;
            };
            channel: {
                id: string;
                slug: string;
                name: string;
                icon: string;
            };
            author: {
                id: string;
                username: string;
                role: string;
                avatarUrl: string;
                isVerified: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            channelId: string;
            authorId: string;
            content: string;
            mediaUrl: string | null;
            isPinned: boolean;
            title: string | null;
            updatedAt: Date;
        })[];
        hasMore: boolean;
    }>;
    createPost(userId: string, userRole: string, channelId: string, dto: CreatePostDto): Promise<{
        _count: {
            comments: number;
        };
        author: {
            id: string;
            username: string;
            role: string;
            avatarUrl: string;
            isVerified: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        channelId: string;
        authorId: string;
        content: string;
        mediaUrl: string | null;
        isPinned: boolean;
        title: string | null;
        updatedAt: Date;
    }>;
    pinPost(userRole: string, postId: string, pinned: boolean): Promise<{
        id: string;
        createdAt: Date;
        channelId: string;
        authorId: string;
        content: string;
        mediaUrl: string | null;
        isPinned: boolean;
        title: string | null;
        updatedAt: Date;
    }>;
    deletePost(userId: string, userRole: string, postId: string): Promise<{
        id: string;
        createdAt: Date;
        channelId: string;
        authorId: string;
        content: string;
        mediaUrl: string | null;
        isPinned: boolean;
        title: string | null;
        updatedAt: Date;
    }>;
    getComments(postId: string): Promise<({
        author: {
            id: string;
            username: string;
            role: string;
            avatarUrl: string;
            isVerified: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        authorId: string;
        content: string;
        postId: string;
    })[]>;
    addComment(userId: string, postId: string, dto: CreateCommentDto): Promise<{
        author: {
            id: string;
            username: string;
            role: string;
            avatarUrl: string;
            isVerified: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        authorId: string;
        content: string;
        postId: string;
    }>;
    deleteComment(userId: string, userRole: string, commentId: string): Promise<{
        id: string;
        createdAt: Date;
        authorId: string;
        content: string;
        postId: string;
    }>;
    getEvents(): Promise<({
        author: {
            id: string;
            username: string;
        };
    } & {
        id: string;
        description: string | null;
        createdAt: Date;
        authorId: string;
        title: string;
        startsAt: Date;
        endsAt: Date | null;
        link: string | null;
    })[]>;
    createEvent(userId: string, userRole: string, dto: CreateEventDto): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        authorId: string;
        title: string;
        startsAt: Date;
        endsAt: Date | null;
        link: string | null;
    }>;
    deleteEvent(userRole: string, eventId: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        authorId: string;
        title: string;
        startsAt: Date;
        endsAt: Date | null;
        link: string | null;
    }>;
    getResources(): Promise<({
        author: {
            id: string;
            username: string;
        };
    } & {
        id: string;
        description: string | null;
        order: number;
        createdAt: Date;
        authorId: string;
        title: string;
        url: string;
        mediaType: string;
        thumbnailUrl: string | null;
        duration: string | null;
        category: string | null;
    })[]>;
    createResource(userId: string, userRole: string, dto: CreateResourceDto): Promise<{
        id: string;
        description: string | null;
        order: number;
        createdAt: Date;
        authorId: string;
        title: string;
        url: string;
        mediaType: string;
        thumbnailUrl: string | null;
        duration: string | null;
        category: string | null;
    }>;
    deleteResource(userRole: string, resourceId: string): Promise<{
        id: string;
        description: string | null;
        order: number;
        createdAt: Date;
        authorId: string;
        title: string;
        url: string;
        mediaType: string;
        thumbnailUrl: string | null;
        duration: string | null;
        category: string | null;
    }>;
    getAdminStats(userRole: string): Promise<{
        totalMessages: number;
        totalPosts: number;
        totalComments: number;
        totalChannels: number;
        totalResources: number;
        totalEvents: number;
        totalMembers: number;
    }>;
    getAdminMembers(userRole: string): Promise<{
        id: string;
        createdAt: Date;
        _count: {
            hubMessages: number;
            hubPosts: number;
            hubComments: number;
        };
        username: string;
        role: string;
        avatarUrl: string;
        isVerified: boolean;
    }[]>;
}
