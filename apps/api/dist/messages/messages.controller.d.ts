import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    getConversations(req: any): Promise<{
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
        createdAt: Date;
        updatedAt: Date;
        participant1Id: string;
        participant2Id: string;
    }>;
    getMessages(id: string, req: any, cursor?: string): Promise<({
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
    sendMessage(id: string, req: any, body: {
        content: string;
    }): Promise<{
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
    markAsRead(id: string, req: any): Promise<{
        success: boolean;
    }>;
    deleteConversation(id: string, req: any): Promise<{
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
