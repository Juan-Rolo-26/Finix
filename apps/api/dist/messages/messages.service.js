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
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma.service");
const USER_SELECT = {
    id: true,
    username: true,
    avatarUrl: true,
    isVerified: true,
};
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
        orderBy: { order: 'asc' },
    },
};
const MESSAGE_INCLUDE = client_1.Prisma.validator()({
    sender: { select: USER_SELECT },
    sharedPost: { select: SHARED_POST_SELECT },
});
const CONVERSATION_INCLUDE = client_1.Prisma.validator()({
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
const CONVERSATION_ACCESS_INCLUDE = client_1.Prisma.validator()({
    participants: {
        orderBy: { joinedAt: 'asc' },
        include: {
            user: { select: USER_SELECT },
        },
    },
});
let MessagesService = class MessagesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createConversation(userId, payload) {
        const requestedIds = [
            ...(Array.isArray(payload.userIds) ? payload.userIds : []),
            ...(payload.userId ? [payload.userId] : []),
        ];
        const participantIds = this.normalizeParticipantIds(userId, requestedIds);
        if (participantIds.length === 0) {
            throw new common_1.BadRequestException('Debes seleccionar al menos un usuario');
        }
        if (participantIds.length === 1) {
            return this.getOrCreateConversation(userId, participantIds[0]);
        }
        return this.createGroupConversation(userId, participantIds, payload.title);
    }
    async getOrCreateConversation(userId, otherUserId) {
        if (!otherUserId || otherUserId === userId) {
            throw new common_1.BadRequestException('Debes seleccionar otro usuario');
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
    async createGroupConversation(userId, participantIds, title) {
        const normalizedIds = this.normalizeParticipantIds(userId, participantIds);
        if (normalizedIds.length < 2) {
            throw new common_1.BadRequestException('Un grupo necesita al menos dos usuarios adicionales');
        }
        const members = [userId, ...normalizedIds];
        const distinctMembers = Array.from(new Set(members));
        const users = await this.prisma.user.findMany({
            where: { id: { in: distinctMembers } },
            select: { id: true },
        });
        if (users.length !== distinctMembers.length) {
            throw new common_1.NotFoundException('Uno o más usuarios no existen');
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
    async getConversations(userId) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId },
                },
            },
            include: CONVERSATION_INCLUDE,
            orderBy: { updatedAt: 'desc' },
        });
        const result = await Promise.all(conversations.map(async (conv) => {
            const currentParticipant = conv.participants.find((participant) => participant.userId === userId) ?? null;
            const unreadCount = await this.countUnreadMessages(conv.id, userId, currentParticipant?.lastReadAt ?? null);
            return this.serializeConversationSummary(conv, userId, unreadCount);
        }));
        return result;
    }
    async getMessages(conversationId, userId, cursor) {
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
    async sendMessage(senderId, conversationId, payload) {
        const conv = await this.getConversationForMember(conversationId, senderId);
        const content = typeof payload.content === 'string' ? payload.content.trim() : '';
        const attachment = await this.prepareAttachment(payload.attachment);
        if (!content && !attachment) {
            throw new common_1.BadRequestException('El mensaje debe tener texto o un adjunto');
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
        const conversationContext = {
            ...conv,
            participants: conv.participants.map((participant) => (participant.userId === senderId
                ? { ...participant, lastReadAt: message.createdAt }
                : participant)),
        };
        return this.serializeMessage(message, conversationContext);
    }
    async markAsRead(conversationId, userId) {
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
    async getUnreadCount(userId) {
        const memberships = await this.prisma.conversationParticipant.findMany({
            where: { userId },
            select: {
                conversationId: true,
                lastReadAt: true,
            },
        });
        const counts = await Promise.all(memberships.map((membership) => (this.countUnreadMessages(membership.conversationId, userId, membership.lastReadAt))));
        return { count: counts.reduce((sum, value) => sum + value, 0) };
    }
    async searchUsers(query, userId) {
        if (!query || query.trim().length < 1)
            return [];
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
    async getConversationParticipantIds(conversationId) {
        const participants = await this.prisma.conversationParticipant.findMany({
            where: { conversationId },
            select: { userId: true },
        });
        return participants.map((participant) => participant.userId);
    }
    async getOtherParticipant(conversationId, userId) {
        const conv = await this.getConversationForMember(conversationId, userId);
        if (conv.isGroup) {
            return null;
        }
        return conv.participants.find((participant) => participant.userId !== userId)?.user ?? null;
    }
    async getConversationForMember(conversationId, userId) {
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
            throw new common_1.ForbiddenException('No tienes acceso a esta conversación');
        }
        return conv;
    }
    async countUnreadMessages(conversationId, userId, lastReadAt) {
        return this.prisma.directMessage.count({
            where: {
                conversationId,
                senderId: { not: userId },
                ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
            },
        });
    }
    normalizeParticipantIds(userId, ids) {
        return Array.from(new Set(ids.map((id) => id?.trim()).filter(Boolean))).filter((id) => id !== userId);
    }
    serializeConversationSummary(conversation, userId, unreadCount) {
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
    serializeMessage(message, conversation) {
        const { attachmentData, isRead, ...rest } = message;
        let resolvedIsRead = isRead;
        if (conversation?.isGroup) {
            const otherParticipants = conversation.participants.filter((participant) => participant.userId !== message.senderId);
            resolvedIsRead = otherParticipants.length > 0 && otherParticipants.every((participant) => (participant.lastReadAt ? participant.lastReadAt >= message.createdAt : false));
        }
        return {
            ...rest,
            isRead: resolvedIsRead,
            attachmentMeta: this.parseAttachmentData(attachmentData),
        };
    }
    parseAttachmentData(value) {
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    stringifyMeta(value) {
        if (!value)
            return null;
        const entries = Object.entries(value).filter(([, next]) => next !== undefined && next !== null && next !== '');
        if (entries.length === 0)
            return null;
        return JSON.stringify(Object.fromEntries(entries));
    }
    async prepareAttachment(input) {
        if (!input)
            return null;
        const type = input.type;
        if (!type || !['image', 'post', 'chart', 'story'].includes(type)) {
            throw new common_1.BadRequestException('Tipo de adjunto inválido');
        }
        if (type === 'post') {
            if (!input.postId)
                throw new common_1.BadRequestException('La publicación es obligatoria');
            const sharedPost = await this.prisma.post.findUnique({
                where: { id: input.postId },
                select: { id: true },
            });
            if (!sharedPost)
                throw new common_1.NotFoundException('La publicación no existe');
            return {
                attachmentType: 'post',
                attachmentUrl: null,
                attachmentData: null,
                sharedPostId: sharedPost.id,
            };
        }
        if (type === 'story') {
            const meta = input.meta && typeof input.meta === 'object' ? input.meta : {};
            const nestedStory = meta.story && typeof meta.story === 'object'
                ? meta.story
                : null;
            const rawStoryId = typeof meta.storyId === 'string'
                ? meta.storyId
                : typeof nestedStory?.id === 'string'
                    ? String(nestedStory.id)
                    : '';
            const storyId = rawStoryId.trim();
            if (!storyId) {
                throw new common_1.BadRequestException('La historia es obligatoria');
            }
            const sharedStory = await this.prisma.story.findUnique({
                where: { id: storyId },
                include: {
                    author: { select: USER_SELECT },
                },
            });
            if (!sharedStory || sharedStory.expiresAt <= new Date()) {
                throw new common_1.NotFoundException('La historia no existe o ya expiró');
            }
            return {
                attachmentType: 'story',
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
            throw new common_1.BadRequestException('El adjunto necesita una URL');
        }
        if (type === 'image') {
            const meta = input.meta && typeof input.meta === 'object'
                ? {
                    originalName: typeof input.meta.originalName === 'string'
                        ? input.meta.originalName.slice(0, 140)
                        : undefined,
                    size: typeof input.meta.size === 'number' && Number.isFinite(input.meta.size)
                        ? input.meta.size
                        : undefined,
                }
                : null;
            return {
                attachmentType: 'image',
                attachmentUrl: input.url,
                attachmentData: this.stringifyMeta(meta),
                sharedPostId: null,
            };
        }
        const meta = input.meta && typeof input.meta === 'object' ? input.meta : {};
        const symbol = typeof meta.symbol === 'string' ? meta.symbol.trim().toUpperCase() : '';
        if (!symbol) {
            throw new common_1.BadRequestException('El gráfico necesita un símbolo');
        }
        return {
            attachmentType: 'chart',
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
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map