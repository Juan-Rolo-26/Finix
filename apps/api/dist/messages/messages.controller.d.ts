import { EventsGateway } from '../events.gateway';
import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    private readonly eventsGateway;
    constructor(messagesService: MessagesService, eventsGateway: EventsGateway);
    getConversations(req: any): Promise<{
        id: string;
        otherUser: {
            id: string;
            username: string;
            avatarUrl: string;
            isVerified: boolean;
        };
        lastMessage: {
            attachmentMeta: any;
            sender: {
                id: string;
                username: string;
                avatarUrl: string;
                isVerified: boolean;
            };
            sharedPost: {
                id: string;
                createdAt: Date;
                content: string;
                type: string;
                assetSymbol: string;
                analysisType: string;
                riskLevel: string;
                author: {
                    id: string;
                    username: string;
                    avatarUrl: string;
                    isVerified: boolean;
                };
                media: {
                    id: string;
                    createdAt: Date;
                    postId: string;
                    url: string;
                    mediaType: string;
                    order: number;
                }[];
            };
            id: string;
            createdAt: Date;
            conversationId: string;
            senderId: string;
            content: string;
            attachmentType: string | null;
            attachmentUrl: string | null;
            sharedPostId: string | null;
            isRead: boolean;
        };
        updatedAt: Date;
        unreadCount: number;
    }[]>;
    createOrGetConversation(req: any, body: {
        userId: string;
    }): Promise<{
        participant1: {
            id: string;
            username: string;
            avatarUrl: string;
            isVerified: boolean;
        };
        participant2: {
            id: string;
            username: string;
            avatarUrl: string;
            isVerified: boolean;
        };
    } & {
        id: string;
        participant1Id: string;
        participant2Id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMessages(id: string, req: any, cursor?: string): Promise<{
        attachmentMeta: any;
        sender: {
            id: string;
            username: string;
            avatarUrl: string;
            isVerified: boolean;
        };
        sharedPost: {
            id: string;
            createdAt: Date;
            content: string;
            type: string;
            assetSymbol: string;
            analysisType: string;
            riskLevel: string;
            author: {
                id: string;
                username: string;
                avatarUrl: string;
                isVerified: boolean;
            };
            media: {
                id: string;
                createdAt: Date;
                postId: string;
                url: string;
                mediaType: string;
                order: number;
            }[];
        };
        id: string;
        createdAt: Date;
        conversationId: string;
        senderId: string;
        content: string;
        attachmentType: string | null;
        attachmentUrl: string | null;
        sharedPostId: string | null;
        isRead: boolean;
    }[]>;
    sendMessage(id: string, req: any, body: {
        content?: string;
        attachment?: {
            type: 'image' | 'post' | 'chart' | 'story';
            url?: string;
            postId?: string;
            meta?: Record<string, any>;
        } | null;
    }): Promise<{
        attachmentMeta: any;
        sender: {
            id: string;
            username: string;
            avatarUrl: string;
            isVerified: boolean;
        };
        sharedPost: {
            id: string;
            createdAt: Date;
            content: string;
            type: string;
            assetSymbol: string;
            analysisType: string;
            riskLevel: string;
            author: {
                id: string;
                username: string;
                avatarUrl: string;
                isVerified: boolean;
            };
            media: {
                id: string;
                createdAt: Date;
                postId: string;
                url: string;
                mediaType: string;
                order: number;
            }[];
        };
        id: string;
        createdAt: Date;
        conversationId: string;
        senderId: string;
        content: string;
        attachmentType: string | null;
        attachmentUrl: string | null;
        sharedPostId: string | null;
        isRead: boolean;
    }>;
    markAsRead(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    searchUsers(q: string, req: any): Promise<{
        id: string;
        username: string;
        avatarUrl: string;
        isVerified: boolean;
        title: string;
    }[]>;
}
