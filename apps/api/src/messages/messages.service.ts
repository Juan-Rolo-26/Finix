import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) { }

    /** Returns or creates a conversation between two users */
    async getOrCreateConversation(userId: string, otherUserId: string) {
        // Consistent ordering to avoid duplicate conversations
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

    /** Get all conversations for a user, ordered by recent activity */
    async getConversations(userId: string) {
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

        const result = await Promise.all(
            conversations.map(async (conv) => {
                const otherUser =
                    conv.participant1Id === userId ? conv.participant2 : conv.participant1;

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
            }),
        );

        return result;
    }

    /** Get paginated messages for a conversation */
    async getMessages(conversationId: string, userId: string, cursor?: string) {
        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ participant1Id: userId }, { participant2Id: userId }],
            },
        });
        if (!conv) throw new ForbiddenException('No tienes acceso a esta conversación');

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

    /** Save a message to the database */
    async sendMessage(senderId: string, conversationId: string, content: string) {
        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ participant1Id: senderId }, { participant2Id: senderId }],
            },
        });
        if (!conv) throw new ForbiddenException('No tienes acceso a esta conversación');

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

    /** Mark all unread messages in a conversation as read */
    async markAsRead(conversationId: string, userId: string) {
        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ participant1Id: userId }, { participant2Id: userId }],
            },
        });
        if (!conv) throw new ForbiddenException('No tienes acceso a esta conversación');

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

    /** Total unread messages count across all conversations */
    async getUnreadCount(userId: string) {
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

    /** Delete a conversation and all its messages */
    async deleteConversation(conversationId: string, userId: string) {
        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ participant1Id: userId }, { participant2Id: userId }],
            },
        });
        if (!conv) throw new NotFoundException('Conversación no encontrada');

        await this.prisma.conversation.delete({ where: { id: conversationId } });
        return { success: true };
    }

    /** Search users to start a conversation with */
    async searchUsers(query: string, userId: string) {
        if (!query || query.trim().length < 1) return [];

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

    /** Get the other participant of a conversation */
    async getOtherParticipant(conversationId: string, userId: string) {
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
        if (!conv) throw new ForbiddenException('No tienes acceso');

        return conv.participant1Id === userId ? conv.participant2 : conv.participant1;
    }
}
