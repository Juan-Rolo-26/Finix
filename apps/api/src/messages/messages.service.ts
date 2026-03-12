import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type MessageAttachmentType = 'image' | 'post' | 'chart' | 'story';
type MessageAttachmentInput =
    | {
        type: MessageAttachmentType;
        url?: string;
        postId?: string;
        meta?: Record<string, any> | null;
    }
    | null
    | undefined;

const USER_SELECT = {
    id: true,
    username: true,
    avatarUrl: true,
    isVerified: true,
} satisfies Prisma.UserSelect;

const SHARED_POST_SELECT = {
    id: true,
    content: true,
    type: true,
    assetSymbol: true,
    analysisType: true,
    riskLevel: true,
    createdAt: true,
    author: { select: USER_SELECT },
    media: {
        orderBy: { order: 'asc' as const },
    },
} satisfies Prisma.PostSelect;

const MESSAGE_INCLUDE = Prisma.validator<Prisma.DirectMessageInclude>()({
    sender: { select: USER_SELECT },
    sharedPost: { select: SHARED_POST_SELECT },
});

const CONVERSATION_INCLUDE = Prisma.validator<Prisma.ConversationInclude>()({
    participants: {
        orderBy: { joinedAt: 'asc' },
        include: {
            user: { select: USER_SELECT },
        },
    },
    messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: MESSAGE_INCLUDE,
    },
});

const CONVERSATION_ACCESS_INCLUDE = Prisma.validator<Prisma.ConversationInclude>()({
    participants: {
        orderBy: { joinedAt: 'asc' },
        include: {
            user: { select: USER_SELECT },
        },
    },
});

