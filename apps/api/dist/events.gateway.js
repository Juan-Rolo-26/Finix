"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt = require("jsonwebtoken");
const allowed_origins_1 = require("./config/allowed-origins");
const messages_service_1 = require("./messages/messages.service");
let EventsGateway = class EventsGateway {
    constructor(messagesService) {
        this.messagesService = messagesService;
        this.onlineUsers = new Map();
    }
    handleConnection(client) {
        const token = client.handshake.auth?.token ||
            client.handshake.query?.token;
        if (token) {
            try {
                const secret = process.env.JWT_SECRET || 'secretKey';
                const payload = jwt.verify(token, secret);
                const userId = payload.sub || payload.id;
                if (userId) {
                    client.data.userId = userId;
                    client.join(`user:${userId}`);
                    if (!this.onlineUsers.has(userId)) {
                        this.onlineUsers.set(userId, new Set());
                    }
                    this.onlineUsers.get(userId).add(client.id);
                    this.server.emit('userOnline', { userId });
                }
            }
            catch {
            }
        }
    }
    handleDisconnect(client) {
        const userId = client.data.userId;
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
    isUserOnline(userId) {
        return this.onlineUsers.has(userId);
    }
    sendPriceUpdate(ticker, price) {
        this.server.emit('priceUpdate', { ticker, price });
    }
    handleJoinConversation(client, data) {
        client.join(`conv:${data.conversationId}`);
    }
    handleLeaveConversation(client, data) {
        client.leave(`conv:${data.conversationId}`);
    }
    handleTyping(client, data) {
        const userId = client.data.userId;
        client.to(`conv:${data.conversationId}`).emit('userTyping', {
            userId,
            conversationId: data.conversationId,
            isTyping: data.isTyping,
        });
    }
    async handleSendDirectMessage(client, data) {
        const senderId = client.data.userId;
        if (!senderId)
            return;
        try {
            const message = await this.messagesService.sendMessage(senderId, data.conversationId, {
                content: data.content,
                attachment: data.attachment,
            });
            await this.emitNewMessage(data.conversationId, message);
        }
        catch (err) {
            client.emit('error', { message: 'Error al enviar mensaje' });
        }
    }
    async emitConversationCreated(conversationId) {
        if (!this.server) {
            return;
        }
        const participantIds = await this.messagesService.getConversationParticipantIds(conversationId);
        for (const participantId of participantIds) {
            this.server.to(`user:${participantId}`).emit('conversationCreated', { conversationId });
        }
    }
    async emitNewMessage(conversationId, message) {
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
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinConversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveConversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleLeaveConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendDirectMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleSendDirectMessage", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: (origin, callback) => callback(null, (0, allowed_origins_1.isAllowedOrigin)(origin)),
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [messages_service_1.MessagesService])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map