import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto } from '@finix/shared';
import { MailService } from '../mail/mail.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private mailService;
    constructor(prisma: PrismaService, jwtService: JwtService, mailService: MailService);
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
    private signToken;
}
