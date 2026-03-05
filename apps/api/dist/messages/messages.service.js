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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let MessagesService = class MessagesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateConversation(userId, otherUserId) {
        const [p1, p2] = [userId, otherUserId].sort();
        let conversation = await this.prisma.conversation.findUnique({
            where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
            include: {
                participant1: { select: { id: true, username: true, avatarUrl: true, isVerified: true } },
                participant2: { select: { id: true, username: true, avatarUrl: true, isVerified: true } },
            },
        });
        if (!conversation) {
            conversation = await this.prisma.conversation.create({
                data: { participant1Id: p1, participant2Id: p2 },
                include: {
                    participant1: { select: { id: true, username: true, avatarUrl: true, isVerified: true } },
                    participant2: { select: { id: true, username: true, avatarUrl: true, isVerified: true } },
                },
            });
        }
        return conversation;
    }
    async getConversations(userId) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                OR: [{ participant1Id: userId }, { participant2Id: userId }],
            },
            include: {
                participant1: { select: { id: true, username: true, avatarUrl: true, isVerified: true } },
                participant2: { select: { id: true, username: true, avatarUrl: true, isVerified: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: { select: { id: true, username: true } },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        const result = await Promise.all(conversations.map(async (conv) => {
            const otherUser = conv.participant1Id === userId ? conv.participant2 : conv.participant1;
            const unreadCount = await this.prisma.directMessage.count({
                where: {
                    conversationId: conv.id,
                    senderId: { not: userId },
                    isRead: false,
                },
            });
            return {
                id: conv.id,
                otherUser,
                lastMessage: conv.messages[0] || null,
                updatedAt: conv.updatedAt,
                unreadCount,
            };
        }));
        return result;
    }
    async getMessages(conversationId, userId, cursor) {
        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ participant1Id: userId }, { participant2Id: userId }],
            },
        });
        if (!conv)
            throw new common_1.ForbiddenException('No tienes acceso a esta conversación');
        const messages = await this.prisma.directMessage.findMany({
            where: { conversationId },
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'asc' },
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            take: 50,
        });
        return messages;
    }
    async sendMessage(senderId, conversationId, content) {
        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ participant1Id: senderId }, { participant2Id: senderId }],
            },
        });
        if (!conv)
            throw new common_1.ForbiddenException('No tienes acceso a esta conversación');
        const message = await this.prisma.directMessage.create({
            data: { conversationId, senderId, content },
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true } },
            },
        });
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });
        return message;
    }
    async markAsRead(conversationId, userId) {
        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ participant1Id: userId }, { participant2Id: userId }],
            },
        });
        if (!conv)
            throw new common_1.ForbiddenException('No tienes acceso a esta conversación');
        await this.prisma.directMessage.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                isRead: false,
            },
            data: { isRead: true },
        });
        return { success: true };
    }
    async getUnreadCount(userId) {
        const conversations = await this.prisma.conversation.findMany({
            where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
            select: { id: true },
        });
        const count = await this.prisma.directMessage.count({
            where: {
                conversationId: { in: conversations.map((c) => c.id) },
                senderId: { not: userId },
                isRead: false,
            },
        });
        return { count };
    }
    async deleteConversation(conversationId, userId) {
        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ participant1Id: userId }, { participant2Id: userId }],
            },
        });
        if (!conv)
            throw new common_1.NotFoundException('Conversación no encontrada');
        await this.prisma.conversation.delete({ where: { id: conversationId } });
        return { success: true };
    }
    async searchUsers(query, userId) {
        if (!query || query.trim().length < 1)
            return [];
        return this.prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: userId } },
                    { username: { contains: query } },
                ],
            },
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                isVerified: true,
                title: true,
            },
            take: 10,
        });
    }
    async getOtherParticipant(conversationId, userId) {
        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ participant1Id: userId }, { participant2Id: userId }],
            },
            include: {
                participant1: { select: { id: true, username: true, avatarUrl: true, isVerified: true } },
                participant2: { select: { id: true, username: true, avatarUrl: true, isVerified: true } },
            },
        });
        if (!conv)
            throw new common_1.ForbiddenException('No tienes acceso');
        return conv.participant1Id === userId ? conv.participant2 : conv.participant1;
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map