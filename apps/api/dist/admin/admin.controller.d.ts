import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { AdminAuditLogsQueryDto, AdminPostsQueryDto, AdminResolveReportDto, AdminUpdatePostDto, AdminUpdateUserDto, AdminUsersQueryDto } from './dto/admin-management.dto';
import { AdminAuditService } from './admin-audit.service';
import { AdminManagementService } from './admin-management.service';
type AdminRequest = Request & {
    user?: {
        id: string;
        email: string;
        role: string;
        sessionId?: string;
    };
};
export declare class AdminController {
    private readonly prisma;
    private readonly adminAuditService;
    private readonly adminManagementService;
    constructor(prisma: PrismaService, adminAuditService: AdminAuditService, adminManagementService: AdminManagementService);
    getKPIs(): Promise<{
        kpis: {
            totalUsers: number;
            activeUsersCount: number;
            totalPosts: number;
            pendingReports: number;
        };
    }>;
    getUsers(query: AdminUsersQueryDto): Promise<{
        data: {
            id: string;
            createdAt: Date;
            email: string;
            username: string;
            role: string;
            status: string;
            shadowbanned: boolean;
            lastLogin: Date;
            flags: string;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    updateUser(id: string, body: AdminUpdateUserDto, req: AdminRequest): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            username: string;
            stripeCustomerId: string | null;
            password: string | null;
            role: string;
            status: string;
            shadowbanned: boolean;
            lastLogin: Date | null;
            flags: string | null;
            emailVerified: boolean;
            emailVerificationCode: string | null;
            emailVerificationExpires: Date | null;
            loginVerificationCode: string | null;
            loginVerificationExpires: Date | null;
            resetPasswordToken: string | null;
            resetPasswordExpires: Date | null;
            adminTwoFactorEnabled: boolean;
            adminTotpSecret: string | null;
            adminTotpTempSecret: string | null;
            adminTotpTempExpires: Date | null;
            adminLockedUntil: Date | null;
            adminFailedLoginAttempts: number;
            bio: string | null;
            bioLong: string | null;
            avatarUrl: string | null;
            bannerUrl: string | null;
            isInfluencer: boolean;
            isVerified: boolean;
            accountType: string;
            plan: string;
            subscriptionStatus: string;
            aiUsageThisMonth: number;
            aiUsageLimit: number;
            lastAiUsageReset: Date | null;
            title: string | null;
            company: string | null;
            location: string | null;
            website: string | null;
            linkedinUrl: string | null;
            twitterUrl: string | null;
            youtubeUrl: string | null;
            instagramUrl: string | null;
            yearsExperience: number | null;
            specializations: string | null;
            certifications: string | null;
            totalReturn: number | null;
            winRate: number | null;
            riskScore: number | null;
            isProfilePublic: boolean;
            showPortfolio: boolean;
            showStats: boolean;
            acceptingFollowers: boolean;
            showActivity: boolean;
            showExactReturns: boolean;
            returnsVisibilityMode: string;
            language: string;
            currency: string;
            autoRefreshMarket: boolean;
            compactTables: boolean;
            showAdvancedMetrics: boolean;
            theme: string;
            chartDensity: string;
            marketNotifications: boolean;
            timezone: string;
            onboardingCompleted: boolean;
            onboardingStep: number;
            isCreator: boolean;
        };
    }>;
    deleteUser(id: string, req: AdminRequest): Promise<{
        data: {
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
        };
    }>;
    getPosts(query: AdminPostsQueryDto): Promise<{
        data: ({
            author: {
                id: string;
                username: string;
                avatarUrl: string;
            };
            _count: {
                likes: number;
                comments: number;
                reports: number;
            };
        } & {
            id: string;
            content: string;
            authorId: string;
            type: string;
            visibility: string;
            deletedAt: Date | null;
            assetSymbol: string | null;
            analysisType: string | null;
            riskLevel: string | null;
            contentEditedAt: Date | null;
            tickers: string;
            parentId: string | null;
            quotedPostId: string | null;
            viewCount: number;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    updatePost(id: string, body: AdminUpdatePostDto, req: AdminRequest): Promise<{
        data: {
            id: string;
            content: string;
            authorId: string;
            type: string;
            visibility: string;
            deletedAt: Date | null;
            assetSymbol: string | null;
            analysisType: string | null;
            riskLevel: string | null;
            contentEditedAt: Date | null;
            tickers: string;
            parentId: string | null;
            quotedPostId: string | null;
            viewCount: number;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    deletePost(id: string, req: AdminRequest): Promise<{
        data: {
            id: string;
            authorId: string;
            contentPreview: string;
        };
    }>;
    getReports(): Promise<{
        data: ({
            reporter: {
                id: string;
                username: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            reporterId: string;
            targetType: string;
            targetId: string;
            reason: string;
            resolutionNote: string | null;
        })[];
    }>;
    resolveReport(id: string, body: AdminResolveReportDto, req: AdminRequest): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            reporterId: string;
            targetType: string;
            targetId: string;
            reason: string;
            resolutionNote: string | null;
        };
    }>;
    getAuditLogs(query: AdminAuditLogsQueryDto): Promise<{
        data: ({
            actor: {
                id: string;
                email: string;
                username: string;
                role: string;
            };
        } & {
            id: string;
            createdAt: Date;
            targetId: string | null;
            action: string;
            actorId: string;
            sessionId: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            metadata: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    private canChangeRoles;
    private isOwner;
    private isAdminRole;
    private assertCanDeleteUser;
}
export {};
