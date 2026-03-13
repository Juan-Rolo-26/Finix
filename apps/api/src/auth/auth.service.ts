import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomInt } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma.service';
import { normalizeStoredUploadUrl } from '../uploads/upload-url.util';

const EMAIL_VERIFICATION_TTL_MINUTES = 15;
const LOGIN_CODE_TTL_MINUTES = 10;
const RESET_PASSWORD_TTL_MINUTES = 15;

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) {}

    private normalizeEmail(email: string) {
        return email.trim().toLowerCase();
    }

    private normalizeExplicitUsername(username?: string) {
        if (typeof username !== 'string') {
            return null;
        }
        const normalized = username.trim();
        if (!normalized) {
            return null;
        }
        if (normalized.length < 3 || normalized.length > 20) {
            throw new BadRequestException('El nombre de usuario debe tener entre 3 y 20 caracteres');
        }
        return normalized;
    }

    private buildFallbackUsername(email?: string) {
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

    private withUsernameSuffix(baseUsername: string, attempt: number) {
        const suffix = `_${attempt}`;
        const maxBaseLength = Math.max(3, 20 - suffix.length);
        return `${baseUsername.slice(0, maxBaseLength)}${suffix}`;
    }

    private async resolveUsername(email: string, requestedUsername?: string, currentUserId?: string) {
        const explicitUsername = this.normalizeExplicitUsername(requestedUsername);
        if (explicitUsername) {
            const usernameExists = await this.prisma.user.findUnique({
                where: { username: explicitUsername },
                select: { id: true },
            });
            if (usernameExists && usernameExists.id !== currentUserId) {
                throw new BadRequestException('El nombre de usuario ya está en uso');
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

        throw new BadRequestException('No se pudo asignar un nombre de usuario único');
    }

    private generateCode() {
        return String(randomInt(100000, 1_000_000));
    }

    private hashCode(code: string) {
        return createHash('sha256').update(code).digest('hex');
    }

    private expiresIn(minutes: number) {
        return new Date(Date.now() + minutes * 60 * 1000);
    }

    private verifyStoredCode(storedHash: string | null | undefined, code: string, expiresAt?: Date | null) {
        if (!storedHash || !expiresAt || expiresAt.getTime() < Date.now()) {
            return false;
        }
        return storedHash === this.hashCode(code);
    }

    private async issueFinixToken(user: any) {
        return this.jwtService.signAsync(
            {
                email: user.email,
                username: user.username,
                provider: 'finix',
            },
            {
                issuer: 'finix-api',
                subject: user.id,
            },
        );
    }

    private async buildAuthResponse(user: any) {
        return {
            token: await this.issueFinixToken(user),
            user: this.formatUser(user),
        };
    }

    private getManagedPasswordHash(user: { password?: string | null }) {
        if (!user.password || !user.password.startsWith('$argon2')) {
            return null;
        }
        return user.password;
    }

    private async deliverAuthCode(params: {
        email: string;
        code: string;
        successMessage: string;
        send: () => Promise<unknown>;
    }) {
        const { email, code, successMessage, send } = params;

        await send();
        return {
            message: successMessage,
            email,
        };
    }

    async requestRegisterCode(email: string, username: string, password: string) {
        const normalizedEmail = this.normalizeEmail(email);
        const existingUser = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingUser?.emailVerified) {
            if (this.getManagedPasswordHash(existingUser)) {
                throw new BadRequestException('Ya existe una cuenta con este email. Ingresá o restablecé tu contraseña.');
            }
            throw new BadRequestException('Este email ya está asociado a otra cuenta. Ingresá con tu método actual o creá una contraseña desde "Olvidé mi contraseña".');
        }

        const resolvedUsername = await this.resolveUsername(
            normalizedEmail,
            username,
            existingUser?.id,
        );
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

    async resendRegisterCode(email: string) {
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

    async verifyRegisterCode(email: string, code: string) {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user || !this.verifyStoredCode(user.emailVerificationCode, code, user.emailVerificationExpires)) {
            throw new BadRequestException('El codigo de verificacion es invalido o vencio.');
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

    async login(email: string, password: string) {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            throw new UnauthorizedException('El correo o la contrasena no son correctos.');
        }

        const managedPasswordHash = this.getManagedPasswordHash(user);
        if (!managedPasswordHash) {
            throw new BadRequestException('Esta cuenta todavia no tiene una contrasena Finix. Usa "Olvide mi contrasena" para crearla.');
        }

        const isPasswordValid = await argon2.verify(managedPasswordHash, password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('El correo o la contrasena no son correctos.');
        }

        if (!user.emailVerified) {
            throw new BadRequestException('Primero verifica tu correo para terminar de crear la cuenta.');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
            },
        });

        return this.buildAuthResponse(updatedUser);
    }

    async requestLoginCode(email: string, password: string) {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            throw new UnauthorizedException('El correo o la contrasena no son correctos.');
        }

        const managedPasswordHash = this.getManagedPasswordHash(user);
        if (!managedPasswordHash) {
            throw new BadRequestException('Esta cuenta todavia no tiene una contraseña Finix. Usá "Olvidé mi contraseña" para crearla.');
        }

        const isPasswordValid = await argon2.verify(managedPasswordHash, password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('El correo o la contrasena no son correctos.');
        }

        if (!user.emailVerified) {
            throw new BadRequestException('Antes de ingresar tenés que verificar tu email.');
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

    async verifyLoginCode(email: string, code: string) {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user || !this.verifyStoredCode(user.loginVerificationCode, code, user.loginVerificationExpires)) {
            throw new BadRequestException('El codigo de acceso es invalido o vencio.');
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

    async requestPasswordResetCode(email: string) {
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

    async resetPasswordWithCode(email: string, code: string, newPassword: string) {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user || !this.verifyStoredCode(user.resetPasswordToken, code, user.resetPasswordExpires)) {
            throw new BadRequestException('El codigo para restablecer la contraseña es invalido o vencio.');
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

    /**
     * Called after a user signs up or logs in via Supabase Auth.
     * Creates a Prisma User row if it doesn't exist yet (idempotent).
     * The supabaseId is the Supabase auth.users.id, which becomes our User.id.
     */
    async syncUser(supabaseId: string, email: string, username?: string) {
        const normalizedEmail = this.normalizeEmail(email);
        let user = await this.prisma.user.findUnique({ where: { id: supabaseId } });

        if (!user) {
            const emailConflict = await this.prisma.user.findUnique({
                where: { email: normalizedEmail },
                select: { id: true },
            });
            if (emailConflict && emailConflict.id !== supabaseId) {
                throw new BadRequestException('Este email ya está asociado a otra cuenta de Finix. Usá tu método de acceso original.');
            }

            // First time this Supabase user hits our backend — create Prisma row
            const resolvedUsername = await this.resolveUsername(normalizedEmail, username);

            user = await this.prisma.user.create({
                data: {
                    id: supabaseId,
                    email: normalizedEmail,
                    username: resolvedUsername,
                    password: '',          // Supabase manages authentication
                    emailVerified: true,   // Supabase already verified the email
                    isVerified: true,
                    plan: 'FREE',
                    role: 'USER',
                },
            });
        }

        return this.formatUser(user);
    }

    /**
     * Returns the Prisma user profile for an authenticated Supabase user.
     */
    async getProfile(supabaseId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: supabaseId } });
        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado. Completá el registro primero.');
        }
        return this.formatUser(user);
    }

    private formatUser(user: any) {
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
            avatarUrl: normalizeStoredUploadUrl(user.avatarUrl) ?? null,
            onboardingCompleted: user.onboardingCompleted,
            onboardingStep: user.onboardingStep,
            createdAt: user.createdAt,
        };
    }
}
