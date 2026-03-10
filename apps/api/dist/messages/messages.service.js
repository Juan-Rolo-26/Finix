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
let MessagesService = class MessagesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateConversation(userId, otherUserId) {
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
    async getConversations(userId) {
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
                lastMessage: conv.messages[0] ? this.serializeMessage(conv.messages[0]) : null,
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
            include: MESSAGE_INCLUDE,
            orderBy: { createdAt: 'asc' },
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            take: 50,
        });
        return messages.map((message) => this.serializeMessage(message));
    }
    async sendMessage(senderId, conversationId, payload) {
        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ participant1Id: senderId }, { participant2Id: senderId }],
            },
        });
        if (!conv)
            throw new common_1.ForbiddenException('No tienes acceso a esta conversación');
        const content = typeof payload.content === 'string' ? payload.content.trim() : '';
        const attachment = await this.prepareAttachment(payload.attachment);
        if (!content && !attachment) {
            throw new common_1.BadRequestException('El mensaje debe tener texto o un adjunto');
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
    async getOtherParticipant(conversationId, userId) {
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
        if (!conv)
            throw new common_1.ForbiddenException('No tienes acceso');
        return conv.participant1Id === userId ? conv.participant2 : conv.participant1;
    }
    serializeMessage(message) {
        const { attachmentData, ...rest } = message;
        return {
            ...rest,
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