import { BadRequestException, Injectable, UnauthorizedException, OnModuleInit, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomInt, randomUUID } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma.service';
import { normalizeStoredUploadUrl } from '../uploads/upload-url.util';
import { hasEffectiveProAccess } from './pro-access';

const EMAIL_VERIFICATION_TTL_MINUTES = 15;
const LOGIN_CODE_TTL_MINUTES = 10;
const RESET_PASSWORD_TTL_MINUTES = 15;
// Finix sessions are intentionally persistent. They are revoked explicitly by
// /auth/logout (or by an administrator), never because the browser was closed
// or because a fixed amount of time elapsed. A finite TTL can still be enabled
// with AUTH_REFRESH_TTL_SECONDS when an installation requires it.
const DEFAULT_REFRESH_TTL_SECONDS: number | null = null;
const PERSISTENT_COOKIE_MAX_AGE_MS = 10 * 365 * 24 * 60 * 60 * 1000;

interface SessionMeta {
    ip?: string;
    userAgent?: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    isJuanUser(u?: any): boolean {
        if (!u) return false;
        const username = String(u.username || '').trim().toLowerCase();
        const email = String(u.email || '').trim().toLowerCase();
        const configuredUsernames = (process.env.ADMIN_OWNER_USERNAMES || 'juan26-08,juan2608,juan26_08').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
        const configuredEmails = (process.env.ADMIN_OWNER_EMAILS || process.env.ADMIN_OWNER_EMAIL || 'juanpablorolo2007@gmail.com').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
        return (
            configuredUsernames.includes(username) ||
            username.includes('juan26') ||
            configuredEmails.includes(email) ||
            email.includes('juanpablorolo')
        );
    }

    async onModuleInit() {
        try {
            const res = await this.prisma.user.updateMany({
                where: {
                    OR: [
                        { username: { contains: 'juan26', mode: 'insensitive' } },
                        { email: { contains: 'juanpablorolo', mode: 'insensitive' } },
                    ]
                },
                data: {
                    plan: 'PRO',
                    accountType: 'PRO',
                    subscriptionStatus: 'ACTIVE',
                    role: 'ADMIN',
                    isCreator: true,
                }
            });
            if (res.count > 0) {
                this.logger.log(`[AuthService] Usuario juan26 actualizado con éxito a PRO y ADMIN (${res.count} registros).`);
            }
        } catch (e: any) {
            this.logger.warn(`[AuthService] Auto-upgrade juan26: ${e.message}`);
        }
    }

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
        
        const existingUsers = await this.prisma.user.findMany({
            where: { username: { startsWith: baseUsername } },
            select: { username: true, id: true },
        });

        // If the base username is not taken, or it belongs to the current user
        const baseMatch = existingUsers.find(u => u.username === baseUsername);
        if (!baseMatch || baseMatch.id === currentUserId) {
            return baseUsername;
        }

        const takenSuffixes = new Set<number>();
        for (const user of existingUsers) {
            if (user.username.startsWith(baseUsername)) {
                const suffix = user.username.slice(baseUsername.length);
                const num = parseInt(suffix, 10);
                if (!isNaN(num)) {
                    takenSuffixes.add(num);
                }
            }
        }

        for (let attempt = 1; attempt < 1000; attempt++) {
            if (!takenSuffixes.has(attempt)) {
                return this.withUsernameSuffix(baseUsername, attempt);
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

    private async issueFinixToken(user: any, sessionId: string) {
        return this.jwtService.signAsync(
            {
                email: user.email,
                username: user.username,
                provider: 'finix',
                sid: sessionId,
            },
            {
                issuer: 'finix-api',
                subject: user.id,
                expiresIn: process.env.JWT_EXPIRES_IN || '15m',
            },
        );
    }

    private get refreshTtlSeconds(): number | null {
        const raw = process.env.AUTH_REFRESH_TTL_SECONDS?.trim().toLowerCase();
        if (!raw || raw === '0' || raw === 'never' || raw === 'infinite' || raw === 'indefinite') {
            return DEFAULT_REFRESH_TTL_SECONDS;
        }

        const configured = Number(raw);
        return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_REFRESH_TTL_SECONDS;
    }

    getRefreshTtlMs() {
        return this.refreshTtlSeconds === null
            ? PERSISTENT_COOKIE_MAX_AGE_MS
            : this.refreshTtlSeconds * 1000;
    }

    private getSessionExpiresAt() {
        return this.refreshTtlSeconds === null
            ? null
            : new Date(Date.now() + this.refreshTtlSeconds * 1000);
    }

    private async issueRefreshToken(userId: string, sessionId: string) {
        const ttl = this.refreshTtlSeconds;
        return this.jwtService.signAsync(
            {
                sub: userId,
                sid: sessionId,
                type: 'finix_refresh',
            },
            // In persistent mode the auth module has no global JWT expiry, so
            // omitting expiresIn creates a token valid until explicit revoke.
            ttl === null ? {} : { expiresIn: `${ttl}s` },
        );
    }

    private hashSessionToken(token: string) {
        return createHash('sha256').update(token).digest('hex');
    }

    private async buildAuthResponse(user: any, meta: SessionMeta = {}) {
        const sessionId = randomUUID();
        const refreshToken = await this.issueRefreshToken(user.id, sessionId);

        await this.prisma.userSession.create({
            data: {
                id: sessionId,
                userId: user.id,
                refreshTokenHash: this.hashSessionToken(refreshToken),
                ipAddress: meta.ip,
                userAgent: meta.userAgent,
                expiresAt: this.getSessionExpiresAt(),
            },
        });

        return {
            token: await this.issueFinixToken(user, sessionId),
            refreshToken,
            user: this.formatUser(user),
        };
    }

    /**
     * Creates the same persistent Finix session used by email/password login.
     * OAuth providers authenticate the user in Supabase first, so the
     * controller calls this method after syncing the Prisma profile. This
     * keeps Google and email login consistent across browser restarts.
     */
    async createPersistentSession(userId: string, meta: SessionMeta = {}) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }
        if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
            throw new UnauthorizedException('Cuenta suspendida o baneada');
        }

