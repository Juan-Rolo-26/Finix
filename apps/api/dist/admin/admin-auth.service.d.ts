import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { AdminLoginDto, AdminVerifyTwoFactorDto } from './dto/admin-auth.dto';
import { AdminAuditService } from './admin-audit.service';
interface RequestMeta {
    ip: string;
    userAgent?: string;
}
export declare class AdminAuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly adminAuditService;
    private readonly accessCookieName;
    private readonly refreshCookieName;
    private readonly accessTtlSeconds;
    private readonly refreshTtlSeconds;
    private readonly setupTokenTtl;
    private readonly preAuthTokenTtl;
    private readonly ipWindowMs;
    private readonly ipMaxAttempts;
    private readonly ipBlockMs;
    private readonly ipAttempts;
    constructor(prisma: PrismaService, jwtService: JwtService, adminAuditService: AdminAuditService);
    getCookieNames(): {
        access: string;
        refresh: string;
    };
    buildAccessCookieOptions(): {
        httpOnly: boolean;
        secure: boolean;
        sameSite: "strict";
        path: string;
        maxAge: number;
    };
    buildRefreshCookieOptions(): {
        httpOnly: boolean;
        secure: boolean;
        sameSite: "strict";
        path: string;
        maxAge: number;
    };
    buildClearCookieOptions(): {
        httpOnly: boolean;
        secure: boolean;
        sameSite: "strict";
        path: string;
    };
    login(dto: AdminLoginDto, meta: RequestMeta): Promise<{
        step: "SETUP_2FA";
        token: string;
        secret: string;
        otpauthUrl: string;
    } | {
        step: "VERIFY_2FA";
        token: string;
        secret?: undefined;
        otpauthUrl?: undefined;
    }>;
    verifyTwoFactor(dto: AdminVerifyTwoFactorDto, meta: RequestMeta): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
            role: string;
        };
        sessionId: string;
        accessToken: string;
        refreshToken: string;
        accessTokenTtlMs: number;
        refreshTokenTtlMs: number;
    }>;
    refreshSession(refreshToken: string | undefined, meta: RequestMeta): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
            role: string;
        };
        sessionId: string;
        accessToken: string;
        refreshToken: string;
        accessTokenTtlMs: number;
        refreshTokenTtlMs: number;
    }>;
    logout(refreshToken: string | undefined, meta?: RequestMeta): Promise<{
        success: boolean;
    }>;
    getMe(userId: string): Promise<{
        id: string;
        email: string;
        username: string;
        role: string;
        adminTwoFactorEnabled: boolean;
    }>;
    private completeTwoFactorSetup;
    private assertValidTwoFactorCode;
    private createSessionTokens;
    private rotateSessionTokens;
    private hashToken;
    private encryptSecret;
    private decryptSecret;
    private getEncryptionKey;
    private verifyAndMaybeUpgradePassword;
    private assertRoleAndOwner;
    private assertNotLocked;
    private registerFailedUserAttempt;
    private clearFailedUserAttempts;
    private isAdminRole;
    private buildRateKey;
    private assertIpRateLimit;
    private recordFailedIpAttempt;
    private clearIpAttempts;
    private throwTooManyRequests;
}
export {};
