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

type MessageRecord = Prisma.DirectMessageGetPayload<{ include: typeof MESSAGE_INCLUDE }>;

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) { }

    /** Returns or creates a conversation between two users */
    async getOrCreateConversation(userId: string, otherUserId: string) {
        const [p1, p2] = [userId, otherUserId].sort();

        let conversation = await this.prisma.conversation.findUnique({
            where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
            include: {
                participant1: { select: USER_SELECT },
                participant2: { select: USER_SELECT },
            },
        });

        if (!conversation) {
            conversation = await this.prisma.conversation.create({
                data: { participant1Id: p1, participant2Id: p2 },
                include: {
                    participant1: { select: USER_SELECT },
                    participant2: { select: USER_SELECT },
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
                participant1: { select: USER_SELECT },
                participant2: { select: USER_SELECT },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: MESSAGE_INCLUDE,
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
                    lastMessage: conv.messages[0] ? this.serializeMessage(conv.messages[0]) : null,
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
            include: MESSAGE_INCLUDE,
            orderBy: { createdAt: 'asc' },
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            take: 50,
        });

        return messages.map((message) => this.serializeMessage(message));
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
        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ participant1Id: senderId }, { participant2Id: senderId }],
            },
        });
        if (!conv) throw new ForbiddenException('No tienes acceso a esta conversación');

        const content = typeof payload.content === 'string' ? payload.content.trim() : '';
        const attachment = await this.prepareAttachment(payload.attachment);

        if (!content && !attachment) {
            throw new BadRequestException('El mensaje debe tener texto o un adjunto');
        }

        const message = await this.prisma.directMessage.create({
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

        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        return this.serializeMessage(message);
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

    /** Get the other participant of a conversation */
    async getOtherParticipant(conversationId: string, userId: string) {
        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ participant1Id: userId }, { participant2Id: userId }],
            },
            include: {
                participant1: { select: USER_SELECT },
                participant2: { select: USER_SELECT },
            },
        });
        if (!conv) throw new ForbiddenException('No tienes acceso');

        return conv.participant1Id === userId ? conv.participant2 : conv.participant1;
    }

    private serializeMessage(message: MessageRecord) {
        const { attachmentData, ...rest } = message;
        return {
            ...rest,
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
