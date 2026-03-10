import type { Request, Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminRefreshDto, AdminLoginDto, AdminVerifyTwoFactorDto } from './dto/admin-auth.dto';
export declare class AdminAuthController {
    private readonly adminAuthService;
    constructor(adminAuthService: AdminAuthService);
    login(dto: AdminLoginDto, req: Request): Promise<{
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
    verifyTwoFactor(dto: AdminVerifyTwoFactorDto, req: Request, res: Response): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
            role: string;
        };
        expiresInMs: number;
    }>;
    refresh(dto: AdminRefreshDto, req: Request, res: Response): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
            role: string;
        };
        expiresInMs: number;
    }>;
    logout(req: Request, res: Response): Promise<{
        success: boolean;
    }>;
    me(req: Request & {
        user?: {
            id: string;
        };
    }): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
            role: string;
            adminTwoFactorEnabled: boolean;
        };
    }>;
    private attachSessionCookies;
    private clearSessionCookies;
    private getRequestMeta;
}
