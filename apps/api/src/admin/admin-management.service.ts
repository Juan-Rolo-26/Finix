import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type AuditLogData = Prisma.AdminAuditLogUncheckedCreateInput | null | undefined;

@Injectable()
export class AdminManagementService {
    private readonly transactionOptions = {
        maxWait: 20_000,
        timeout: 20_000,
    };

    constructor(private readonly prisma: PrismaService) { }

    async deletePostPermanently(postId: string, auditLogData?: AuditLogData) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            select: {
                id: true,
                authorId: true,
                content: true,
            },
        });

        if (!post) {
            throw new NotFoundException('Publicación no encontrada');
        }

        await this.prisma.$transaction(async (tx) => {
            await this.deletePostsByIds(tx, [postId]);

            if (auditLogData) {
                await tx.adminAuditLog.create({ data: auditLogData });
            }
        }, this.transactionOptions);

        return {
            id: post.id,
            authorId: post.authorId,
            contentPreview: post.content.slice(0, 140),
        };
    }

    async deleteUserPermanently(userId: string, auditLogData?: AuditLogData) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const deleted = await this.prisma.$transaction(async (tx) => {
            const userPostIds = await this.findIds(tx.post, { authorId: userId });
            const userCommentIds = await this.findIds(tx.comment, { authorId: userId });
            const createdCommunityIds = await this.findIds(tx.community, { creatorId: userId });
            const subscriptionIds = await this.findIds(tx.subscription, { userId });
            const directConversationIds = await this.findIds(tx.conversation, {
                OR: [{ participant1Id: userId }, { participant2Id: userId }],
            });

            if (userPostIds.length > 0) {
                await this.deletePostsByIds(tx, userPostIds);
            }

            if (userCommentIds.length > 0) {
                await tx.report.deleteMany({
                    where: {
                        targetType: 'COMMENT',
                        targetId: { in: userCommentIds },
                    },
                });
                await tx.comment.updateMany({
                    where: { parentId: { in: userCommentIds } },
                    data: { parentId: null },
                });
                await tx.commentLike.deleteMany({
                    where: {
                        OR: [
                            { userId },
                            { commentId: { in: userCommentIds } },
                        ],
                    },
                });
                await tx.comment.deleteMany({
                    where: { id: { in: userCommentIds } },
                });
            } else {
                await tx.commentLike.deleteMany({ where: { userId } });
            }

            if (createdCommunityIds.length > 0) {
                const createdCommunityPaymentIds = await this.findIds(tx.communityPayment, {
                    communityId: { in: createdCommunityIds },
                });

                if (createdCommunityPaymentIds.length > 0) {
                    await tx.finixRevenue.updateMany({
                        where: { paymentId: { in: createdCommunityPaymentIds } },
                        data: { paymentId: null },
                    });
                }

                await tx.communityResource.deleteMany({
                    where: { communityId: { in: createdCommunityIds } },
                });
                await tx.communityPost.deleteMany({
                    where: { communityId: { in: createdCommunityIds } },
                });
                await tx.communityMember.deleteMany({
                    where: { communityId: { in: createdCommunityIds } },
                });
                await tx.communityPayment.deleteMany({
                    where: { communityId: { in: createdCommunityIds } },
                });
                await tx.community.deleteMany({
                    where: { id: { in: createdCommunityIds } },
                });
            }

            if (subscriptionIds.length > 0) {
                await tx.finixRevenue.updateMany({
                    where: { subscriptionId: { in: subscriptionIds } },
                    data: { subscriptionId: null },
                });
            }

            if (directConversationIds.length > 0) {
                await tx.conversation.deleteMany({
                    where: { id: { in: directConversationIds } },
                });
            }

            await tx.communityResource.updateMany({
                where: { authorId: userId },
                data: { authorId: null },
            });
            await tx.communityPost.deleteMany({
                where: { authorId: userId },
            });
            await tx.communityMember.deleteMany({
                where: { userId },
            });
            await tx.communityPayment.deleteMany({
                where: { userId },
            });
            await tx.creatorApplication.deleteMany({
                where: { userId },
            });
            await tx.follow.deleteMany({
                where: {
                    OR: [
                        { followerId: userId },
                        { followingId: userId },
                    ],
                },
            });
            await tx.watchlist.deleteMany({
                where: { userId },
            });
            await tx.portfolio.deleteMany({
                where: { userId },
            });
            await tx.subscription.deleteMany({
                where: { userId },
            });
            await tx.paymentLog.updateMany({
                where: { userId },
                data: { userId: null },
            });
            await tx.report.deleteMany({
                where: {
                    OR: [
                        { reporterId: userId },
                        { targetType: 'USER', targetId: userId },
                    ],
                },
            });
            await tx.postReport.deleteMany({
                where: { userId },
            });
            await tx.like.deleteMany({
                where: { userId },
            });
            await tx.repost.deleteMany({
                where: { userId },
            });
            await tx.save.deleteMany({
                where: { userId },
            });
            await tx.directMessage.deleteMany({
                where: { senderId: userId },
            });
            await tx.conversation.updateMany({
                where: { createdById: userId },
                data: { createdById: null },
            });
            await tx.conversationParticipant.deleteMany({
                where: { userId },
            });
            await tx.storyView.deleteMany({
                where: { viewerId: userId },
            });
            await tx.story.deleteMany({
                where: { authorId: userId },
            });
            await tx.adminSession.deleteMany({
                where: { userId },
            });
            await tx.adminAuditLog.deleteMany({
                where: { actorId: userId },
            });
            await tx.notification.deleteMany({
                where: { userId },
            });

            const orphanConversationIds = await this.findIds(tx.conversation, {
                participants: {
                    none: {},
                },
            });

            if (orphanConversationIds.length > 0) {
                await tx.conversation.deleteMany({
                    where: { id: { in: orphanConversationIds } },
                });
            }

            await tx.user.delete({
                where: { id: userId },
            });

            if (auditLogData) {
                await tx.adminAuditLog.create({ data: auditLogData });
            }

            return {
                posts: userPostIds.length,
                comments: userCommentIds.length,
                createdCommunities: createdCommunityIds.length,
                directConversations: directConversationIds.length,
            };
        }, this.transactionOptions);

        return {
            ...user,
            deleted,
        };
    }

    private async deletePostsByIds(tx: Prisma.TransactionClient, postIds: string[]) {
        if (postIds.length === 0) {
            return;
        }

        await tx.report.deleteMany({
            where: {
                targetType: 'POST',
                targetId: { in: postIds },
            },
        });
        await tx.directMessage.updateMany({
            where: { sharedPostId: { in: postIds } },
            data: { sharedPostId: null },
        });
        await tx.post.updateMany({
            where: { parentId: { in: postIds } },
            data: { parentId: null },
        });
        await tx.post.updateMany({
            where: { quotedPostId: { in: postIds } },
            data: { quotedPostId: null },
        });
        await tx.post.deleteMany({
            where: { id: { in: postIds } },
        });
    }

    private async findIds<ModelWhere extends object>(
        delegate: {
            findMany(args: { where: ModelWhere; select: { id: true } }): Promise<Array<{ id: string }>>;
        },
        where: ModelWhere,
    ) {
        const rows = await delegate.findMany({
            where,
            select: { id: true },
        });

        return rows.map((row) => row.id);
    }
}
