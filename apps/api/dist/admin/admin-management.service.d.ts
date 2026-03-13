import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
type AuditLogData = Prisma.AdminAuditLogUncheckedCreateInput | null | undefined;
export declare class AdminManagementService {
    private readonly prisma;
    private readonly transactionOptions;
    constructor(prisma: PrismaService);
    deletePostPermanently(postId: string, auditLogData?: AuditLogData): Promise<{
        id: string;
        authorId: string;
        contentPreview: string;
    }>;
    deleteUserPermanently(userId: string, auditLogData?: AuditLogData): Promise<{
        deleted: {
            posts: number;
            comments: number;
            createdCommunities: number;
            directConversations: number;
        };
        id: string;
        email: string;
        username: string;
        role: string;
    }>;
    private deletePostsByIds;
    private findIds;
}
export {};
