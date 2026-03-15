import { HubService } from './hub.service';
import { CreateChannelDto, UpdateChannelDto, CreateMessageDto, CreatePostDto, CreateCommentDto, CreateEventDto, CreateResourceDto, PinDto } from './dto/hub.dto';
export declare class HubController {
    private readonly hubService;
    constructor(hubService: HubService);
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
    createChannel(req: any, dto: CreateChannelDto): Promise<{
        id: string;
        slug: string;
        name: string;
        description: string | null;
        icon: string | null;
        type: string;
        order: number;
        createdAt: Date;
    }>;
    updateChannel(req: any, id: string, dto: UpdateChannelDto): Promise<{
        id: string;
        slug: string;
        name: string;
        description: string | null;
        icon: string | null;
        type: string;
        order: number;
        createdAt: Date;
    }>;
    deleteChannel(req: any, id: string): Promise<{
        id: string;
        slug: string;
        name: string;
        description: string | null;
        icon: string | null;
        type: string;
        order: number;
        createdAt: Date;
    }>;
    seedChannels(): Promise<{
        seeded: number;
    }>;
    getMessages(id: string, cursor?: string): Promise<{
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
    sendMessage(req: any, id: string, dto: CreateMessageDto): Promise<{
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
    pinMessage(req: any, id: string, dto: PinDto): Promise<{
        id: string;
        createdAt: Date;
        channelId: string;
        authorId: string;
        content: string;
        mediaUrl: string | null;
        isPinned: boolean;
        editedAt: Date | null;
    }>;
    deleteMessage(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        channelId: string;
        authorId: string;
        content: string;
        mediaUrl: string | null;
        isPinned: boolean;
        editedAt: Date | null;
    }>;
    getAllPosts(cursor?: string): Promise<{
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
    getPosts(id: string, cursor?: string): Promise<{
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
    createPost(req: any, id: string, dto: CreatePostDto): Promise<{
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
    pinPost(req: any, id: string, dto: PinDto): Promise<{
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
    deletePost(req: any, id: string): Promise<{
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
    getComments(id: string): Promise<({
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
    addComment(req: any, id: string, dto: CreateCommentDto): Promise<{
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
    deleteComment(req: any, id: string): Promise<{
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
    createEvent(req: any, dto: CreateEventDto): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        authorId: string;
        title: string;
        startsAt: Date;
        endsAt: Date | null;
        link: string | null;
    }>;
    deleteEvent(req: any, id: string): Promise<{
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
    createResource(req: any, dto: CreateResourceDto): Promise<{
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
    deleteResource(req: any, id: string): Promise<{
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
    getAdminStats(req: any): Promise<{
        totalMessages: number;
        totalPosts: number;
        totalComments: number;
        totalChannels: number;
        totalResources: number;
        totalEvents: number;
        totalMembers: number;
    }>;
    getAdminMembers(req: any): Promise<{
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
