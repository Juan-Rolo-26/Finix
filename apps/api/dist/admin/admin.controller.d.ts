import { PrismaService } from '../prisma.service';
export declare class AdminController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getKPIs(): Promise<{
        kpis: {
            totalUsers: number;
            activeUsersCount: number;
            totalPosts: number;
            pendingReports: number;
        };
    }>;
    getUsers(query: any): Promise<{
        data: {
            id: string;
            email: string;
            username: string;
            role: string;
            status: string;
            shadowbanned: boolean;
            lastLogin: Date;
            flags: string;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    updateUser(id: string, body: any, req: any): Promise<{
        data: {
            id: string;
            email: string;
            username: string;
            password: string;
            role: string;
            status: string;
            shadowbanned: boolean;
            lastLogin: Date | null;
            flags: string | null;
            emailVerified: boolean;
            emailVerificationCode: string | null;
            emailVerificationExpires: Date | null;
            resetPasswordToken: string | null;
            resetPasswordExpires: Date | null;
            bio: string | null;
            bioLong: string | null;
            avatarUrl: string | null;
            bannerUrl: string | null;
            isInfluencer: boolean;
            isVerified: boolean;
            accountType: string;
            plan: string;
            stripeCustomerId: string | null;
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
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getPosts(query: any): Promise<{
        data: ({
            _count: {
                comments: number;
                likes: number;
                reports: number;
            };
            author: {
                id: string;
                username: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            type: string;
            visibility: string;
            deletedAt: Date | null;
            assetSymbol: string | null;
            analysisType: string | null;
            riskLevel: string | null;
            contentEditedAt: Date | null;
            tickers: string;
            viewCount: number;
            authorId: string;
            parentId: string | null;
            quotedPostId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    updatePost(id: string, body: any, req: any): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            type: string;
            visibility: string;
            deletedAt: Date | null;
            assetSymbol: string | null;
            analysisType: string | null;
            riskLevel: string | null;
            contentEditedAt: Date | null;
            tickers: string;
            viewCount: number;
            authorId: string;
            parentId: string | null;
            quotedPostId: string | null;
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
            status: string;
            createdAt: Date;
            updatedAt: Date;
            reason: string;
            targetId: string;
            reporterId: string;
            targetType: string;
            resolutionNote: string | null;
        })[];
    }>;
    resolveReport(id: string, body: any, req: any): Promise<{
        data: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            reason: string;
            targetId: string;
            reporterId: string;
            targetType: string;
            resolutionNote: string | null;
        };
    }>;
    getAuditLogs(): Promise<{
        data: ({
            actor: {
                id: string;
                username: string;
            };
        } & {
            id: string;
            createdAt: Date;
            action: string;
            targetId: string;
            metadata: string | null;
            actorId: string;
        })[];
    }>;
}
