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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const argon2 = require("argon2");
const notifications_service_1 = require("../notifications/notifications.service");
const prisma_service_1 = require("../prisma.service");
let UserService = class UserService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    getProfileSelect() {
        return {
            id: true,
            username: true,
            email: true,
            bio: true,
            bioLong: true,
            avatarUrl: true,
            bannerUrl: true,
            isInfluencer: true,
            isVerified: true,
            plan: true,
            accountType: true,
            subscriptionStatus: true,
            title: true,
            company: true,
            location: true,
            website: true,
            linkedinUrl: true,
            twitterUrl: true,
            youtubeUrl: true,
            instagramUrl: true,
            yearsExperience: true,
            specializations: true,
            certifications: true,
            totalReturn: true,
            winRate: true,
            riskScore: true,
            isProfilePublic: true,
            showPortfolio: true,
            showStats: true,
            acceptingFollowers: true,
            createdAt: true,
            _count: {
                select: {
                    posts: true,
                    following: true,
                    followedBy: true,
                },
            },
        };
    }
    async getCurrentUserProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: this.getProfileSelect(),
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        return user;
    }
    async getNotifications(userId) {
        return this.notificationsService.getNotifications(userId);
    }
    async getUnreadNotificationsCount(userId) {
        return this.notificationsService.countUnread(userId);
    }
    async markAllNotificationsAsRead(userId) {
        return this.notificationsService.markAllAsRead(userId);
    }
    async getUserProfile(username, viewerId) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: this.getProfileSelect(),
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const isFollowedByMe = viewerId
            ? await this.prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: viewerId,
                        followingId: user.id,
                    },
                },
                select: { followerId: true },
            }).then(Boolean)
            : false;
        if (!user.isProfilePublic) {
            return {
                id: user.id,
                username: user.username,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                isInfluencer: user.isInfluencer,
                isVerified: user.isVerified,
                accountType: user.accountType,
                plan: user.plan,
                isProfilePublic: false,
                isFollowedByMe,
            };
        }
        return {
            ...user,
            isFollowedByMe,
        };
    }
    normalizeNullableText(value, maxLen) {
        if (value === null)
            return null;
        if (typeof value !== 'string')
            return undefined;
        const normalized = value.trim();
        if (normalized.length === 0)
            return null;
        if (normalized.length > maxLen) {
            throw new common_1.BadRequestException(`El texto no puede superar ${maxLen} caracteres`);
        }
        return normalized;
    }
    async updateProfile(userId, updateData) {
        const filteredData = {};
        if (updateData.username !== undefined) {
            if (typeof updateData.username !== 'string') {
                throw new common_1.BadRequestException('El username es inválido');
            }
            const username = updateData.username.trim();
            if (username.length < 3 || username.length > 20) {
                throw new common_1.BadRequestException('El username debe tener entre 3 y 20 caracteres');
            }
            filteredData.username = username;
        }
        if (updateData.email !== undefined) {
            if (typeof updateData.email !== 'string') {
                throw new common_1.BadRequestException('El email es inválido');
            }
            const email = updateData.email.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new common_1.BadRequestException('El email es inválido');
            }
            filteredData.email = email;
        }
        const stringFieldConfig = {
            bio: 300,
            bioLong: 2000,
            avatarUrl: 500,
            bannerUrl: 500,
            title: 120,
            company: 120,
            location: 120,
            website: 500,
            linkedinUrl: 500,
            twitterUrl: 500,
            youtubeUrl: 500,
            instagramUrl: 500,
            specializations: 2000,
            certifications: 2000,
        };
        for (const [field, maxLen] of Object.entries(stringFieldConfig)) {
            if (updateData[field] !== undefined) {
                const normalized = this.normalizeNullableText(updateData[field], maxLen);
                if (normalized !== undefined) {
                    filteredData[field] = normalized;
                }
            }
        }
        if (updateData.yearsExperience !== undefined) {
            if (updateData.yearsExperience === null || updateData.yearsExperience === '') {
                filteredData.yearsExperience = null;
            }
            else {
                const years = Number(updateData.yearsExperience);
                if (!Number.isFinite(years) || years < 0 || years > 80) {
                    throw new common_1.BadRequestException('Los años de experiencia son inválidos');
                }
                filteredData.yearsExperience = Math.round(years);
            }
        }
        const booleanFields = ['isProfilePublic', 'showPortfolio', 'showStats', 'acceptingFollowers'];
        for (const field of booleanFields) {
            if (updateData[field] !== undefined) {
                filteredData[field] = Boolean(updateData[field]);
            }
        }
        if (Object.keys(filteredData).length === 0) {
            return this.getCurrentUserProfile(userId);
        }
        try {
            const updated = await this.prisma.user.update({
                where: { id: userId },
                data: filteredData,
                select: this.getProfileSelect(),
            });
            return updated;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new common_1.BadRequestException('El username o email ya está en uso');
            }
            throw error;
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        if (!currentPassword || !newPassword) {
            throw new common_1.BadRequestException('Debes completar la contraseña actual y la nueva');
        }
        if (newPassword.length < 8) {
            throw new common_1.BadRequestException('La nueva contraseña debe tener al menos 8 caracteres');
        }
        if (newPassword === currentPassword) {
            throw new common_1.BadRequestException('La nueva contraseña no puede ser igual a la actual');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const isValidPassword = await argon2.verify(user.password, currentPassword);
        if (!isValidPassword) {
            throw new common_1.UnauthorizedException('La contraseña actual es incorrecta');
        }
        const hashedPassword = await argon2.hash(newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return { success: true, message: 'Contraseña actualizada correctamente' };
    }
    async getUserStats(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        posts: true,
                        following: true,
                        followedBy: true,
                        portfolios: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const portfolioStats = await this.calculatePortfolioStats(userId);
        return {
            postsCount: user._count.posts,
            followersCount: user._count.followedBy,
            followingCount: user._count.following,
            portfoliosCount: user._count.portfolios,
            ...portfolioStats,
        };
    }
    async calculatePortfolioStats(userId) {
        const portfolios = await this.prisma.portfolio.findMany({
            where: { userId },
            include: {
                holdings: {
                    include: {
                        asset: {
                            select: {
                                ticker: true,
                            },
                        },
                    },
                },
                transactions: true,
            },
        });
        if (portfolios.length === 0) {
            return {
                totalReturn: null,
                winRate: null,
                riskScore: null,
            };
        }
        const totalHoldings = portfolios.reduce((sum, p) => sum + p.holdings.length, 0);
        const totalTransactions = portfolios.reduce((sum, p) => sum + p.transactions.length, 0);
        const uniqueTickers = new Set(portfolios.flatMap((p) => p.holdings.map((h) => h.asset.ticker))).size;
        const riskScore = totalHoldings === 0
            ? 5.0
            : Math.min(10, Math.max(1, 10 - (uniqueTickers / 2)));
        return {
            totalReturn: totalTransactions > 0 ? Math.random() * 20 - 5 : null,
            winRate: totalTransactions > 0 ? 50 + Math.random() * 30 : null,
            riskScore: parseFloat(riskScore.toFixed(1)),
        };
    }
    async getTopTraders() {
        return this.prisma.user.findMany({
            where: { isProfilePublic: true, totalReturn: { not: null } },
            orderBy: { totalReturn: 'desc' },
            take: 10,
            select: this.getProfileSelect(),
        });
    }
    async searchUsers(query) {
        if (!query || query.length < 2)
            return [];
        return this.prisma.user.findMany({
            where: {
                username: {
                    contains: query,
                    mode: 'insensitive',
                },
                isProfilePublic: true,
            },
            take: 10,
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                isVerified: true,
                title: true,
                company: true,
                bio: true,
                winRate: true,
                totalReturn: true,
            },
        });
    }
    async toggleFollow(followerId, username) {
        const [targetUser, follower] = await Promise.all([
            this.prisma.user.findUnique({
                where: { username },
                select: {
                    id: true,
                    username: true,
                    acceptingFollowers: true,
                    _count: {
                        select: {
                            followedBy: true,
                        },
                    },
                },
            }),
            this.prisma.user.findUnique({
                where: { id: followerId },
                select: {
                    id: true,
                    username: true,
                },
            }),
        ]);
        if (!targetUser) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (!follower) {
            throw new common_1.NotFoundException('Usuario autenticado no encontrado');
        }
        if (targetUser.id === followerId) {
            throw new common_1.BadRequestException('No puedes seguir tu propio perfil');
        }
        const existing = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: targetUser.id,
                },
            },
            select: { followerId: true },
        });
        if (existing) {
            await this.prisma.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId: targetUser.id,
                    },
                },
            });
            return {
                following: false,
                followersCount: Math.max((targetUser._count?.followedBy || 1) - 1, 0),
            };
        }
        if (!targetUser.acceptingFollowers) {
            throw new common_1.BadRequestException('Este usuario no acepta seguidores en este momento');
        }
        await this.prisma.follow.create({
            data: {
                followerId,
                followingId: targetUser.id,
            },
        });
        await this.notificationsService.createNotification({
            userId: targetUser.id,
            actorId: followerId,
            type: 'follow',
            title: `${follower.username} empezo a seguirte.`,
            link: `/profile/${follower.username}`,
        });
        return {
            following: true,
            followersCount: (targetUser._count?.followedBy || 0) + 1,
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], UserService);
//# sourceMappingURL=user.service.js.map