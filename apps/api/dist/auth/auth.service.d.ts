import { JwtService } from '@nestjs/jwt';
import { DemoUserService } from '../demo-user.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private mailService;
    private demoUserService;
    constructor(prisma: PrismaService, jwtService: JwtService, mailService: MailService, demoUserService: DemoUserService);
    private normalizeEmail;
    private normalizeExplicitUsername;
    private buildFallbackUsername;
    private withUsernameSuffix;
    private resolveUsername;
    private generateCode;
    private hashCode;
    private expiresIn;
    private verifyStoredCode;
    private issueFinixToken;
    private buildAuthResponse;
    private getManagedPasswordHash;
    private canUseInlineCodeFallback;
    private canUseDemoLogin;
    private isMailSandboxError;
    private deliverAuthCode;
    requestRegisterCode(email: string, username: string, password: string): Promise<{
        message: string;
        email: string;
        devCode?: undefined;
        delivery?: undefined;
    } | {
        message: string;
        email: string;
        devCode: string;
        delivery: string;
    }>;
    verifyRegisterCode(email: string, code: string): Promise<{
        token: string;
        user: {
            id: any;
            username: any;
            email: any;
            emailVerified: any;
            role: any;
            plan: any;
            accountType: any;
            subscriptionStatus: any;
            isInfluencer: any;
            isVerified: any;
            isCreator: any;
            bio: any;
            avatarUrl: any;
            onboardingCompleted: any;
            onboardingStep: any;
            createdAt: any;
        };
    }>;
    requestLoginCode(email: string, password: string): Promise<{
        message: string;
        email: string;
        devCode?: undefined;
        delivery?: undefined;
    } | {
        message: string;
        email: string;
        devCode: string;
        delivery: string;
    }>;
    verifyLoginCode(email: string, code: string): Promise<{
        token: string;
        user: {
            id: any;
            username: any;
            email: any;
            emailVerified: any;
            role: any;
            plan: any;
            accountType: any;
            subscriptionStatus: any;
            isInfluencer: any;
            isVerified: any;
            isCreator: any;
            bio: any;
            avatarUrl: any;
            onboardingCompleted: any;
            onboardingStep: any;
            createdAt: any;
        };
    }>;
    loginAsDemo(): Promise<{
        demo: boolean;
        credentials: {
            email: string;
            username: string;
            password: string;
        };
        token: string;
        user: {
            id: any;
            username: any;
            email: any;
            emailVerified: any;
            role: any;
            plan: any;
            accountType: any;
            subscriptionStatus: any;
            isInfluencer: any;
            isVerified: any;
            isCreator: any;
            bio: any;
            avatarUrl: any;
            onboardingCompleted: any;
            onboardingStep: any;
            createdAt: any;
        };
    }>;
    requestPasswordResetCode(email: string): Promise<{
        message: string;
        email: string;
        devCode?: undefined;
        delivery?: undefined;
    } | {
        message: string;
        email: string;
        devCode: string;
        delivery: string;
    } | {
        message: string;
    }>;
    resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<{
        message: string;
    }>;
    syncUser(supabaseId: string, email: string, username?: string): Promise<{
        id: any;
        username: any;
        email: any;
        emailVerified: any;
        role: any;
        plan: any;
        accountType: any;
        subscriptionStatus: any;
        isInfluencer: any;
        isVerified: any;
        isCreator: any;
        bio: any;
        avatarUrl: any;
        onboardingCompleted: any;
        onboardingStep: any;
        createdAt: any;
    }>;
    getProfile(supabaseId: string): Promise<{
        id: any;
        username: any;
        email: any;
        emailVerified: any;
        role: any;
        plan: any;
        accountType: any;
        subscriptionStatus: any;
        isInfluencer: any;
        isVerified: any;
        isCreator: any;
        bio: any;
        avatarUrl: any;
        onboardingCompleted: any;
        onboardingStep: any;
        createdAt: any;
    }>;
    private formatUser;
}
