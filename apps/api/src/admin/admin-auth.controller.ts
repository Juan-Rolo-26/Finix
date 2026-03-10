import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminRefreshDto, AdminLoginDto, AdminVerifyTwoFactorDto } from './dto/admin-auth.dto';
import { AdminGuard } from './admin.guard';

@Controller('admin/auth')
export class AdminAuthController {
    constructor(private readonly adminAuthService: AdminAuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: AdminLoginDto, @Req() req: Request) {
        return this.adminAuthService.login(dto, this.getRequestMeta(req));
    }

    @Post('verify-2fa')
    @HttpCode(HttpStatus.OK)
    async verifyTwoFactor(
        @Body() dto: AdminVerifyTwoFactorDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const session = await this.adminAuthService.verifyTwoFactor(dto, this.getRequestMeta(req));
        this.attachSessionCookies(res, session.accessToken, session.refreshToken);

        return {
            user: session.user,
            expiresInMs: session.accessTokenTtlMs,
        };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Body() dto: AdminRefreshDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const cookies = this.adminAuthService.getCookieNames();
        const cookieToken = req.cookies?.[cookies.refresh];
        const refreshToken = cookieToken || dto.refreshToken;

        const session = await this.adminAuthService.refreshSession(refreshToken, this.getRequestMeta(req));
        this.attachSessionCookies(res, session.accessToken, session.refreshToken);

        return {
            user: session.user,
            expiresInMs: session.accessTokenTtlMs,
        };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const cookies = this.adminAuthService.getCookieNames();
        const refreshToken = req.cookies?.[cookies.refresh];

        await this.adminAuthService.logout(refreshToken, this.getRequestMeta(req));
        this.clearSessionCookies(res);

        return { success: true };
    }

    @Get('me')
    @UseGuards(AdminGuard)
    async me(@Req() req: Request & { user?: { id: string } }) {
        if (!req.user?.id) {
            throw new UnauthorizedException('Sesión inválida');
        }

        const user = await this.adminAuthService.getMe(req.user.id);
        return { user };
    }

    private attachSessionCookies(res: Response, accessToken: string, refreshToken: string) {
        const cookieNames = this.adminAuthService.getCookieNames();
        res.cookie(cookieNames.access, accessToken, this.adminAuthService.buildAccessCookieOptions());
        res.cookie(cookieNames.refresh, refreshToken, this.adminAuthService.buildRefreshCookieOptions());
    }

    private clearSessionCookies(res: Response) {
        const cookieNames = this.adminAuthService.getCookieNames();
        const options = this.adminAuthService.buildClearCookieOptions();
        res.clearCookie(cookieNames.access, options);
        res.clearCookie(cookieNames.refresh, options);
    }

    private getRequestMeta(req: Request) {
        const forwardedFor = req.headers['x-forwarded-for'];
        const ip = typeof forwardedFor === 'string'
            ? forwardedFor.split(',')[0].trim()
            : req.ip || req.socket.remoteAddress || 'unknown';
        const userAgentHeader = req.headers['user-agent'];

        return {
            ip,
            userAgent: Array.isArray(userAgentHeader) ? userAgentHeader.join(' ') : userAgentHeader,
        };
    }
}
