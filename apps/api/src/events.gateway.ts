import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { MessagesService } from './messages/messages.service';

@WebSocketGateway({
    cors: { origin: '*' },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    /** userId -> Set of socketIds (a user can have multiple tabs open) */
    private onlineUsers = new Map<string, Set<string>>();

    constructor(private readonly messagesService: MessagesService) { }

    // ─── Connection lifecycle ────────────────────────────────────────────────

    handleConnection(client: Socket) {
        const token =
            (client.handshake.auth?.token as string) ||
            (client.handshake.query?.token as string);

        if (token) {
            try {
                const secret = process.env.JWT_SECRET || 'secretKey';
                const payload = jwt.verify(token, secret) as any;
                const userId: string = payload.sub || payload.id;
                if (userId) {
                    client.data.userId = userId;
                    client.join(`user:${userId}`);

                    if (!this.onlineUsers.has(userId)) {
                        this.onlineUsers.set(userId, new Set());
                    }
                    this.onlineUsers.get(userId)!.add(client.id);

                    // Notify others this user is online
                    this.server.emit('userOnline', { userId });
                }
            } catch {
                // Invalid token – allow connection but without userId
            }
        }
    }

    handleDisconnect(client: Socket) {
        const userId: string | undefined = client.data.userId;
        if (userId) {
            const sockets = this.onlineUsers.get(userId);
            if (sockets) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.onlineUsers.delete(userId);
                    this.server.emit('userOffline', { userId });
                }
            }
        }
    }

    isUserOnline(userId: string): boolean {
        return this.onlineUsers.has(userId);
    }

    // ─── Legacy price update (keep compatibility) ────────────────────────────

    sendPriceUpdate(ticker: string, price: number) {
        this.server.emit('priceUpdate', { ticker, price });
    }

    // ─── Conversation rooms ──────────────────────────────────────────────────

    @SubscribeMessage('joinConversation')
    handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        client.join(`conv:${data.conversationId}`);
    }

    @SubscribeMessage('leaveConversation')
    handleLeaveConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        client.leave(`conv:${data.conversationId}`);
    }

    // ─── Typing indicator ────────────────────────────────────────────────────

    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string; isTyping: boolean },
    ) {
        const userId: string | undefined = client.data.userId;
        client.to(`conv:${data.conversationId}`).emit('userTyping', {
            userId,
            conversationId: data.conversationId,
            isTyping: data.isTyping,
        });
    }

    // ─── Send DM via socket ──────────────────────────────────────────────────

    @SubscribeMessage('sendDirectMessage')
    async handleSendDirectMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: {
            conversationId: string;
            content?: string;
            attachment?: {
                type: 'image' | 'post' | 'chart' | 'story';
                url?: string;
                postId?: string;
                meta?: Record<string, any>;
            } | null;
        },
    ) {
        const senderId: string | undefined = client.data.userId;
        if (!senderId) return;

        try {
            const message = await this.messagesService.sendMessage(
                senderId,
                data.conversationId,
                {
                    content: data.content,
                    attachment: data.attachment,
                },
            );

            // Broadcast to everyone in the conversation room (including sender)
            await this.emitNewMessage(data.conversationId, message);
        } catch (err) {
            client.emit('error', { message: 'Error al enviar mensaje' });
        }
    }

    // ─── Emit helpers (called from REST controller) ──────────────────────────

    async emitConversationCreated(conversationId: string) {
        if (!this.server) {
            return;
        }

        const participantIds = await this.messagesService.getConversationParticipantIds(conversationId);
        for (const participantId of participantIds) {
            this.server.to(`user:${participantId}`).emit('conversationCreated', { conversationId });
        }
    }

    async emitNewMessage(conversationId: string, message: any) {
        if (!this.server) {
            return;
        }

        const participantIds = await this.messagesService.getConversationParticipantIds(conversationId);
        this.server.to(`conv:${conversationId}`).emit('newDirectMessage', message);
        this.server.to(`conv:${conversationId}`).emit('conversationUpdated', {
            conversationId,
            lastMessage: message,
        });

        for (const participantId of participantIds) {
            this.server.to(`user:${participantId}`).emit('conversationUpdated', {
                conversationId,
                lastMessage: message,
            });
        }
    }
}
