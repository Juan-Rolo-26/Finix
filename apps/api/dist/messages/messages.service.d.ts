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
    createConversation(userId: string, payload: {
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
                content: string;
                type: string;
                assetSymbol: string;
                analysisType: string;
                riskLevel: string;
                createdAt: Date;
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
    getOrCreateConversation(userId: string, otherUserId: string): Promise<{
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
                content: string;
                type: string;
                assetSymbol: string;
                analysisType: string;
                riskLevel: string;
                createdAt: Date;
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
    createGroupConversation(userId: string, participantIds: string[], title?: string): Promise<{
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
                content: string;
                type: string;
                assetSymbol: string;
                analysisType: string;
                riskLevel: string;
                createdAt: Date;
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
    getConversations(userId: string): Promise<{
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
                content: string;
                type: string;
                assetSymbol: string;
                analysisType: string;
                riskLevel: string;
                createdAt: Date;
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
    getMessages(conversationId: string, userId: string, cursor?: string): Promise<{
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
            content: string;
            type: string;
            assetSymbol: string;
            analysisType: string;
            riskLevel: string;
            createdAt: Date;
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
    sendMessage(senderId: string, conversationId: string, payload: {
        content?: string;
        attachment?: MessageAttachmentInput;
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
            content: string;
            type: string;
            assetSymbol: string;
            analysisType: string;
            riskLevel: string;
            createdAt: Date;
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
    getConversationParticipantIds(conversationId: string): Promise<string[]>;
    getOtherParticipant(conversationId: string, userId: string): Promise<{
        id: string;
        username: string;
        avatarUrl: string;
        isVerified: boolean;
    }>;
    private getConversationForMember;
    private countUnreadMessages;
    private normalizeParticipantIds;
    private serializeConversationSummary;
    private serializeMessage;
    private parseAttachmentData;
    private stringifyMeta;
    private prepareAttachment;
}
export {};
