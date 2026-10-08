import { Body, Controller, Get, Post, Query, HttpCode, HttpStatus, UseGuards, Request, Req, Res } from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleAuthService } from './google-auth.service';
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
    constructor(private authService: AuthService, private googleAuth: GoogleAuthService) { }

    @Get('providers')
    providers() { return { google: this.googleAuth.isConfigured() }; }

    @Get('google')
    async google(@Query('username') username: string | undefined, @Res() res: Response) {
        const flow = await this.googleAuth.start(username);
        res.cookie('finix_google_flow', flow.cookie, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth/google', maxAge: 600_000 });
        res.redirect(flow.url);
    }

    @Get('google/callback')
    async googleCallback(@Query('code') code: string, @Query('state') state: string, @Req() req: ExpressRequest, @Res() res: Response) {
        const cookie = req.cookies?.finix_google_flow;
        res.clearCookie('finix_google_flow', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth/google' });
        const destination = new URL('/auth/callback', process.env.FRONTEND_URL || 'http://localhost:5173');
        try {
            const user = await this.googleAuth.finish(code, state, cookie);
            const session = await this.authService.createPersistentSession(user.id, this.getRequestMeta(req));
            this.attachAuthCookies(res, session);
        } catch {
            destination.searchParams.set('error', 'No se pudo ingresar con Google. Volvé a intentarlo o recuperá tu contraseña.');
        }
        res.redirect(destination.toString());
    }

    @UseGuards(JwtAuthGuard)
    @Get('google/link')
    async linkGoogle(@Request() req: any, @Res() res: Response) {
        const flow = await this.googleAuth.start(undefined, req.user.id);
        res.cookie('finix_google_flow', flow.cookie, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth/google', maxAge: 600_000 });
        res.redirect(flow.url);
    }

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
    async refresh(@Body() body: any, @Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.finix_refresh_token || body?.refreshToken;
        const data = await this.authService.refreshSession(refreshToken, this.getRequestMeta(req));
        return this.attachAuthCookies(res, data);
    }

    @HttpCode(HttpStatus.OK)
    @Post('logout')
    async logout(@Body() body: any, @Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.finix_refresh_token || body?.refreshToken;
        await this.authService.logout(refreshToken);
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
     * Synchronizes the profile of an already authenticated Finix user.
     * Creates the Prisma User row if it doesn't exist yet (idempotent).
     * Requires a Finix access token or session cookie.
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

        // The verified identity also needs
        // its own persistent browser session so refresh works after a reload,
        // browser restart, or long inactivity. The cookie is HttpOnly and is
        // revoked only by /logout (or an administrator).
        const session = await this.authService.createPersistentSession(
            user.id,
            this.getRequestMeta(httpReq),
        );
        this.attachAuthCookies(res, session);

        // Return user with persistent token and refresh token
        return {
            ...user,
            token: session.token,
            refreshToken: session.refreshToken,
        };
    }

    /**
     * Returns the Prisma profile for the currently authenticated user.
     * Called after login to hydrate the frontend store.
     */
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.id);
    }

    private attachAuthCookies(res: Response, data: { token: string; refreshToken?: string; user: unknown }) {
        const secure = process.env.NODE_ENV === 'production';
        const maxAge = this.authService.getRefreshTtlMs();
        const cookieOptions = {
            httpOnly: true,
            secure,
            sameSite: 'lax' as const,
            path: '/',
            maxAge,
        };

        res.cookie('finix_token', data.token, cookieOptions);
        if (data.refreshToken) {
            res.cookie('finix_refresh_token', data.refreshToken, cookieOptions);
        }

        return data;
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
