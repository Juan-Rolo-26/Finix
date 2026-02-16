import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) { }

    async createPost(userId: string, dto: CreatePostDto) {
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

    async getAllPosts(page: number = 1, limit: number = 20) {
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

    async getPostById(postId: string) {
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
            throw new NotFoundException('Post no encontrado');
        }

        return post;
    }

    async updatePost(postId: string, userId: string, dto: UpdatePostDto) {
        const post = await this.prisma.post.findFirst({
            where: { id: postId, authorId: userId },
        });

        if (!post) {
            throw new NotFoundException('Post no encontrado o no tienes permisos');
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

    async deletePost(postId: string, userId: string) {
        const post = await this.prisma.post.findFirst({
            where: { id: postId, authorId: userId },
        });

        if (!post) {
            throw new NotFoundException('Post no encontrado o no tienes permisos');
        }

        return this.prisma.post.delete({
            where: { id: postId },
        });
    }

    async likePost(postId: string, userId: string) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post no encontrado');
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
            // Unlike
            await this.prisma.like.delete({
                where: {
                    postId_userId: {
                        postId,
                        userId,
                    },
                },
            });
            return { liked: false };
        } else {
            // Like
            await this.prisma.like.create({
                data: {
                    postId,
                    userId,
                },
            });
            return { liked: true };
        }
    }

    async addComment(postId: string, userId: string, content: string) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post no encontrado');
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
}
