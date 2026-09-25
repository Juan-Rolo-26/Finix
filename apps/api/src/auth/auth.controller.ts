import { Body, Controller, Get, Post, HttpCode, HttpStatus, UseGuards, Request, Req, Res } from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
    EmailCodeDto,
    EmailRequestDto,
    ForgotPasswordRequestDto,
    ForgotPasswordResetDto,
    LoginRequestDto,
    RegisterRequestDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @HttpCode(HttpStatus.OK)
    @Post('register/request-code')
    requestRegisterCode(@Body() body: RegisterRequestDto) {
        return this.authService.requestRegisterCode(body.email, body.username, body.password);
    }

    @HttpCode(HttpStatus.OK)
    @Post('register/resend-code')
    resendRegisterCode(@Body() body: EmailRequestDto) {
        return this.authService.resendRegisterCode(body.email);
    }

    @HttpCode(HttpStatus.OK)
    @Post('register/verify-code')
    async verifyRegisterCode(@Body() body: EmailCodeDto, @Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
        const data = await this.authService.verifyRegisterCode(body.email, body.code, this.getRequestMeta(req));
        return this.attachAuthCookies(res, data);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() body: LoginRequestDto, @Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
        const data = await this.authService.login(body.email, body.password, this.getRequestMeta(req));
        return this.attachAuthCookies(res, data);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login/request-code')
    requestLoginCode(@Body() body: LoginRequestDto) {
        return this.authService.requestLoginCode(body.email, body.password);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login/verify-code')
    async verifyLoginCode(@Body() body: EmailCodeDto, @Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
        const data = await this.authService.verifyLoginCode(body.email, body.code, this.getRequestMeta(req));
        return this.attachAuthCookies(res, data);
    }

    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    async refresh(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.finix_refresh_token;
        const data = await this.authService.refreshSession(refreshToken, this.getRequestMeta(req));
        return this.attachAuthCookies(res, data);
    }

    @HttpCode(HttpStatus.OK)
    @Post('logout')
    async logout(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
        await this.authService.logout(req.cookies?.finix_refresh_token);
        this.clearAuthCookies(res);
        return { success: true };
    }

    @HttpCode(HttpStatus.OK)
    @Post('forgot/request-code')
    requestPasswordResetCode(@Body() body: ForgotPasswordRequestDto) {
        return this.authService.requestPasswordResetCode(body.email);
    }

    @HttpCode(HttpStatus.OK)
    @Post('forgot/reset')
    resetPasswordWithCode(@Body() body: ForgotPasswordResetDto) {
        return this.authService.resetPasswordWithCode(body.email, body.code, body.newPassword);
    }

    /**
     * Called by the frontend after a Supabase signup or OAuth login.
     * Creates the Prisma User row if it doesn't exist yet (idempotent).
     * Requires the Supabase JWT in the Authorization header.
     */
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('sync-user')
    async syncUser(
        @Request() req: any,
        @Body() body: { username?: string },
        @Req() httpReq: ExpressRequest,
        @Res({ passthrough: true }) res: Response,
    ) {
        const user = await this.authService.syncUser(
            req.user.id,
            req.user.email,
            body.username ?? req.user.username,
        );

        // Supabase/Google gives us the identity token, but Finix also needs
        // its own long-lived browser session so refresh works after a reload
        // or browser restart. The cookie is HttpOnly and is revoked by /logout.
        const session = await this.authService.createPersistentSession(
            user.id,
            this.getRequestMeta(httpReq),
        );
        this.attachAuthCookies(res, session);

        // Keep the existing frontend contract: sync-user returns the profile.
        return user;
    }

    /**
     * Returns the Prisma profile for the currently authenticated user.
     * Called after every Supabase login to hydrate the frontend store.
     */
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.id);
    }

    private attachAuthCookies(res: Response, data: { token: string; refreshToken?: string; user: unknown }) {
        const secure = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            httpOnly: true,
            secure,
            sameSite: 'lax' as const,
            path: '/api',
        };

        res.cookie('finix_token', data.token, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });
        if (data.refreshToken) {
            res.cookie('finix_refresh_token', data.refreshToken, {
                ...cookieOptions,
                maxAge: this.authService.getRefreshTtlMs(),
            });
        }

        const { refreshToken: _refreshToken, ...safeData } = data;
        return safeData;
    }

    private clearAuthCookies(res: Response) {
        const secure = process.env.NODE_ENV === 'production';
        for (const path of ['/', '/api']) {
            res.clearCookie('finix_token', { httpOnly: true, secure, sameSite: 'lax', path });
            res.clearCookie('finix_refresh_token', { httpOnly: true, secure, sameSite: 'lax', path });
        }
    }

    private getRequestMeta(req: ExpressRequest) {
        const forwardedFor = req.headers['x-forwarded-for'];
        const ip = typeof forwardedFor === 'string'
            ? forwardedFor.split(',')[0].trim()
            : req.ip || req.socket.remoteAddress || undefined;
        const userAgent = req.headers['user-agent'];
        return {
            ip,
            userAgent: Array.isArray(userAgent) ? userAgent.join(' ') : userAgent,
        };
    }
}
