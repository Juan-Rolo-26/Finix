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
import { isAllowedOrigin } from './config/allowed-origins';
import { MessagesService } from './messages/messages.service';
import { PrismaService } from './prisma.service';

@WebSocketGateway({
    cors: {
        origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
        credentials: true,
    },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    /** userId -> Set of socketIds (a user can have multiple tabs open) */
    private onlineUsers = new Map<string, Set<string>>();

    constructor(
        private readonly messagesService: MessagesService,
        private readonly prisma: PrismaService,
    ) { }

    private async authenticatedUser(client: Socket): Promise<string | null> {
        try {
            const token = client.data.accessToken;
            if (!token || !process.env.JWT_SECRET) throw new Error('Sesión requerida');
            const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }) as any;
            if (payload.iss !== 'finix-api' || !payload.sub) throw new Error('Token inválido');
            const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, status: true } });
            if (!user || ['BANNED', 'SUSPENDED'].includes(user.status)) throw new Error('Cuenta no disponible');
            if (payload.sid) {
                const session = await this.prisma.userSession.findUnique({ where: { id: payload.sid }, select: { userId: true, revokedAt: true, expiresAt: true } });
                if (!session || session.userId !== user.id || session.revokedAt || (session.expiresAt && session.expiresAt < new Date())) throw new Error('Sesión cerrada');
            }
            return user.id;
        } catch {
            client.disconnect(true);
            return null;
        }
    }

    disconnectUserSessions(userId: string) {
        this.server?.in(`user:${userId}`).disconnectSockets(true);
    }

    // ─── Connection lifecycle ────────────────────────────────────────────────

    async handleConnection(client: Socket) {
        const token =
            (client.handshake.auth?.token as string) ||
            (client.handshake.query?.token as string);

        if (token) {
            client.data.accessToken = token;
            const userId = await this.authenticatedUser(client);
            if (!client.connected) return;
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
    async handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        const userId = await this.authenticatedUser(client);
        if (!userId || !data?.conversationId) return;
        const participantIds = await this.messagesService.getConversationParticipantIds(data.conversationId);
        if (participantIds.includes(userId)) {
            client.join(`conv:${data.conversationId}`);
        }
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
    async handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string; isTyping: boolean },
    ) {
        const userId = await this.authenticatedUser(client);
        if (!userId || !data?.conversationId) return;
        const participants = await this.messagesService.getConversationParticipantIds(data.conversationId);
        if (!participants.includes(userId)) return;
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
                type: 'image' | 'post' | 'chart';
                url?: string;
                postId?: string;
                meta?: Record<string, any>;
            } | null;
        },
    ) {
        const senderId = await this.authenticatedUser(client);
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

    async emitNewMessage(conversationId: string, message: any, participantIds?: string[]) {
        if (!this.server) {
            return;
        }

        const participants = participantIds || await this.messagesService.getConversationParticipantIds(conversationId);
        
        this.server.to(`conv:${conversationId}`).emit('newDirectMessage', message);
        this.server.to(`conv:${conversationId}`).emit('conversationUpdated', {
            conversationId,
            lastMessage: message,
        });

        for (const participantId of participants) {
            this.server.to(`user:${participantId}`).emit('conversationUpdated', {
                conversationId,
                lastMessage: message,
            });
        }
    }

    async emitMessageUpdated(conversationId: string, message: any, participantIds?: string[]) {
        if (!this.server) {
            return;
        }

        const participants = participantIds || await this.messagesService.getConversationParticipantIds(conversationId);
        this.server.to(`conv:${conversationId}`).emit('messageUpdated', message);

        for (const participantId of participants) {
            this.server.to(`user:${participantId}`).emit('messageUpdated', message);
        }
    }
}