type MessageRecord = Prisma.DirectMessageGetPayload<{ include: typeof MESSAGE_INCLUDE }>;
type ConversationRecord = Prisma.ConversationGetPayload<{ include: typeof CONVERSATION_INCLUDE }>;
type ConversationAccessRecord = Prisma.ConversationGetPayload<{ include: typeof CONVERSATION_ACCESS_INCLUDE }>;
type ParticipantRecord = ConversationAccessRecord['participants'][number];

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) { }

    async createConversation(
        userId: string,
        payload: {
            userId?: string;
            userIds?: string[];
            title?: string;
        },
    ) {
        const requestedIds = [
            ...(Array.isArray(payload.userIds) ? payload.userIds : []),
            ...(payload.userId ? [payload.userId] : []),
        ];
        const participantIds = this.normalizeParticipantIds(userId, requestedIds);

        if (participantIds.length === 0) {
            throw new BadRequestException('Debes seleccionar al menos un usuario');
        }

        if (participantIds.length === 1) {
            return this.getOrCreateConversation(userId, participantIds[0]);
        }

        return this.createGroupConversation(userId, participantIds, payload.title);
    }

    /** Returns or creates a conversation between two users */
    async getOrCreateConversation(userId: string, otherUserId: string) {
        if (!otherUserId || otherUserId === userId) {
            throw new BadRequestException('Debes seleccionar otro usuario');
        }

        const [p1, p2] = [userId, otherUserId].sort();

        let conversation = await this.prisma.conversation.findUnique({
            where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
            include: CONVERSATION_INCLUDE,
        });

        if (!conversation) {
            conversation = await this.prisma.conversation.create({
                data: {
                    participant1Id: p1,
                    participant2Id: p2,
                    isGroup: false,
                    participants: {
                        create: [
                            { userId: p1, lastReadAt: new Date() },
                            { userId: p2, lastReadAt: new Date() },
                        ],
                    },
                },
                include: CONVERSATION_INCLUDE,
            });
        }

        return this.serializeConversationSummary(conversation, userId, 0);
    }

    async createGroupConversation(userId: string, participantIds: string[], title?: string) {
        const normalizedIds = this.normalizeParticipantIds(userId, participantIds);
        if (normalizedIds.length < 2) {
            throw new BadRequestException('Un grupo necesita al menos dos usuarios adicionales');
        }

        const members = [userId, ...normalizedIds];
        const distinctMembers = Array.from(new Set(members));
        const users = await this.prisma.user.findMany({
            where: { id: { in: distinctMembers } },
            select: { id: true },
        });

        if (users.length !== distinctMembers.length) {
            throw new NotFoundException('Uno o más usuarios no existen');
        }

        const safeTitle = typeof title === 'string' ? title.trim().slice(0, 80) : '';

        const conversation = await this.prisma.conversation.create({
            data: {
                isGroup: true,
                title: safeTitle || null,
                createdById: userId,
                participants: {
                    create: distinctMembers.map((memberId) => ({
                        userId: memberId,
                        lastReadAt: new Date(),
                    })),
                },
            },
            include: CONVERSATION_INCLUDE,
        });

        return this.serializeConversationSummary(conversation, userId, 0);
    }

    /** Get all conversations for a user, ordered by recent activity */
    async getConversations(userId: string) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId },
                },
            },
            include: CONVERSATION_INCLUDE,
            orderBy: { updatedAt: 'desc' },
        });

        const result = await Promise.all(
            conversations.map(async (conv) => {
                const currentParticipant = conv.participants.find((participant) => participant.userId === userId) ?? null;
                const unreadCount = await this.countUnreadMessages(conv.id, userId, currentParticipant?.lastReadAt ?? null);
                return this.serializeConversationSummary(conv, userId, unreadCount);
            }),
        );

        return result;
    }

    /** Get paginated messages for a conversation */
    async getMessages(conversationId: string, userId: string, cursor?: string) {
        const conv = await this.getConversationForMember(conversationId, userId);

        const messages = await this.prisma.directMessage.findMany({
            where: { conversationId },
            include: MESSAGE_INCLUDE,
            orderBy: { createdAt: 'asc' },
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            take: 50,
        });

        return messages.map((message) => this.serializeMessage(message, conv));
    }

    /** Save a message to the database */
    async sendMessage(
        senderId: string,
        conversationId: string,
        payload: {
            content?: string;
            attachment?: MessageAttachmentInput;
        },
    ) {
        const conv = await this.getConversationForMember(conversationId, senderId);
        const content = typeof payload.content === 'string' ? payload.content.trim() : '';
        const attachment = await this.prepareAttachment(payload.attachment);

        if (!content && !attachment) {
            throw new BadRequestException('El mensaje debe tener texto o un adjunto');
        }

        const message = await this.prisma.$transaction(async (tx) => {
            const createdMessage = await tx.directMessage.create({
                data: {
                    conversationId,
                    senderId,
                    content,
                    attachmentType: attachment?.attachmentType ?? null,
                    attachmentUrl: attachment?.attachmentUrl ?? null,
                    attachmentData: attachment?.attachmentData ?? null,
                    sharedPostId: attachment?.sharedPostId ?? null,
                },
                include: MESSAGE_INCLUDE,
            });

            await tx.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() },
            });

            await tx.conversationParticipant.update({
                where: {
                    conversationId_userId: {
                        conversationId,
                        userId: senderId,
                    },
                },
                data: { lastReadAt: createdMessage.createdAt },
            });

            return createdMessage;
        });

        const conversationContext: ConversationAccessRecord = {
            ...conv,
            participants: conv.participants.map((participant) => (
                participant.userId === senderId
                    ? { ...participant, lastReadAt: message.createdAt }
                    : participant
            )),
        };

        return this.serializeMessage(message, conversationContext);
    }

    /** Mark all unread messages in a conversation as read */
    async markAsRead(conversationId: string, userId: string) {
        const conv = await this.getConversationForMember(conversationId, userId);
        const now = new Date();

        await this.prisma.$transaction(async (tx) => {
            await tx.conversationParticipant.update({
                where: {
                    conversationId_userId: {
                        conversationId,
                        userId,
                    },
                },
                data: { lastReadAt: now },
            });

            if (!conv.isGroup) {
                await tx.directMessage.updateMany({
                    where: {
                        conversationId,
                        senderId: { not: userId },
                        isRead: false,
                    },
                    data: { isRead: true },
                });
            }
        });

        return { success: true };
    }

    /** Total unread messages count across all conversations */
    async getUnreadCount(userId: string) {
        const memberships = await this.prisma.conversationParticipant.findMany({
            where: { userId },
            select: {
                conversationId: true,
                lastReadAt: true,
            },
        });

        const counts = await Promise.all(
            memberships.map((membership) => (
                this.countUnreadMessages(membership.conversationId, userId, membership.lastReadAt)
            )),
        );

        return { count: counts.reduce((sum, value) => sum + value, 0) };
    }

    /** Search users to start a conversation with */
    async searchUsers(query: string, userId: string) {
        if (!query || query.trim().length < 1) return [];

        return this.prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: userId } },
                    {
                        username: {
                            contains: query.trim(),
                            mode: 'insensitive',
                        },
                    },
                ],
            },
            select: {
                ...USER_SELECT,
                title: true,
            },
            take: 10,
        });
    }

    async getConversationParticipantIds(conversationId: string) {
        const participants = await this.prisma.conversationParticipant.findMany({
            where: { conversationId },
            select: { userId: true },
        });

        return participants.map((participant) => participant.userId);
    }

    /** Get the other participant of a direct conversation */
    async getOtherParticipant(conversationId: string, userId: string) {
        const conv = await this.getConversationForMember(conversationId, userId);
        if (conv.isGroup) {
            return null;
        }

        return conv.participants.find((participant) => participant.userId !== userId)?.user ?? null;
    }

    private async getConversationForMember(conversationId: string, userId: string) {
        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                participants: {
                    some: { userId },
                },
            },
            include: CONVERSATION_ACCESS_INCLUDE,
        });

        if (!conv) {
            throw new ForbiddenException('No tienes acceso a esta conversación');
        }

        return conv;
    }

    private async countUnreadMessages(conversationId: string, userId: string, lastReadAt: Date | null) {
        return this.prisma.directMessage.count({
            where: {
                conversationId,
                senderId: { not: userId },
                ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
            },
        });
    }

    private normalizeParticipantIds(userId: string, ids: string[]) {
        return Array.from(new Set(ids.map((id) => id?.trim()).filter(Boolean))).filter((id) => id !== userId);
    }

    private serializeConversationSummary(
        conversation: ConversationRecord | ConversationAccessRecord,
        userId: string,
        unreadCount: number,
    ) {
        const participants = conversation.participants.map((participant) => participant.user);
        const otherUser = conversation.isGroup
            ? null
            : participants.find((participant) => participant.id !== userId) ?? participants[0] ?? null;
        const visibleMembers = participants.filter((participant) => participant.id !== userId);
        const title = conversation.isGroup
            ? conversation.title?.trim() || visibleMembers.map((participant) => participant.username).join(', ') || 'Grupo sin nombre'
            : otherUser?.username || 'Conversación';
        const lastMessageRecord = 'messages' in conversation ? conversation.messages[0] ?? null : null;

        return {
            id: conversation.id,
            isGroup: conversation.isGroup,
            title,
            otherUser,
            participants,
            participantCount: participants.length,
            lastMessage: lastMessageRecord ? this.serializeMessage(lastMessageRecord, conversation) : null,
            updatedAt: conversation.updatedAt,
            unreadCount,
        };
    }

    private serializeMessage(message: MessageRecord, conversation?: ConversationAccessRecord | ConversationRecord) {
        const { attachmentData, isRead, ...rest } = message;
        let resolvedIsRead = isRead;

        if (conversation?.isGroup) {
            const otherParticipants = conversation.participants.filter((participant) => participant.userId !== message.senderId);
            resolvedIsRead = otherParticipants.length > 0 && otherParticipants.every((participant) => (
                participant.lastReadAt ? participant.lastReadAt >= message.createdAt : false
            ));
        }

        return {
            ...rest,
            isRead: resolvedIsRead,
            attachmentMeta: this.parseAttachmentData(attachmentData),
        };
    }

    private parseAttachmentData(value: string | null) {
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    private stringifyMeta(value: Record<string, any> | null) {
        if (!value) return null;
        const entries = Object.entries(value).filter(([, next]) => next !== undefined && next !== null && next !== '');
        if (entries.length === 0) return null;
        return JSON.stringify(Object.fromEntries(entries));
    }

    private async prepareAttachment(input: MessageAttachmentInput) {
        if (!input) return null;

        const type = input.type;
        if (!type || !['image', 'post', 'chart', 'story'].includes(type)) {
            throw new BadRequestException('Tipo de adjunto inválido');
        }

        if (type === 'post') {
            if (!input.postId) throw new BadRequestException('La publicación es obligatoria');
            const sharedPost = await this.prisma.post.findUnique({
                where: { id: input.postId },
                select: { id: true },
            });
            if (!sharedPost) throw new NotFoundException('La publicación no existe');

            return {
                attachmentType: 'post' as const,
                attachmentUrl: null,
                attachmentData: null,
                sharedPostId: sharedPost.id,
            };
        }

        if (type === 'story') {
            const meta = input.meta && typeof input.meta === 'object' ? input.meta : {};
            const nestedStory = meta.story && typeof meta.story === 'object'
                ? meta.story as Record<string, any>
                : null;
            const rawStoryId = typeof meta.storyId === 'string'
                ? meta.storyId
                : typeof nestedStory?.id === 'string'
                    ? String(nestedStory.id)
                    : '';
            const storyId = rawStoryId.trim();

            if (!storyId) {
                throw new BadRequestException('La historia es obligatoria');
            }

            const sharedStory = await this.prisma.story.findUnique({
                where: { id: storyId },
                include: {
                    author: { select: USER_SELECT },
                },
            });

            if (!sharedStory || sharedStory.expiresAt <= new Date()) {
                throw new NotFoundException('La historia no existe o ya expiró');
            }

            return {
                attachmentType: 'story' as const,
                attachmentUrl: sharedStory.mediaUrl ?? null,
                attachmentData: this.stringifyMeta({
                    storyId: sharedStory.id,
                    story: {
                        id: sharedStory.id,
                        content: sharedStory.content,
                        mediaUrl: sharedStory.mediaUrl,
                        background: sharedStory.background,
                        textColor: sharedStory.textColor,
                        createdAt: sharedStory.createdAt,
                        expiresAt: sharedStory.expiresAt,
                        author: sharedStory.author,
                    },
                }),
                sharedPostId: null,
            };
        }

        if (!input.url) {
            throw new BadRequestException('El adjunto necesita una URL');
        }

        if (type === 'image') {
            const meta = input.meta && typeof input.meta === 'object'
                ? {
                    originalName:
                        typeof input.meta.originalName === 'string'
                            ? input.meta.originalName.slice(0, 140)
                            : undefined,
                    size:
                        typeof input.meta.size === 'number' && Number.isFinite(input.meta.size)
                            ? input.meta.size
                            : undefined,
                }
                : null;

            return {
                attachmentType: 'image' as const,
                attachmentUrl: input.url,
                attachmentData: this.stringifyMeta(meta),
                sharedPostId: null,
            };
        }

        const meta = input.meta && typeof input.meta === 'object' ? input.meta : {};
        const symbol = typeof meta.symbol === 'string' ? meta.symbol.trim().toUpperCase() : '';
        if (!symbol) {
            throw new BadRequestException('El gráfico necesita un símbolo');
        }

        return {
            attachmentType: 'chart' as const,
            attachmentUrl: input.url,
            attachmentData: this.stringifyMeta({
                symbol,
                interval: typeof meta.interval === 'string' ? meta.interval : 'D',
                title: typeof meta.title === 'string' ? meta.title.slice(0, 120) : undefined,
                analysisType: typeof meta.analysisType === 'string' ? meta.analysisType : undefined,
                riskLevel: typeof meta.riskLevel === 'string' ? meta.riskLevel : undefined,
            }),
            sharedPostId: null,
        };
    }
}
