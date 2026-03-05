import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { RegisterDto, LoginDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto } from '@finix/shared';
import { User } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async register(dto: RegisterDto) {
        // Specific checks for duplicates
        const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (emailExists) {
            throw new BadRequestException('El correo electrónico ya está registrado');
        }

        const usernameExists = await this.prisma.user.findUnique({ where: { username: dto.username } });
        if (usernameExists) {
            throw new BadRequestException('El nombre de usuario ya está en uso');
        }

        const hashedPassword = await argon2.hash(dto.password);

        // Generate a 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpires = new Date();
        verificationExpires.setMinutes(verificationExpires.getMinutes() + 15);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                username: dto.username,
                password: hashedPassword,
                emailVerificationCode: verificationCode,
                emailVerificationExpires: verificationExpires,
                emailVerified: false,
                isVerified: false,
            },
        });

        try {
            await this.mailService.sendVerificationCode(user.email, verificationCode);
        } catch (error: any) {
            const errMsg = error?.response || error?.message || '';
            if (errMsg.includes('550')) {
                console.warn(`\n=== 🚧 [MODO DEV - EMAIL SIMULADO] 🚧 ===\nEl email hacia ${user.email} fue bloqueado por seguridad de Resend.\n> Tu CÓDIGO de verificación es: ${verificationCode}\nCópialo y pégalo en la aplicación para continuar.\n=========================================\n`);
            } else {
                console.error("Error al enviar email de verificación:", error);
                throw new BadRequestException('Fallo al enviar el código de verificación.');
            }
        }

        return this.signToken(user);
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const valid = await argon2.verify(user.password, dto.password);
        if (!valid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Generate a new verification code for LOGIN
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpires = new Date();
        verificationExpires.setMinutes(verificationExpires.getMinutes() + 15);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationCode: verificationCode,
                emailVerificationExpires: verificationExpires,
            },
        });

        try {
            await this.mailService.sendVerificationCode(user.email, verificationCode);
        } catch (error: any) {
            const errMsg = error?.response || error?.message || '';
            if (errMsg.includes('550')) {
                console.warn(`\n=== 🚧 [MODO DEV - EMAIL SIMULADO] 🚧 ===\nEl email al intentar iniciar sesión (hacia ${user.email}) fue bloqueado.\n> Tu CÓDIGO de verificación es: ${verificationCode}\nCópialo y pégalo en la aplicación.\n=========================================\n`);
            } else {
                console.error("Error al enviar email de verificación al login:", error);
                throw new BadRequestException('Fallo al enviar el código de verificación.');
            }
        }

        const tokenData = await this.signToken(user);
        // Force the frontend to show the verify-email page
        tokenData.user.isVerified = false;

        return tokenData;
    }

    async verifyEmail(dto: VerifyEmailDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            throw new BadRequestException('Usuario no encontrado');
        }

        if (user.emailVerificationCode !== dto.code || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
            throw new BadRequestException('Código inválido o expirado');
        }

        await this.prisma.user.update({
            where: { email: dto.email },
            data: {
                emailVerified: true,
                emailVerificationCode: null,
                emailVerificationExpires: null,
                isVerified: true,
            },
        });

        return { message: 'Correo electrónico verificado exitosamente' };
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            throw new BadRequestException('No existe un usuario con ese correo electrónico');
        }

        const resetToken = randomBytes(32).toString('hex');
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 1);

        await this.prisma.user.update({
            where: { email: dto.email },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetExpires,
            },
        });

        try {
            // Wait for the email to send so we can catch errors (like Resend blocking emails to unverified domains)
            await this.mailService.sendPasswordResetLink(user.email, resetToken);
        } catch (error: any) {
            const errMsg = error?.response || error?.message || '';
            if (errMsg.includes('550')) {
                const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
                console.warn(`\n=== 🚧 [MODO DEV - EMAIL SIMULADO] 🚧 ===\nEl email de restablecimiento hacia ${user.email} fue bloqueado.\n> ENLACE PARA RESTABLECER TU CONTRASEÑA:\n${resetLink}\nHaz Ctrl+Click (o Cmd+Click) en el enlace de arriba para abrirlo.\n=========================================\n`);
            } else {
                console.error("Error al enviar email:", error);
                throw new BadRequestException('Fallo al enviar el correo. Intenta de nuevo.');
            }
        }

        return { message: 'Se ha enviado un enlace para restablecer la contraseña a su correo' };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetPasswordToken: dto.token,
                resetPasswordExpires: { gt: new Date() },
            },
        });

        if (!user) {
            throw new BadRequestException('El enlace para restablecer la contraseña es inválido o ha expirado');
        }

        const hashedPassword = await argon2.hash(dto.newPassword);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });

        return { message: 'Contraseña restablecida exitosamente' };
    }

    private async signToken(user: User) {
        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
            plan: user.plan,
            subscriptionStatus: user.subscriptionStatus,
        };
        const token = await this.jwtService.signAsync(payload);
        return {
            access_token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email,
                plan: user.plan,
                accountType: user.accountType,
                subscriptionStatus: user.subscriptionStatus,
                isInfluencer: user.isInfluencer,
                isVerified: user.isVerified,
                isCreator: user.isCreator,
                bio: user.bio ?? null,
                avatarUrl: user.avatarUrl ?? null,
                onboardingCompleted: user.onboardingCompleted,
                onboardingStep: user.onboardingStep,
                createdAt: user.createdAt,
            }
        };
    }
}
