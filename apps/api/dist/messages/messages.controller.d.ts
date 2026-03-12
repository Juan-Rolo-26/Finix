import { EventsGateway } from '../events.gateway';
import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    private readonly eventsGateway;
    constructor(messagesService: MessagesService, eventsGateway: EventsGateway);
    getConversations(req: any): Promise<{
        id: string;
        isGroup: boolean;
        title: string;
        otherUser: {
            id: string;
            username: string;
            avatarUrl: string;
            isVerified: boolean;
        };
        participants: {
            id: string;
            username: string;
            avatarUrl: string;
            isVerified: boolean;
        }[];
        participantCount: number;
        lastMessage: {
            isRead: boolean;
            attachmentMeta: any;
            sender: {
                id: string;
                username: string;
                avatarUrl: string;
                isVerified: boolean;
            };
            sharedPost: {
                id: string;
                type: string;
                content: string;
                createdAt: Date;
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
                    url: string;
                    mediaType: string;
                    order: number;
                    postId: string;
                }[];
            };
            id: string;
            content: string;
            createdAt: Date;
            conversationId: string;
            senderId: string;
            attachmentType: string | null;
            attachmentUrl: string | null;
            sharedPostId: string | null;
        };
        updatedAt: Date;
        unreadCount: number;
    }[]>;
    createOrGetConversation(req: any, body: {
        userId?: string;
        userIds?: string[];
        title?: string;
    }): Promise<{
        id: string;
        isGroup: boolean;
        title: string;
        otherUser: {
            id: string;
            username: string;
            avatarUrl: string;
            isVerified: boolean;
        };
        participants: {
            id: string;
            username: string;
            avatarUrl: string;
            isVerified: boolean;
        }[];
        participantCount: number;
        lastMessage: {
            isRead: boolean;
            attachmentMeta: any;
            sender: {
                id: string;
                username: string;
                avatarUrl: string;
                isVerified: boolean;
            };
            sharedPost: {
                id: string;
                type: string;
                content: string;
                createdAt: Date;
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
                    url: string;
                    mediaType: string;
                    order: number;
                    postId: string;
                }[];
            };
            id: string;
            content: string;
            createdAt: Date;
            conversationId: string;
            senderId: string;
            attachmentType: string | null;
            attachmentUrl: string | null;
            sharedPostId: string | null;
        };
        updatedAt: Date;
        unreadCount: number;
    }>;
    getMessages(id: string, req: any, cursor?: string): Promise<{
        isRead: boolean;
        attachmentMeta: any;
        sender: {
            id: string;
            username: string;
            avatarUrl: string;
            isVerified: boolean;
        };
        sharedPost: {
            id: string;
            type: string;
            content: string;
            createdAt: Date;
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
                url: string;
                mediaType: string;
                order: number;
                postId: string;
            }[];
        };
        id: string;
        content: string;
        createdAt: Date;
        conversationId: string;
        senderId: string;
        attachmentType: string | null;
        attachmentUrl: string | null;
        sharedPostId: string | null;
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
        isRead: boolean;
        attachmentMeta: any;
        sender: {
            id: string;
            username: string;
            avatarUrl: string;
            isVerified: boolean;
        };
        sharedPost: {
            id: string;
            type: string;
            content: string;
            createdAt: Date;
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
                url: string;
                mediaType: string;
                order: number;
                postId: string;
            }[];
        };
        id: string;
        content: string;
        createdAt: Date;
        conversationId: string;
        senderId: string;
        attachmentType: string | null;
        attachmentUrl: string | null;
        sharedPostId: string | null;
    }>;
    markAsRead(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    searchUsers(q: string, req: any): Promise<{
        title: string;
        id: string;
        username: string;
        avatarUrl: string;
        isVerified: boolean;
    }[]>;
}
