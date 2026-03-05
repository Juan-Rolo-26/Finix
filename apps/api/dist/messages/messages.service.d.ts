import { PrismaService } from '../prisma.service';
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
        createdAt: Date;
        updatedAt: Date;
        participant1Id: string;
        participant2Id: string;
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
            sender: {
                id: string;
                username: string;
            };
        } & {
            id: string;
            createdAt: Date;
            content: string;
            conversationId: string;
            senderId: string;
            isRead: boolean;
        };
        updatedAt: Date;
        unreadCount: number;
    }[]>;
    getMessages(conversationId: string, userId: string, cursor?: string): Promise<({
        sender: {
            id: string;
            username: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        conversationId: string;
        senderId: string;
        isRead: boolean;
    })[]>;
    sendMessage(senderId: string, conversationId: string, content: string): Promise<{
        sender: {
            id: string;
            username: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        conversationId: string;
        senderId: string;
        isRead: boolean;
    }>;
    markAsRead(conversationId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
    deleteConversation(conversationId: string, userId: string): Promise<{
        success: boolean;
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
}
