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
exports.StoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const upload_url_util_1 = require("../uploads/upload-url.util");
const STORY_DURATION_MS = 24 * 60 * 60 * 1000;
const STORY_CONTENT_LIMIT = 220;
const STORY_AUTHOR_SELECT = {
    id: true,
    username: true,
    avatarUrl: true,
    isVerified: true,
    bio: true,
    title: true,
};
function sanitizeStoryText(value) {
    if (typeof value !== 'string')
        return '';
    return value.replace(/<[^>]*>/g, '').trim();
}
function normalizeOptionalText(value, maxLength) {
    if (value === null || value === undefined)
        return null;
    if (typeof value !== 'string')
        return null;
    const normalized = value.trim();
    if (!normalized)
        return null;
    return normalized.slice(0, maxLength);
}
let StoriesService = class StoriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async pruneExpiredStories() {
        await this.prisma.story.deleteMany({
            where: {
                expiresAt: { lte: new Date() },
            },
        });
    }
    buildStoryInclude(userId) {
        return {
            author: { select: STORY_AUTHOR_SELECT },
            views: {
                where: { viewerId: userId },
                select: { viewerId: true },
            },
            _count: {
                select: { views: true },
            },
        };
    }
    serializeStory(story, userId) {
        return {
            id: story.id,
            authorId: story.authorId,
            content: story.content,
            mediaUrl: story.mediaUrl,
            background: story.background,
            textColor: story.textColor,
            createdAt: story.createdAt,
            expiresAt: story.expiresAt,
            author: story.author,
            viewedByMe: story.authorId === userId || story.views?.length > 0,
            viewsCount: story._count?.views ?? 0,
        };
    }
    async createStory(userId, payload) {
        await this.pruneExpiredStories();
        const content = sanitizeStoryText(payload.content);
        const mediaUrl = (0, upload_url_util_1.normalizeStoredUploadUrl)(normalizeOptionalText(payload.mediaUrl, 500));
        const background = normalizeOptionalText(payload.background, 160);
        const textColor = normalizeOptionalText(payload.textColor, 40) || '#ffffff';
        if (!content && !mediaUrl) {
            throw new common_1.BadRequestException('La historia debe tener texto o una imagen');
        }
        if (content.length > STORY_CONTENT_LIMIT) {
            throw new common_1.BadRequestException(`La historia no puede superar ${STORY_CONTENT_LIMIT} caracteres`);
        }
        const story = await this.prisma.story.create({
            data: {
                authorId: userId,
                content: content || null,
                mediaUrl,
                background: background || 'linear-gradient(135deg, #0f172a 0%, #111827 45%, #10b981 100%)',
                textColor,
                expiresAt: new Date(Date.now() + STORY_DURATION_MS),
            },
            include: this.buildStoryInclude(userId),
        });
        return this.serializeStory(story, userId);
    }
    async getFeed(userId) {
        await this.pruneExpiredStories();
        const follows = await this.prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = follows.map((follow) => follow.followingId);
        const followingSet = new Set(followingIds);
        const stories = await this.prisma.story.findMany({
            where: {
                expiresAt: { gt: new Date() },
                OR: [
                    { authorId: userId },
                    { authorId: { in: followingIds.length > 0 ? followingIds : ['__none__'] } },
                    { author: { isProfilePublic: true } },
                ],
            },
            orderBy: { createdAt: 'asc' },
            include: this.buildStoryInclude(userId),
            take: 120,
        });
        const grouped = new Map();
        for (const story of stories) {
            const serialized = this.serializeStory(story, userId);
            const current = grouped.get(story.authorId);
            if (current) {
                current.stories.push(serialized);
                current.latestAt = serialized.createdAt > current.latestAt ? serialized.createdAt : current.latestAt;
                continue;
            }
            grouped.set(story.authorId, {
                author: story.author,
                stories: [serialized],
                latestAt: serialized.createdAt,
            });
        }
        const groups = Array.from(grouped.entries())
            .map(([authorId, group]) => ({
            author: group.author,
            stories: group.stories,
            latestAt: group.latestAt,
            hasUnseen: group.stories.some((story) => !story.viewedByMe),
            isFollowing: followingSet.has(authorId),
        }))
            .sort((a, b) => {
            if (a.author.id === userId)
                return -1;
            if (b.author.id === userId)
                return 1;
            if (a.isFollowing !== b.isFollowing)
                return a.isFollowing ? -1 : 1;
            return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
        })
            .map(({ isFollowing, ...group }) => group);
        return { groups };
    }
    async markViewed(storyId, userId) {
        const story = await this.prisma.story.findUnique({
            where: { id: storyId },
            select: { id: true, authorId: true, expiresAt: true },
        });
        if (!story || story.expiresAt <= new Date()) {
            throw new common_1.NotFoundException('Historia no encontrada');
        }
        if (story.authorId === userId) {
            return { success: true, viewed: false };
        }
        await this.prisma.storyView.upsert({
            where: {
                storyId_viewerId: {
                    storyId,
                    viewerId: userId,
                },
            },
            update: {
                viewedAt: new Date(),
            },
            create: {
                storyId,
                viewerId: userId,
            },
        });
        return { success: true, viewed: true };
    }
    async deleteStory(storyId, userId) {
        const story = await this.prisma.story.findUnique({
            where: { id: storyId },
            select: { id: true, authorId: true },
        });
        if (!story) {
            throw new common_1.NotFoundException('Historia no encontrada');
        }
        if (story.authorId !== userId) {
            throw new common_1.ForbiddenException('No podes eliminar esta historia');
        }
        await this.prisma.story.delete({
            where: { id: storyId },
        });
        return { success: true };
    }
};
exports.StoriesService = StoriesService;
exports.StoriesService = StoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StoriesService);
//# sourceMappingURL=stories.service.js.map