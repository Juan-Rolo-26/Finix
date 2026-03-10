import { PrismaService } from '../prisma.service';
type MessageAttachmentType = 'image' | 'post' | 'chart' | 'story';
type MessageAttachmentInput = {
    type: MessageAttachmentType;
    url?: string;
    postId?: string;
    meta?: Record<string, any> | null;
} | null | undefined;
export declare class MessagesService {
    private prisma;
    constructor(prisma: PrismaService);
    getOrCreateConversation(userId: string, otherUserId: string): Promise<{
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
    getConversations(userId: string): Promise<{
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
    getMessages(conversationId: string, userId: string, cursor?: string): Promise<{
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
    sendMessage(senderId: string, conversationId: string, payload: {
        content?: string;
        attachment?: MessageAttachmentInput;
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
    markAsRead(conversationId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
    searchUsers(query: string, userId: string): Promise<{
        id: string;
        username: string;
        avatarUrl: string;
        isVerified: boolean;
        title: string;
    }[]>;
    getOtherParticipant(conversationId: string, userId: string): Promise<{
        id: string;
        username: string;
        avatarUrl: string;
        isVerified: boolean;
    }>;
    private serializeMessage;
    private parseAttachmentData;
    private stringifyMeta;
    private prepareAttachment;
}
export {};
