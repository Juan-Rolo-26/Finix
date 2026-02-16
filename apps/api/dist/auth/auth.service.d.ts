import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto } from '@finix/shared';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
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
    private signToken;
}
