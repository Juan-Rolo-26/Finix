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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let PostsService = class PostsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPost(userId, dto) {
        const tickers = dto.tickers ? dto.tickers.join(',') : '';
        return this.prisma.post.create({
            data: {
                authorId: userId,
                content: dto.content,
                mediaUrl: dto.mediaUrl,
                tickers,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                        isInfluencer: true,
                        bio: true,
                        avatarUrl: true,
                    },
                },
                likes: true,
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async getAllPosts(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            role: true,
                            isInfluencer: true,
                            bio: true,
                            avatarUrl: true,
                        },
                    },
                    likes: true,
                    comments: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    username: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            }),
            this.prisma.post.count(),
        ]);
        return {
            posts,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getPostById(postId) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                        isInfluencer: true,
                        bio: true,
                        avatarUrl: true,
                    },
                },
                likes: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                avatarUrl: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post no encontrado');
        }
        return post;
    }
    async updatePost(postId, userId, dto) {
        const post = await this.prisma.post.findFirst({
            where: { id: postId, authorId: userId },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post no encontrado o no tienes permisos');
        }
        const tickers = dto.tickers ? dto.tickers.join(',') : undefined;
        return this.prisma.post.update({
            where: { id: postId },
            data: {
                content: dto.content,
                mediaUrl: dto.mediaUrl,
                tickers,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                        isInfluencer: true,
                        bio: true,
                        avatarUrl: true,
                    },
                },
                likes: true,
                comments: true,
            },
        });
    }
    async deletePost(postId, userId) {
        const post = await this.prisma.post.findFirst({
            where: { id: postId, authorId: userId },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post no encontrado o no tienes permisos');
        }
        return this.prisma.post.delete({
            where: { id: postId },
        });
    }
    async likePost(postId, userId) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post no encontrado');
        }
        const existingLike = await this.prisma.like.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId,
                },
            },
        });
        if (existingLike) {
            await this.prisma.like.delete({
                where: {
                    postId_userId: {
                        postId,
                        userId,
                    },
                },
            });
            return { liked: false };
        }
        else {
            await this.prisma.like.create({
                data: {
                    postId,
                    userId,
                },
            });
            return { liked: true };
        }
    }
    async addComment(postId, userId, content) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post no encontrado');
        }
        return this.prisma.comment.create({
            data: {
                postId,
                authorId: userId,
                content,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PostsService);
//# sourceMappingURL=posts.service.js.map