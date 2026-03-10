import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';
import * as speakeasy from 'speakeasy';
import * as bcrypt from 'bcryptjs';
import * as argon2 from 'argon2';
import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes,
    randomUUID,
} from 'crypto';
import { AdminLoginDto, AdminVerifyTwoFactorDto } from './dto/admin-auth.dto';
import { AdminAuditService } from './admin-audit.service';

interface RequestMeta {
    ip: string;
    userAgent?: string;
}

interface SessionTokens {
    sessionId: string;
    accessToken: string;
    refreshToken: string;
    accessTokenTtlMs: number;
    refreshTokenTtlMs: number;
}

const DEFAULT_ACCESS_TTL_SECONDS = 60 * 15;
const DEFAULT_REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class AdminAuthService {
    private readonly accessCookieName = process.env.ADMIN_ACCESS_COOKIE_NAME || 'finix_admin_at';
    private readonly refreshCookieName = process.env.ADMIN_REFRESH_COOKIE_NAME || 'finix_admin_rt';
    private readonly accessTtlSeconds = Number(process.env.ADMIN_ACCESS_TTL_SECONDS || DEFAULT_ACCESS_TTL_SECONDS);
    private readonly refreshTtlSeconds = Number(process.env.ADMIN_REFRESH_TTL_SECONDS || DEFAULT_REFRESH_TTL_SECONDS);
    private readonly setupTokenTtl = process.env.ADMIN_SETUP_TOKEN_TTL || '10m';
    private readonly preAuthTokenTtl = process.env.ADMIN_PREAUTH_TOKEN_TTL || '5m';

    private readonly ipWindowMs = Number(process.env.ADMIN_LOGIN_RATE_WINDOW_MS || 10 * 60 * 1000);
    private readonly ipMaxAttempts = Number(process.env.ADMIN_LOGIN_RATE_MAX_ATTEMPTS || 25);
    private readonly ipBlockMs = Number(process.env.ADMIN_LOGIN_RATE_BLOCK_MS || 15 * 60 * 1000);
    private readonly ipAttempts = new Map<string, { count: number; resetAt: number; blockedUntil?: number }>();

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly adminAuditService: AdminAuditService,
    ) {
        if (!process.env.JWT_SECRET) {
            throw new InternalServerErrorException('JWT_SECRET is required for admin security flow');
        }
    }

    getCookieNames() {
        return {
            access: this.accessCookieName,
            refresh: this.refreshCookieName,
        };
    }

    buildAccessCookieOptions() {
        return {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            path: '/api',
            maxAge: this.accessTtlSeconds * 1000,
        };
    }

    buildRefreshCookieOptions() {
        return {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            path: '/api',
            maxAge: this.refreshTtlSeconds * 1000,
        };
    }

    buildClearCookieOptions() {
        return {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            path: '/api',
        };
    }

    async login(dto: AdminLoginDto, meta: RequestMeta) {
        const email = dto.email.trim().toLowerCase();
        this.assertIpRateLimit(meta.ip, email);

        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            this.recordFailedIpAttempt(meta.ip, email);
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const validPassword = await this.verifyAndMaybeUpgradePassword(user, dto.password);
        if (!validPassword) {
            await this.registerFailedUserAttempt(user.id);
            this.recordFailedIpAttempt(meta.ip, email);
            await this.adminAuditService.logDirect({
                actorId: user.id,
                action: 'AUTH_LOGIN_FAILED_PASSWORD',
                targetId: user.id,
                ipAddress: meta.ip,
                userAgent: meta.userAgent,
            });
            throw new UnauthorizedException('Credenciales inválidas');
        }

        try {
            this.assertRoleAndOwner(user);
        } catch {
            this.recordFailedIpAttempt(meta.ip, email);
            await this.adminAuditService.logDirect({
                actorId: user.id,
                action: 'AUTH_LOGIN_FORBIDDEN_ROLE',
                targetId: user.id,
                ipAddress: meta.ip,
                userAgent: meta.userAgent,
                metadata: { role: user.role },
            });
            throw new UnauthorizedException('Credenciales inválidas');
        }

        this.assertNotLocked(user);

        await this.clearFailedUserAttempts(user.id);
        this.clearIpAttempts(meta.ip, email);

        if (!user.adminTwoFactorEnabled || !user.adminTotpSecret) {
            const issuer = process.env.ADMIN_TOTP_ISSUER || 'Finix Admin';
            const generated = speakeasy.generateSecret({
                name: user.email,
                issuer,
                length: 20,
            });
            const secret = generated.base32;
            const encryptedSecret = this.encryptSecret(secret);
            const expires = new Date(Date.now() + 10 * 60 * 1000);

            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    adminTotpTempSecret: encryptedSecret,
                    adminTotpTempExpires: expires,
                },
            });

            const setupToken = await this.jwtService.signAsync(
                {
                    sub: user.id,
                    type: 'admin_pre_auth',
                    purpose: 'setup_2fa',
                },
                { expiresIn: this.setupTokenTtl },
            );

            await this.adminAuditService.logDirect({
                actorId: user.id,
                action: 'AUTH_2FA_SETUP_CHALLENGE_ISSUED',
                targetId: user.id,
                ipAddress: meta.ip,
                userAgent: meta.userAgent,
            });

            return {
                step: 'SETUP_2FA' as const,
                token: setupToken,
                secret,
                otpauthUrl: generated.otpauth_url || '',
            };
        }

        const preAuthToken = await this.jwtService.signAsync(
            {
                sub: user.id,
                type: 'admin_pre_auth',
                purpose: 'verify_2fa',
            },
            { expiresIn: this.preAuthTokenTtl },
        );

        await this.adminAuditService.logDirect({
            actorId: user.id,
            action: 'AUTH_2FA_CHALLENGE_ISSUED',
            targetId: user.id,
            ipAddress: meta.ip,
            userAgent: meta.userAgent,
        });

        return {
            step: 'VERIFY_2FA' as const,
            token: preAuthToken,
        };
    }

    async verifyTwoFactor(dto: AdminVerifyTwoFactorDto, meta: RequestMeta) {
        const code = dto.code.trim();
        if (!/^\d{6}$/.test(code)) {
            throw new BadRequestException('Código 2FA inválido');
        }

        let preAuthPayload: any;
        try {
            preAuthPayload = await this.jwtService.verifyAsync(dto.token);
        } catch {
            throw new UnauthorizedException('Token de verificación inválido o expirado');
        }

        if (preAuthPayload?.type !== 'admin_pre_auth' || !preAuthPayload?.sub) {
            throw new UnauthorizedException('Token de verificación inválido');
        }

        const user = await this.prisma.user.findUnique({ where: { id: preAuthPayload.sub } });
        if (!user) {
            throw new UnauthorizedException('Usuario admin no encontrado');
        }

        this.assertRoleAndOwner(user);

        if (preAuthPayload.purpose === 'setup_2fa') {
            await this.completeTwoFactorSetup(user, code);
        } else {
            await this.assertValidTwoFactorCode(user, code);
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
                adminFailedLoginAttempts: 0,
                adminLockedUntil: null,
            },
        });

        const tokens = await this.createSessionTokens(user, meta);

        await this.adminAuditService.logDirect({
            actorId: user.id,
            action: 'AUTH_LOGIN_SUCCESS',
            targetId: user.id,
            sessionId: tokens.sessionId,
            ipAddress: meta.ip,
            userAgent: meta.userAgent,
        });

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
            },
        };
    }

    async refreshSession(refreshToken: string | undefined, meta: RequestMeta) {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token requerido');
        }

        let payload: any;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken);
        } catch {
            throw new UnauthorizedException('Refresh token inválido o expirado');
        }

        if (payload?.type !== 'admin_refresh' || !payload?.sid || !payload?.sub) {
            throw new UnauthorizedException('Refresh token inválido');
        }

        const session = await this.prisma.adminSession.findUnique({
            where: { id: payload.sid },
        });

        if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt < new Date()) {
            throw new UnauthorizedException('Sesión inválida o expirada');
        }

        const refreshTokenHash = this.hashToken(refreshToken);
        if (session.refreshTokenHash !== refreshTokenHash) {
            await this.prisma.adminSession.update({
                where: { id: session.id },
                data: { revokedAt: new Date() },
            });
            throw new UnauthorizedException('Refresh token comprometido');
        }

        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }
        this.assertRoleAndOwner(user);

        const tokens = await this.rotateSessionTokens(user, session.id, meta);

        await this.adminAuditService.logDirect({
            actorId: user.id,
            action: 'AUTH_REFRESH_SUCCESS',
            targetId: user.id,
            sessionId: session.id,
            ipAddress: meta.ip,
            userAgent: meta.userAgent,
        });

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
            },
        };
    }

    async logout(refreshToken: string | undefined, meta?: RequestMeta) {
        if (!refreshToken) {
            return { success: true };
        }

        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, { ignoreExpiration: true });
            if (payload?.sid && payload?.sub) {
                await this.prisma.adminSession.updateMany({
                    where: { id: payload.sid, revokedAt: null },
                    data: { revokedAt: new Date() },
                });

                await this.adminAuditService.logDirect({
                    actorId: payload.sub,
                    action: 'AUTH_LOGOUT',
                    targetId: payload.sub,
                    sessionId: payload.sid,
                    ipAddress: meta?.ip,
                    userAgent: meta?.userAgent,
                });
            }
        } catch {
            // Ignore invalid tokens on logout.
        }

        return { success: true };
    }

    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                adminTwoFactorEnabled: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Sesión inválida');
        }

        return user;
    }

    private async completeTwoFactorSetup(user: User, code: string) {
        if (!user.adminTotpTempSecret || !user.adminTotpTempExpires || user.adminTotpTempExpires < new Date()) {
            throw new UnauthorizedException('Setup 2FA expirado, vuelve a iniciar sesión');
        }

        const secret = this.decryptSecret(user.adminTotpTempSecret);
        const isValidCode = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token: code,
            window: 1,
        });
        if (!isValidCode) {
            throw new UnauthorizedException('Código 2FA inválido');
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                adminTwoFactorEnabled: true,
                adminTotpSecret: this.encryptSecret(secret),
                adminTotpTempSecret: null,
                adminTotpTempExpires: null,
            },
        });
    }

    private async assertValidTwoFactorCode(user: User, code: string) {
        if (!user.adminTwoFactorEnabled || !user.adminTotpSecret) {
            throw new UnauthorizedException('2FA no configurado');
        }

        const secret = this.decryptSecret(user.adminTotpSecret);
        const isValidCode = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token: code,
            window: 1,
        });
        if (!isValidCode) {
            throw new UnauthorizedException('Código 2FA inválido');
        }
    }

    private async createSessionTokens(user: User, meta: RequestMeta): Promise<SessionTokens> {
        const sessionId = randomUUID();
        const refreshToken = await this.jwtService.signAsync(
            {
                sub: user.id,
                sid: sessionId,
                type: 'admin_refresh',
            },
            { expiresIn: `${this.refreshTtlSeconds}s` },
        );

        const refreshTokenHash = this.hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + this.refreshTtlSeconds * 1000);

        await this.prisma.adminSession.create({
            data: {
                id: sessionId,
                userId: user.id,
                refreshTokenHash,
                ipAddress: meta.ip,
                userAgent: meta.userAgent,
                expiresAt,
            },
        });

        const accessToken = await this.jwtService.signAsync(
            {
                sub: user.id,
                sid: sessionId,
                role: user.role,
                mfa: true,
                type: 'admin_access',
            },
            { expiresIn: `${this.accessTtlSeconds}s` },
        );

        return {
            sessionId,
            accessToken,
            refreshToken,
            accessTokenTtlMs: this.accessTtlSeconds * 1000,
            refreshTokenTtlMs: this.refreshTtlSeconds * 1000,
        };
    }

    private async rotateSessionTokens(user: User, sessionId: string, meta: RequestMeta): Promise<SessionTokens> {
        const refreshToken = await this.jwtService.signAsync(
            {
                sub: user.id,
                sid: sessionId,
                type: 'admin_refresh',
            },
            { expiresIn: `${this.refreshTtlSeconds}s` },
        );

        const refreshTokenHash = this.hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + this.refreshTtlSeconds * 1000);

        await this.prisma.adminSession.update({
            where: { id: sessionId },
            data: {
                refreshTokenHash,
                ipAddress: meta.ip,
                userAgent: meta.userAgent,
                expiresAt,
            },
        });

        const accessToken = await this.jwtService.signAsync(
            {
                sub: user.id,
                sid: sessionId,
                role: user.role,
                mfa: true,
                type: 'admin_access',
            },
            { expiresIn: `${this.accessTtlSeconds}s` },
        );

        return {
            sessionId,
            accessToken,
            refreshToken,
            accessTokenTtlMs: this.accessTtlSeconds * 1000,
            refreshTokenTtlMs: this.refreshTtlSeconds * 1000,
        };
    }

    private hashToken(token: string) {
        return createHash('sha256').update(token).digest('hex');
    }

    private encryptSecret(secret: string) {
        const key = this.getEncryptionKey();
        const iv = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
    }

    private decryptSecret(payload: string) {
        const parts = payload.split('.');
        if (parts.length !== 3) {
            throw new UnauthorizedException('Secreto TOTP inválido');
        }

        const [ivB64, tagB64, encryptedB64] = parts;
        const key = this.getEncryptionKey();
        const iv = Buffer.from(ivB64, 'base64');
        const tag = Buffer.from(tagB64, 'base64');
        const encrypted = Buffer.from(encryptedB64, 'base64');

        const decipher = createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);

        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    }

    private getEncryptionKey() {
        const keySource = process.env.ADMIN_TOTP_ENCRYPTION_KEY || process.env.JWT_SECRET;
        if (!keySource) {
            throw new InternalServerErrorException('ADMIN_TOTP_ENCRYPTION_KEY or JWT_SECRET is required');
        }
        return createHash('sha256').update(keySource).digest();
    }

    private async verifyAndMaybeUpgradePassword(user: User, plainPassword: string) {
        const hash = user.password;

        if (hash.startsWith('$2')) {
            return bcrypt.compare(plainPassword, hash);
        }

        if (!hash.startsWith('$argon2')) {
            return false;
        }

        const argonMatches = await argon2.verify(hash, plainPassword);
        if (!argonMatches) {
            return false;
        }

        const newHash = await bcrypt.hash(plainPassword, 12);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: newHash },
        });

        return true;
    }

    private assertRoleAndOwner(user: User) {
        if (!this.isAdminRole(user.role)) {
            throw new ForbiddenException('Requiere rol ADMIN o SUPER_ADMIN');
        }
        if ((user.status || '').toUpperCase() === 'BANNED') {
            throw new ForbiddenException('Cuenta admin bloqueada');
        }

        const ownerId = (process.env.ADMIN_OWNER_USER_ID || '').trim();
        if (ownerId && user.id !== ownerId) {
            throw new ForbiddenException('Acceso restringido al owner admin');
        }

        const ownerEmail = (process.env.ADMIN_OWNER_EMAIL || '').trim().toLowerCase();
        if (ownerEmail && user.email.toLowerCase() !== ownerEmail) {
            throw new ForbiddenException('Acceso restringido al owner admin');
        }

        const allowlist = (process.env.ADMIN_ALLOWLIST || '')
            .split(',')
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean);

        if (allowlist.length > 0 && !allowlist.includes(user.email.toLowerCase())) {
            throw new ForbiddenException('Admin no permitido en allowlist');
        }
    }

    private assertNotLocked(user: User) {
        if (!user.adminLockedUntil) {
            return;
        }

        if (user.adminLockedUntil > new Date()) {
            const secs = Math.max(1, Math.ceil((user.adminLockedUntil.getTime() - Date.now()) / 1000));
            this.throwTooManyRequests(`Cuenta temporalmente bloqueada. Reintenta en ${secs}s`);
        }
    }

    private async registerFailedUserAttempt(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { adminFailedLoginAttempts: true },
        });

        if (!user) {
            return;
        }

        const attempts = user.adminFailedLoginAttempts + 1;
        const data: any = {
            adminFailedLoginAttempts: attempts,
        };

        if (attempts >= MAX_LOGIN_ATTEMPTS) {
            data.adminLockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
            data.adminFailedLoginAttempts = 0;
        }

        await this.prisma.user.update({
            where: { id: userId },
            data,
        });
    }

    private async clearFailedUserAttempts(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                adminFailedLoginAttempts: 0,
                adminLockedUntil: null,
            },
        });
    }

    private isAdminRole(role?: string | null) {
        if (!role) {
            return false;
        }
        const normalized = role.toUpperCase();
        return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
    }

    private buildRateKey(ip: string, email: string) {
        return `${ip.toLowerCase()}::${email.toLowerCase()}`;
    }

    private assertIpRateLimit(ip: string, email: string) {
        const key = this.buildRateKey(ip, email);
        const now = Date.now();
        const entry = this.ipAttempts.get(key);

        if (!entry) {
            return;
        }

        if (entry.blockedUntil && now < entry.blockedUntil) {
            const seconds = Math.ceil((entry.blockedUntil - now) / 1000);
            this.throwTooManyRequests(`Demasiados intentos. Reintenta en ${seconds}s`);
        }

        if (now > entry.resetAt) {
            this.ipAttempts.delete(key);
            return;
        }

        if (entry.count >= this.ipMaxAttempts) {
            const blockedUntil = now + this.ipBlockMs;
            this.ipAttempts.set(key, { ...entry, blockedUntil });
            const seconds = Math.ceil(this.ipBlockMs / 1000);
            this.throwTooManyRequests(`Demasiados intentos. Reintenta en ${seconds}s`);
        }
    }

    private recordFailedIpAttempt(ip: string, email: string) {
        const key = this.buildRateKey(ip, email);
        const now = Date.now();
        const entry = this.ipAttempts.get(key);

        if (!entry || now > entry.resetAt) {
            this.ipAttempts.set(key, {
                count: 1,
                resetAt: now + this.ipWindowMs,
            });
            return;
        }

        this.ipAttempts.set(key, {
            ...entry,
            count: entry.count + 1,
        });
    }

    private clearIpAttempts(ip: string, email: string) {
        this.ipAttempts.delete(this.buildRateKey(ip, email));
    }

    private throwTooManyRequests(message: string): never {
        throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }
}
