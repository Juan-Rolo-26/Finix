import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private mailService;
    constructor(prisma: PrismaService, jwtService: JwtService, mailService: MailService);
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
    private deliverAuthCode;
    requestRegisterCode(email: string, username: string, password: string): Promise<{
        message: string;
        email: string;
    }>;
    resendRegisterCode(email: string): Promise<{
        message: string;
        email: string;
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
    login(email: string, password: string): Promise<{
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
    requestPasswordResetCode(email: string): Promise<{
        message: string;
        email: string;
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
