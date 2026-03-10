import { Body, Controller, Get, Post, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
    EmailCodeDto,
    ForgotPasswordRequestDto,
    ForgotPasswordResetDto,
    LoginRequestDto,
    RegisterRequestDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @HttpCode(HttpStatus.OK)
    @Post('register/request-code')
    requestRegisterCode(@Body() body: RegisterRequestDto) {
        return this.authService.requestRegisterCode(body.email, body.username, body.password);
    }

    @HttpCode(HttpStatus.OK)
    @Post('register/verify-code')
    verifyRegisterCode(@Body() body: EmailCodeDto) {
        return this.authService.verifyRegisterCode(body.email, body.code);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login/request-code')
    requestLoginCode(@Body() body: LoginRequestDto) {
        return this.authService.requestLoginCode(body.email, body.password);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login/verify-code')
    verifyLoginCode(@Body() body: EmailCodeDto) {
        return this.authService.verifyLoginCode(body.email, body.code);
    }

    @HttpCode(HttpStatus.OK)
    @Post('demo-login')
    loginAsDemo() {
        return this.authService.loginAsDemo();
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
