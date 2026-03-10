import { SettingsService } from './settings.service';
export declare class SettingsController {
    private settingsService;
    constructor(settingsService: SettingsService);
    getSettings(req: any): Promise<{
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
    updatePrivacy(req: any, body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    updatePreferences(req: any, body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    updateOnboarding(req: any, body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    logoutAll(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    uploadAvatar(req: any, file: Express.Multer.File): Promise<{
        avatarUrl: string;
    }>;
    uploadBanner(req: any, file: Express.Multer.File): Promise<{
        bannerUrl: string;
    }>;
}
