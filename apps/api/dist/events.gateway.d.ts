import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages/messages.service';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly messagesService;
    server: Server;
    private onlineUsers;
    constructor(messagesService: MessagesService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    isUserOnline(userId: string): boolean;
    sendPriceUpdate(ticker: string, price: number): void;
    handleJoinConversation(client: Socket, data: {
        conversationId: string;
    }): void;
    handleLeaveConversation(client: Socket, data: {
        conversationId: string;
    }): void;
    handleTyping(client: Socket, data: {
        conversationId: string;
        isTyping: boolean;
    }): void;
    handleSendDirectMessage(client: Socket, data: {
        conversationId: string;
        content?: string;
        attachment?: {
            type: 'image' | 'post' | 'chart' | 'story';
            url?: string;
            postId?: string;
            meta?: Record<string, any>;
        } | null;
    }): Promise<void>;
    emitConversationCreated(conversationId: string): Promise<void>;
    emitNewMessage(conversationId: string, message: any): Promise<void>;
}
