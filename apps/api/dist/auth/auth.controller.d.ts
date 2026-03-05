import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto } from '@finix/shared';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            role: string;
            email: string;
            plan: string;
            accountType: string;
            subscriptionStatus: string;
            isInfluencer: boolean;
            isVerified: boolean;
            isCreator: boolean;
            bio: string;
            avatarUrl: string;
            onboardingCompleted: boolean;
            onboardingStep: number;
            createdAt: Date;
        };
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            role: string;
            email: string;
            plan: string;
            accountType: string;
            subscriptionStatus: string;
            isInfluencer: boolean;
            isVerified: boolean;
            isCreator: boolean;
            bio: string;
            avatarUrl: string;
            onboardingCompleted: boolean;
            onboardingStep: number;
            createdAt: Date;
        };
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
