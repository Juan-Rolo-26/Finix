"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const jwt_1 = require("@nestjs/jwt");
const argon2 = require("argon2");
const mail_service_1 = require("../mail/mail.service");
const crypto_1 = require("crypto");
let AuthService = class AuthService {
    constructor(prisma, jwtService, mailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailService = mailService;
    }
    async register(dto) {
        const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (emailExists) {
            throw new common_1.BadRequestException('El correo electrónico ya está registrado');
        }
        const usernameExists = await this.prisma.user.findUnique({ where: { username: dto.username } });
        if (usernameExists) {
            throw new common_1.BadRequestException('El nombre de usuario ya está en uso');
        }
        const hashedPassword = await argon2.hash(dto.password);
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
        }
        catch (error) {
            const errMsg = error?.response || error?.message || '';
            if (errMsg.includes('550')) {
                console.warn(`\n=== 🚧 [MODO DEV - EMAIL SIMULADO] 🚧 ===\nEl email hacia ${user.email} fue bloqueado por seguridad de Resend.\n> Tu CÓDIGO de verificación es: ${verificationCode}\nCópialo y pégalo en la aplicación para continuar.\n=========================================\n`);
            }
            else {
                console.error("Error al enviar email de verificación:", error);
                throw new common_1.BadRequestException('Fallo al enviar el código de verificación.');
            }
        }
        return this.signToken(user);
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const valid = await argon2.verify(user.password, dto.password);
        if (!valid) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
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
        }
        catch (error) {
            const errMsg = error?.response || error?.message || '';
            if (errMsg.includes('550')) {
                console.warn(`\n=== 🚧 [MODO DEV - EMAIL SIMULADO] 🚧 ===\nEl email al intentar iniciar sesión (hacia ${user.email}) fue bloqueado.\n> Tu CÓDIGO de verificación es: ${verificationCode}\nCópialo y pégalo en la aplicación.\n=========================================\n`);
            }
            else {
                console.error("Error al enviar email de verificación al login:", error);
                throw new common_1.BadRequestException('Fallo al enviar el código de verificación.');
            }
        }
        const tokenData = await this.signToken(user);
        tokenData.user.isVerified = false;
        return tokenData;
    }
    async verifyEmail(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            throw new common_1.BadRequestException('Usuario no encontrado');
        }
        if (user.emailVerificationCode !== dto.code || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
            throw new common_1.BadRequestException('Código inválido o expirado');
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
    async forgotPassword(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            throw new common_1.BadRequestException('No existe un usuario con ese correo electrónico');
        }
        const resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
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
            await this.mailService.sendPasswordResetLink(user.email, resetToken);
        }
        catch (error) {
            const errMsg = error?.response || error?.message || '';
            if (errMsg.includes('550')) {
                const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
                console.warn(`\n=== 🚧 [MODO DEV - EMAIL SIMULADO] 🚧 ===\nEl email de restablecimiento hacia ${user.email} fue bloqueado.\n> ENLACE PARA RESTABLECER TU CONTRASEÑA:\n${resetLink}\nHaz Ctrl+Click (o Cmd+Click) en el enlace de arriba para abrirlo.\n=========================================\n`);
            }
            else {
                console.error("Error al enviar email:", error);
                throw new common_1.BadRequestException('Fallo al enviar el correo. Intenta de nuevo.');
            }
        }
        return { message: 'Se ha enviado un enlace para restablecer la contraseña a su correo' };
    }
    async resetPassword(dto) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetPasswordToken: dto.token,
                resetPasswordExpires: { gt: new Date() },
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('El enlace para restablecer la contraseña es inválido o ha expirado');
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
    async signToken(user) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map