        return this.buildAuthResponse(user, meta);
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
                    accountType: 'BASIC',
                    plan: 'FREE',
                    role: 'USER',
                    subscriptionStatus: 'INACTIVE',
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
                    accountType: 'BASIC',
                    plan: 'FREE',
                    role: 'USER',
                    subscriptionStatus: 'INACTIVE',
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

    async verifyRegisterCode(email: string, code: string, meta: SessionMeta = {}) {
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
                emailVerificationCode: null,
                emailVerificationExpires: null,
                lastLogin: new Date(),
            },
        });

        // Notify admin about new verified user
        this.mailService.sendAdminAlert({
            eventType: 'USER_REGISTERED',
            title: `Nuevo Usuario Registrado: @${updatedUser.username}`,
            badgeText: 'NUEVO USUARIO',
            badgeColor: '#10b981',
            summary: `Un nuevo usuario ha verificado su correo electrónico y activado su cuenta en Finix.`,
            details: [
                { label: 'Nombre de Usuario', value: `@${updatedUser.username}` },
                { label: 'Correo Electrónico', value: updatedUser.email },
                { label: 'Plan Inicial', value: updatedUser.plan || 'FREE' },
                { label: 'Método de Registro', value: 'Email y Contraseña' },
                { label: 'ID Usuario', value: updatedUser.id },
                { label: 'Fecha y Hora', value: new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) },
            ],
            actionUrl: `${this.mailService.getAdminUrl()}/users`,
            actionLabel: 'Ver en Panel Admin',
        });

        return this.buildAuthResponse(updatedUser, meta);
    }

    async login(email: string, password: string, meta: SessionMeta = {}) {
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

        return this.buildAuthResponse(updatedUser, meta);
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

    async verifyLoginCode(email: string, code: string, meta: SessionMeta = {}) {
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

        return this.buildAuthResponse(updatedUser, meta);
    }

    async refreshSession(refreshToken: string | undefined, meta: SessionMeta = {}) {
        if (!refreshToken) {
            throw new UnauthorizedException('Sesión persistente no encontrada');
        }

        let payload: any;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken);
        } catch {
            throw new UnauthorizedException('Sesión persistente expirada');
        }

        if (payload?.type !== 'finix_refresh' || !payload?.sid || !payload?.sub) {
            throw new UnauthorizedException('Token de sesión inválido');
        }

        const session = await this.prisma.userSession.findUnique({ where: { id: payload.sid } });
        if (!session || session.userId !== payload.sub || session.revokedAt || (session.expiresAt && session.expiresAt < new Date())) {
            throw new UnauthorizedException('Sesión persistente inválida o expirada');
        }

        if (session.refreshTokenHash !== this.hashSessionToken(refreshToken)) {
            await this.prisma.userSession.update({
                where: { id: session.id },
                data: { revokedAt: new Date() },
            });
            throw new UnauthorizedException('Sesión persistente comprometida');
        }

        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || user.status === 'BANNED' || user.status === 'SUSPENDED') {
            throw new UnauthorizedException('Cuenta suspendida o baneada');
        }

        const nextRefreshToken = await this.issueRefreshToken(user.id, session.id);
        await this.prisma.userSession.update({
            where: { id: session.id },
            data: {
                refreshTokenHash: this.hashSessionToken(nextRefreshToken),
                ipAddress: meta.ip,
                userAgent: meta.userAgent,
                // Finite installations use sliding expiration. The default
                // persistent mode keeps this value null until explicit logout.
                expiresAt: this.getSessionExpiresAt(),
            },
        });

        return {
            token: await this.issueFinixToken(user, session.id),
            refreshToken: nextRefreshToken,
            user: this.formatUser(user),
        };
    }

    async logout(refreshToken?: string) {
        if (!refreshToken) return { success: true };

        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, { ignoreExpiration: true });
            if (payload?.sid && payload?.sub) {
                await this.prisma.userSession.updateMany({
                    where: { id: payload.sid, userId: payload.sub, revokedAt: null },
                    data: { revokedAt: new Date() },
                });
            }
        } catch {
            // Logout remains idempotent if the browser already has an expired token.
        }

        return { success: true };
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

        const isJuan = this.isJuanUser({ username, email: normalizedEmail }) || this.isJuanUser(user);

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
                    isVerified: false,
                    plan: isJuan ? 'PRO' : 'FREE',
                    accountType: isJuan ? 'PRO' : 'BASIC',
                    subscriptionStatus: isJuan ? 'ACTIVE' : 'INACTIVE',
                    role: isJuan ? 'ADMIN' : 'USER',
                },
            });

            // Notify admin about new user registration via OAuth/Social
            this.mailService.sendAdminAlert({
                eventType: 'USER_REGISTERED',
                title: `Nuevo Usuario Registrado (OAuth): @${user.username}`,
                badgeText: 'NUEVO USUARIO',
                badgeColor: '#10b981',
                summary: `Un nuevo usuario se ha registrado en Finix mediante autenticación social / Google.`,
                details: [
                    { label: 'Nombre de Usuario', value: `@${user.username}` },
                    { label: 'Correo Electrónico', value: user.email },
                    { label: 'Plan Inicial', value: user.plan || 'FREE' },
                    { label: 'Método de Registro', value: 'Google / OAuth' },
                    { label: 'ID Usuario', value: user.id },
                    { label: 'Fecha y Hora', value: new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) },
                ],
                actionUrl: `${this.mailService.getAdminUrl()}/users`,
                actionLabel: 'Ver en Panel Admin',
            });
        } else if (isJuan && user.proAccessOverride !== false && (user.plan !== 'PRO' || user.role !== 'ADMIN')) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    plan: 'PRO',
                    accountType: 'PRO',
                    subscriptionStatus: 'ACTIVE',
                    role: 'ADMIN',
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

        const isJuan = this.isJuanUser(user);
        if (isJuan && user.proAccessOverride !== false && (user.plan !== 'PRO' || user.role !== 'ADMIN')) {
            const updated = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    plan: 'PRO',
                    accountType: 'PRO',
                    subscriptionStatus: 'ACTIVE',
                    role: 'ADMIN',
                },
            });
            return this.formatUser(updated);
        }

        return this.formatUser(user);
    }

    private formatUser(user: any) {
        const isJuan = this.isJuanUser(user);
        const plan = isJuan ? 'PRO' : user.plan;
        const accountType = isJuan ? 'PRO' : user.accountType;
        const subscriptionStatus = isJuan ? 'ACTIVE' : user.subscriptionStatus;
        const role = isJuan ? 'ADMIN' : user.role;

        const normalizedPlan = String(plan || '').toUpperCase();
        const normalizedAccountType = String(accountType || '').toUpperCase();
        const normalizedRole = String(role || '').toUpperCase();

        const isPro = hasEffectiveProAccess({
            ...user,
            plan,
            accountType,
            role,
            subscriptionStatus,
        });
        const isCreator = isJuan ? true : Boolean(
            user.isCreator ||
            normalizedRole === 'CREATOR' ||
            normalizedRole === 'ADMIN' ||
            normalizedRole === 'SUPER_ADMIN' ||
            normalizedPlan === 'CREATOR' ||
            normalizedPlan === 'PRO_CREATOR' ||
            normalizedAccountType === 'CREATOR'
        );

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            emailVerified: user.emailVerified,
            role,
            plan,
            accountType,
            subscriptionStatus,
            isPro,
            isInfluencer: user.isInfluencer,
            isVerified: Boolean(user.isVerified),
            proAccessOverride: user.proAccessOverride ?? null,
            isCreator,
            bio: user.bio ?? null,
            avatarUrl: normalizeStoredUploadUrl(user.avatarUrl) ?? null,
            onboardingCompleted: user.onboardingCompleted,
            onboardingStep: user.onboardingStep,
            createdAt: user.createdAt,
            language: user.language,
            currency: user.currency,
            theme: user.theme,
        };
    }
}
