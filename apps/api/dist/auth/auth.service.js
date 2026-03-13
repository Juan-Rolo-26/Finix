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
const jwt_1 = require("@nestjs/jwt");
const argon2 = require("argon2");
const crypto_1 = require("crypto");
const mail_service_1 = require("../mail/mail.service");
const prisma_service_1 = require("../prisma.service");
const upload_url_util_1 = require("../uploads/upload-url.util");
const EMAIL_VERIFICATION_TTL_MINUTES = 15;
const LOGIN_CODE_TTL_MINUTES = 10;
const RESET_PASSWORD_TTL_MINUTES = 15;
let AuthService = class AuthService {
    constructor(prisma, jwtService, mailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailService = mailService;
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    normalizeExplicitUsername(username) {
        if (typeof username !== 'string') {
            return null;
        }
        const normalized = username.trim();
        if (!normalized) {
            return null;
        }
        if (normalized.length < 3 || normalized.length > 20) {
            throw new common_1.BadRequestException('El nombre de usuario debe tener entre 3 y 20 caracteres');
        }
        return normalized;
    }
    buildFallbackUsername(email) {
        const localPart = email?.split('@')[0] ?? 'inversor';
        const normalized = localPart
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_]+/g, '_')
            .replace(/^_+|_+$/g, '');
        if (normalized.length >= 3) {
            return normalized.slice(0, 20);
        }
        return 'inversor';
    }
    withUsernameSuffix(baseUsername, attempt) {
        const suffix = `_${attempt}`;
        const maxBaseLength = Math.max(3, 20 - suffix.length);
        return `${baseUsername.slice(0, maxBaseLength)}${suffix}`;
    }
    async resolveUsername(email, requestedUsername, currentUserId) {
        const explicitUsername = this.normalizeExplicitUsername(requestedUsername);
        if (explicitUsername) {
            const usernameExists = await this.prisma.user.findUnique({
                where: { username: explicitUsername },
                select: { id: true },
            });
            if (usernameExists && usernameExists.id !== currentUserId) {
                throw new common_1.BadRequestException('El nombre de usuario ya está en uso');
            }
            return explicitUsername;
        }
        const baseUsername = this.buildFallbackUsername(email);
        for (let attempt = 0; attempt < 100; attempt += 1) {
            const candidate = attempt === 0
                ? baseUsername
                : this.withUsernameSuffix(baseUsername, attempt);
            const usernameExists = await this.prisma.user.findUnique({
                where: { username: candidate },
                select: { id: true },
            });
            if (!usernameExists || usernameExists.id === currentUserId) {
                return candidate;
            }
        }
        throw new common_1.BadRequestException('No se pudo asignar un nombre de usuario único');
    }
    generateCode() {
        return String((0, crypto_1.randomInt)(100000, 1_000_000));
    }
    hashCode(code) {
        return (0, crypto_1.createHash)('sha256').update(code).digest('hex');
    }
    expiresIn(minutes) {
        return new Date(Date.now() + minutes * 60 * 1000);
    }
    verifyStoredCode(storedHash, code, expiresAt) {
        if (!storedHash || !expiresAt || expiresAt.getTime() < Date.now()) {
            return false;
        }
        return storedHash === this.hashCode(code);
    }
    async issueFinixToken(user) {
        return this.jwtService.signAsync({
            email: user.email,
            username: user.username,
            provider: 'finix',
        }, {
            issuer: 'finix-api',
            subject: user.id,
        });
    }
    async buildAuthResponse(user) {
        return {
            token: await this.issueFinixToken(user),
            user: this.formatUser(user),
        };
    }
    getManagedPasswordHash(user) {
        if (!user.password || !user.password.startsWith('$argon2')) {
            return null;
        }
        return user.password;
    }
    async deliverAuthCode(params) {
        const { email, code, successMessage, send } = params;
        await send();
        return {
            message: successMessage,
            email,
        };
    }
    async requestRegisterCode(email, username, password) {
        const normalizedEmail = this.normalizeEmail(email);
        const existingUser = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingUser?.emailVerified) {
            if (this.getManagedPasswordHash(existingUser)) {
                throw new common_1.BadRequestException('Ya existe una cuenta con este email. Ingresá o restablecé tu contraseña.');
            }
            throw new common_1.BadRequestException('Este email ya está asociado a otra cuenta. Ingresá con tu método actual o creá una contraseña desde "Olvidé mi contraseña".');
        }
        const resolvedUsername = await this.resolveUsername(normalizedEmail, username, existingUser?.id);
        const passwordHash = await argon2.hash(password);
        const code = this.generateCode();
        const codeHash = this.hashCode(code);
        const codeExpiresAt = this.expiresIn(EMAIL_VERIFICATION_TTL_MINUTES);
        const user = existingUser
            ? await this.prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    email: normalizedEmail,
                    username: resolvedUsername,
                    password: passwordHash,
                    emailVerified: false,
                    isVerified: false,
                    emailVerificationCode: codeHash,
                    emailVerificationExpires: codeExpiresAt,
                    loginVerificationCode: null,
                    loginVerificationExpires: null,
                    resetPasswordToken: null,
                    resetPasswordExpires: null,
                },
            })
            : await this.prisma.user.create({
                data: {
                    email: normalizedEmail,
                    username: resolvedUsername,
                    password: passwordHash,
                    emailVerified: false,
                    isVerified: false,
                    plan: 'FREE',
                    role: 'USER',
                    emailVerificationCode: codeHash,
                    emailVerificationExpires: codeExpiresAt,
                },
            });
        return this.deliverAuthCode({
            email: user.email,
            code,
            successMessage: 'Te enviamos un codigo de verificacion a tu correo.',
            send: () => this.mailService.sendVerificationCode(normalizedEmail, code),
        });
    }
    async resendRegisterCode(email) {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user || user.emailVerified) {
            return {
                message: 'Si tu cuenta todavia no esta verificada, te reenviamos un nuevo codigo.',
                email: normalizedEmail,
            };
        }
        const code = this.generateCode();
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationCode: this.hashCode(code),
                emailVerificationExpires: this.expiresIn(EMAIL_VERIFICATION_TTL_MINUTES),
            },
        });
        return this.deliverAuthCode({
            email: normalizedEmail,
            code,
            successMessage: 'Te reenviamos un nuevo codigo de verificacion.',
            send: () => this.mailService.sendVerificationCode(normalizedEmail, code),
        });
    }
    async verifyRegisterCode(email, code) {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user || !this.verifyStoredCode(user.emailVerificationCode, code, user.emailVerificationExpires)) {
            throw new common_1.BadRequestException('El codigo de verificacion es invalido o vencio.');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                isVerified: true,
                emailVerificationCode: null,
                emailVerificationExpires: null,
                lastLogin: new Date(),
            },
        });
        return this.buildAuthResponse(updatedUser);
    }
    async login(email, password) {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('El correo o la contrasena no son correctos.');
        }
        const managedPasswordHash = this.getManagedPasswordHash(user);
        if (!managedPasswordHash) {
            throw new common_1.BadRequestException('Esta cuenta todavia no tiene una contrasena Finix. Usa "Olvide mi contrasena" para crearla.');
        }
        const isPasswordValid = await argon2.verify(managedPasswordHash, password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('El correo o la contrasena no son correctos.');
        }
        if (!user.emailVerified) {
            throw new common_1.BadRequestException('Primero verifica tu correo para terminar de crear la cuenta.');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
            },
        });
        return this.buildAuthResponse(updatedUser);
    }
    async requestLoginCode(email, password) {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('El correo o la contrasena no son correctos.');
        }
        const managedPasswordHash = this.getManagedPasswordHash(user);
        if (!managedPasswordHash) {
            throw new common_1.BadRequestException('Esta cuenta todavia no tiene una contraseña Finix. Usá "Olvidé mi contraseña" para crearla.');
        }
        const isPasswordValid = await argon2.verify(managedPasswordHash, password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('El correo o la contrasena no son correctos.');
        }
        if (!user.emailVerified) {
            throw new common_1.BadRequestException('Antes de ingresar tenés que verificar tu email.');
        }
        const code = this.generateCode();
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                loginVerificationCode: this.hashCode(code),
                loginVerificationExpires: this.expiresIn(LOGIN_CODE_TTL_MINUTES),
            },
        });
        return this.deliverAuthCode({
            email: user.email,
            code,
            successMessage: 'Te enviamos un codigo para confirmar el inicio de sesion.',
            send: () => this.mailService.sendLoginCode(normalizedEmail, code),
        });
    }
    async verifyLoginCode(email, code) {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user || !this.verifyStoredCode(user.loginVerificationCode, code, user.loginVerificationExpires)) {
            throw new common_1.BadRequestException('El codigo de acceso es invalido o vencio.');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                loginVerificationCode: null,
                loginVerificationExpires: null,
                lastLogin: new Date(),
            },
        });
        return this.buildAuthResponse(updatedUser);
    }
    async requestPasswordResetCode(email) {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            return {
                message: 'Si existe una cuenta con ese email, te enviamos un codigo para restablecer la contraseña.',
            };
        }
        const code = this.generateCode();
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: this.hashCode(code),
                resetPasswordExpires: this.expiresIn(RESET_PASSWORD_TTL_MINUTES),
            },
        });
        return this.deliverAuthCode({
            email: normalizedEmail,
            code,
            successMessage: 'Si existe una cuenta con ese email, te enviamos un codigo para restablecer la contraseña.',
            send: () => this.mailService.sendPasswordResetCode(normalizedEmail, code),
        });
    }
    async resetPasswordWithCode(email, code, newPassword) {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user || !this.verifyStoredCode(user.resetPasswordToken, code, user.resetPasswordExpires)) {
            throw new common_1.BadRequestException('El codigo para restablecer la contraseña es invalido o vencio.');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: await argon2.hash(newPassword),
                emailVerified: true,
                isVerified: true,
                resetPasswordToken: null,
                resetPasswordExpires: null,
                emailVerificationCode: null,
                emailVerificationExpires: null,
                loginVerificationCode: null,
                loginVerificationExpires: null,
            },
        });
        return {
            message: 'Tu contraseña fue actualizada. Ahora iniciá sesión y validá el codigo de acceso.',
        };
    }
    async syncUser(supabaseId, email, username) {
        const normalizedEmail = this.normalizeEmail(email);
        let user = await this.prisma.user.findUnique({ where: { id: supabaseId } });
        if (!user) {
            const emailConflict = await this.prisma.user.findUnique({
                where: { email: normalizedEmail },
                select: { id: true },
            });
            if (emailConflict && emailConflict.id !== supabaseId) {
                throw new common_1.BadRequestException('Este email ya está asociado a otra cuenta de Finix. Usá tu método de acceso original.');
            }
            const resolvedUsername = await this.resolveUsername(normalizedEmail, username);
            user = await this.prisma.user.create({
                data: {
                    id: supabaseId,
                    email: normalizedEmail,
                    username: resolvedUsername,
                    password: '',
                    emailVerified: true,
                    isVerified: true,
                    plan: 'FREE',
                    role: 'USER',
                },
            });
        }
        return this.formatUser(user);
    }
    async getProfile(supabaseId) {
        const user = await this.prisma.user.findUnique({ where: { id: supabaseId } });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuario no encontrado. Completá el registro primero.');
        }
        return this.formatUser(user);
    }
    formatUser(user) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            emailVerified: user.emailVerified,
            role: user.role,
            plan: user.plan,
            accountType: user.accountType,
            subscriptionStatus: user.subscriptionStatus,
            isInfluencer: user.isInfluencer,
            isVerified: user.isVerified,
            isCreator: user.isCreator,
            bio: user.bio ?? null,
            avatarUrl: (0, upload_url_util_1.normalizeStoredUploadUrl)(user.avatarUrl) ?? null,
            onboardingCompleted: user.onboardingCompleted,
            onboardingStep: user.onboardingStep,
            createdAt: user.createdAt,
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