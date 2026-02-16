import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from '@finix/shared';
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
            isInfluencer: boolean;
            bio: string;
            avatarUrl: string;
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
            isInfluencer: boolean;
            bio: string;
            avatarUrl: string;
            createdAt: Date;
        };
    }>;
}
