import { Body, Controller, Get, Post, HttpCode, HttpStatus, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
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
    async verifyRegisterCode(@Body() body: EmailCodeDto, @Res({ passthrough: true }) res: Response) {
        const data = await this.authService.verifyRegisterCode(body.email, body.code);
        res.cookie('finix_token', data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return data;
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() body: LoginRequestDto, @Res({ passthrough: true }) res: Response) {
        const data = await this.authService.login(body.email, body.password);
        res.cookie('finix_token', data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return data;
    }

    @HttpCode(HttpStatus.OK)
    @Post('login/request-code')
    requestLoginCode(@Body() body: LoginRequestDto) {
        return this.authService.requestLoginCode(body.email, body.password);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login/verify-code')
    async verifyLoginCode(@Body() body: EmailCodeDto, @Res({ passthrough: true }) res: Response) {
        const data = await this.authService.verifyLoginCode(body.email, body.code);
        res.cookie('finix_token', data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return data;
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
    syncUser(@Request() req: any, @Body() body: { username?: string }) {
        return this.authService.syncUser(
            req.user.id,
            req.user.email,
            body.username ?? req.user.username,
        );
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
}
