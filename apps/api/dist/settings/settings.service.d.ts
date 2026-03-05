import { PrismaService } from '../prisma.service';
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(userId: string): Promise<{
        id: string;
        email: string;
        username: string;
        bio: string;
        bioLong: string;
        avatarUrl: string;
        bannerUrl: string;
        isInfluencer: boolean;
        isVerified: boolean;
        accountType: string;
        plan: string;
        subscriptionStatus: string;
        title: string;
        company: string;
        location: string;
        website: string;
        linkedinUrl: string;
        twitterUrl: string;
        youtubeUrl: string;
        instagramUrl: string;
        yearsExperience: number;
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
    }>;
    updatePrivacy(userId: string, dto: {
        isProfilePublic?: boolean;
        showPortfolio?: boolean;
        showStats?: boolean;
        acceptingFollowers?: boolean;
        showActivity?: boolean;
        showExactReturns?: boolean;
        returnsVisibilityMode?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    updatePreferences(userId: string, dto: {
        language?: string;
        currency?: string;
        autoRefreshMarket?: boolean;
        compactTables?: boolean;
        showAdvancedMetrics?: boolean;
        theme?: string;
        chartDensity?: string;
        marketNotifications?: boolean;
        timezone?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    updateOnboarding(userId: string, dto: {
        step?: number;
        completed?: boolean;
        bio?: string;
        location?: string;
        avatarUrl?: string;
        portfolioName?: string;
        portfolioCurrency?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    saveAvatarUrl(userId: string, avatarUrl: string): Promise<{
        success: boolean;
    }>;
    logoutAllSessions(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
