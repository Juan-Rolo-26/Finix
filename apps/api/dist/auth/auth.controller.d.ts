import { AuthService } from './auth.service';
import { EmailCodeDto, EmailRequestDto, ForgotPasswordRequestDto, ForgotPasswordResetDto, LoginRequestDto, RegisterRequestDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    requestRegisterCode(body: RegisterRequestDto): Promise<{
        message: string;
        email: string;
    }>;
    resendRegisterCode(body: EmailRequestDto): Promise<{
        message: string;
        email: string;
    }>;
    verifyRegisterCode(body: EmailCodeDto): Promise<{
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
    login(body: LoginRequestDto): Promise<{
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
    requestLoginCode(body: LoginRequestDto): Promise<{
        message: string;
        email: string;
    }>;
    verifyLoginCode(body: EmailCodeDto): Promise<{
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
    requestPasswordResetCode(body: ForgotPasswordRequestDto): Promise<{
        message: string;
        email: string;
    } | {
        message: string;
    }>;
    resetPasswordWithCode(body: ForgotPasswordResetDto): Promise<{
        message: string;
    }>;
    syncUser(req: any, body: {
        username?: string;
    }): Promise<{
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
    getProfile(req: any): Promise<{
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
}
