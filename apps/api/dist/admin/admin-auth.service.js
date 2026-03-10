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
exports.AdminAuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma.service");
const speakeasy = require("speakeasy");
const bcrypt = require("bcryptjs");
const argon2 = require("argon2");
const crypto_1 = require("crypto");
const admin_audit_service_1 = require("./admin-audit.service");
const DEFAULT_ACCESS_TTL_SECONDS = 60 * 15;
const DEFAULT_REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
let AdminAuthService = class AdminAuthService {
    constructor(prisma, jwtService, adminAuditService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.adminAuditService = adminAuditService;
        this.accessCookieName = process.env.ADMIN_ACCESS_COOKIE_NAME || 'finix_admin_at';
        this.refreshCookieName = process.env.ADMIN_REFRESH_COOKIE_NAME || 'finix_admin_rt';
        this.accessTtlSeconds = Number(process.env.ADMIN_ACCESS_TTL_SECONDS || DEFAULT_ACCESS_TTL_SECONDS);
        this.refreshTtlSeconds = Number(process.env.ADMIN_REFRESH_TTL_SECONDS || DEFAULT_REFRESH_TTL_SECONDS);
        this.setupTokenTtl = process.env.ADMIN_SETUP_TOKEN_TTL || '10m';
        this.preAuthTokenTtl = process.env.ADMIN_PREAUTH_TOKEN_TTL || '5m';
        this.ipWindowMs = Number(process.env.ADMIN_LOGIN_RATE_WINDOW_MS || 10 * 60 * 1000);
        this.ipMaxAttempts = Number(process.env.ADMIN_LOGIN_RATE_MAX_ATTEMPTS || 25);
        this.ipBlockMs = Number(process.env.ADMIN_LOGIN_RATE_BLOCK_MS || 15 * 60 * 1000);
        this.ipAttempts = new Map();
        if (!process.env.JWT_SECRET) {
            throw new common_1.InternalServerErrorException('JWT_SECRET is required for admin security flow');
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
            sameSite: 'strict',
            path: '/api',
            maxAge: this.accessTtlSeconds * 1000,
        };
    }
    buildRefreshCookieOptions() {
        return {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api',
            maxAge: this.refreshTtlSeconds * 1000,
        };
    }
    buildClearCookieOptions() {
        return {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api',
        };
    }
    async login(dto, meta) {
        const email = dto.email.trim().toLowerCase();
        this.assertIpRateLimit(meta.ip, email);
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            this.recordFailedIpAttempt(meta.ip, email);
            throw new common_1.UnauthorizedException('Credenciales inválidas');
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
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        try {
            this.assertRoleAndOwner(user);
        }
        catch {
            this.recordFailedIpAttempt(meta.ip, email);
            await this.adminAuditService.logDirect({
                actorId: user.id,
                action: 'AUTH_LOGIN_FORBIDDEN_ROLE',
                targetId: user.id,
                ipAddress: meta.ip,
                userAgent: meta.userAgent,
                metadata: { role: user.role },
            });
            throw new common_1.UnauthorizedException('Credenciales inválidas');
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
            const setupToken = await this.jwtService.signAsync({
                sub: user.id,
                type: 'admin_pre_auth',
                purpose: 'setup_2fa',
            }, { expiresIn: this.setupTokenTtl });
            await this.adminAuditService.logDirect({
                actorId: user.id,
                action: 'AUTH_2FA_SETUP_CHALLENGE_ISSUED',
                targetId: user.id,
                ipAddress: meta.ip,
                userAgent: meta.userAgent,
            });
            return {
                step: 'SETUP_2FA',
                token: setupToken,
                secret,
                otpauthUrl: generated.otpauth_url || '',
            };
        }
        const preAuthToken = await this.jwtService.signAsync({
            sub: user.id,
            type: 'admin_pre_auth',
            purpose: 'verify_2fa',
        }, { expiresIn: this.preAuthTokenTtl });
        await this.adminAuditService.logDirect({
            actorId: user.id,
            action: 'AUTH_2FA_CHALLENGE_ISSUED',
            targetId: user.id,
            ipAddress: meta.ip,
            userAgent: meta.userAgent,
        });
        return {
            step: 'VERIFY_2FA',
            token: preAuthToken,
        };
    }
    async verifyTwoFactor(dto, meta) {
        const code = dto.code.trim();
        if (!/^\d{6}$/.test(code)) {
            throw new common_1.BadRequestException('Código 2FA inválido');
        }
        let preAuthPayload;
        try {
            preAuthPayload = await this.jwtService.verifyAsync(dto.token);
        }
        catch {
            throw new common_1.UnauthorizedException('Token de verificación inválido o expirado');
        }
        if (preAuthPayload?.type !== 'admin_pre_auth' || !preAuthPayload?.sub) {
            throw new common_1.UnauthorizedException('Token de verificación inválido');
        }
        const user = await this.prisma.user.findUnique({ where: { id: preAuthPayload.sub } });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuario admin no encontrado');
        }
        this.assertRoleAndOwner(user);
        if (preAuthPayload.purpose === 'setup_2fa') {
            await this.completeTwoFactorSetup(user, code);
        }
        else {
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
    async refreshSession(refreshToken, meta) {
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token requerido');
        }
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken);
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token inválido o expirado');
        }
        if (payload?.type !== 'admin_refresh' || !payload?.sid || !payload?.sub) {
            throw new common_1.UnauthorizedException('Refresh token inválido');
        }
        const session = await this.prisma.adminSession.findUnique({
            where: { id: payload.sid },
        });
        if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Sesión inválida o expirada');
        }
        const refreshTokenHash = this.hashToken(refreshToken);
        if (session.refreshTokenHash !== refreshTokenHash) {
            await this.prisma.adminSession.update({
                where: { id: session.id },
                data: { revokedAt: new Date() },
            });
            throw new common_1.UnauthorizedException('Refresh token comprometido');
        }
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuario no encontrado');
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
    async logout(refreshToken, meta) {
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
        }
        catch {
        }
        return { success: true };
    }
    async getMe(userId) {
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
            throw new common_1.UnauthorizedException('Sesión inválida');
        }
        return user;
    }
    async completeTwoFactorSetup(user, code) {
        if (!user.adminTotpTempSecret || !user.adminTotpTempExpires || user.adminTotpTempExpires < new Date()) {
            throw new common_1.UnauthorizedException('Setup 2FA expirado, vuelve a iniciar sesión');
        }
        const secret = this.decryptSecret(user.adminTotpTempSecret);
        const isValidCode = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token: code,
            window: 1,
        });
        if (!isValidCode) {
            throw new common_1.UnauthorizedException('Código 2FA inválido');
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
    async assertValidTwoFactorCode(user, code) {
        if (!user.adminTwoFactorEnabled || !user.adminTotpSecret) {
            throw new common_1.UnauthorizedException('2FA no configurado');
        }
        const secret = this.decryptSecret(user.adminTotpSecret);
        const isValidCode = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token: code,
            window: 1,
        });
        if (!isValidCode) {
            throw new common_1.UnauthorizedException('Código 2FA inválido');
        }
    }
    async createSessionTokens(user, meta) {
        const sessionId = (0, crypto_1.randomUUID)();
        const refreshToken = await this.jwtService.signAsync({
            sub: user.id,
            sid: sessionId,
            type: 'admin_refresh',
        }, { expiresIn: `${this.refreshTtlSeconds}s` });
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
        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            sid: sessionId,
            role: user.role,
            mfa: true,
            type: 'admin_access',
        }, { expiresIn: `${this.accessTtlSeconds}s` });
        return {
            sessionId,
            accessToken,
            refreshToken,
            accessTokenTtlMs: this.accessTtlSeconds * 1000,
            refreshTokenTtlMs: this.refreshTtlSeconds * 1000,
        };
    }
    async rotateSessionTokens(user, sessionId, meta) {
        const refreshToken = await this.jwtService.signAsync({
            sub: user.id,
            sid: sessionId,
            type: 'admin_refresh',
        }, { expiresIn: `${this.refreshTtlSeconds}s` });
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
        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            sid: sessionId,
            role: user.role,
            mfa: true,
            type: 'admin_access',
        }, { expiresIn: `${this.accessTtlSeconds}s` });
        return {
            sessionId,
            accessToken,
            refreshToken,
            accessTokenTtlMs: this.accessTtlSeconds * 1000,
            refreshTokenTtlMs: this.refreshTtlSeconds * 1000,
        };
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    encryptSecret(secret) {
        const key = this.getEncryptionKey();
        const iv = (0, crypto_1.randomBytes)(12);
        const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
    }
    decryptSecret(payload) {
        const parts = payload.split('.');
        if (parts.length !== 3) {
            throw new common_1.UnauthorizedException('Secreto TOTP inválido');
        }
        const [ivB64, tagB64, encryptedB64] = parts;
        const key = this.getEncryptionKey();
        const iv = Buffer.from(ivB64, 'base64');
        const tag = Buffer.from(tagB64, 'base64');
        const encrypted = Buffer.from(encryptedB64, 'base64');
        const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    }
    getEncryptionKey() {
        const keySource = process.env.ADMIN_TOTP_ENCRYPTION_KEY || process.env.JWT_SECRET;
        if (!keySource) {
            throw new common_1.InternalServerErrorException('ADMIN_TOTP_ENCRYPTION_KEY or JWT_SECRET is required');
        }
        return (0, crypto_1.createHash)('sha256').update(keySource).digest();
    }
    async verifyAndMaybeUpgradePassword(user, plainPassword) {
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
    assertRoleAndOwner(user) {
        if (!this.isAdminRole(user.role)) {
            throw new common_1.ForbiddenException('Requiere rol ADMIN o SUPER_ADMIN');
        }
        if ((user.status || '').toUpperCase() === 'BANNED') {
            throw new common_1.ForbiddenException('Cuenta admin bloqueada');
        }
        const ownerId = (process.env.ADMIN_OWNER_USER_ID || '').trim();
        if (ownerId && user.id !== ownerId) {
            throw new common_1.ForbiddenException('Acceso restringido al owner admin');
        }
        const ownerEmail = (process.env.ADMIN_OWNER_EMAIL || '').trim().toLowerCase();
        if (ownerEmail && user.email.toLowerCase() !== ownerEmail) {
            throw new common_1.ForbiddenException('Acceso restringido al owner admin');
        }
        const allowlist = (process.env.ADMIN_ALLOWLIST || '')
            .split(',')
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean);
        if (allowlist.length > 0 && !allowlist.includes(user.email.toLowerCase())) {
            throw new common_1.ForbiddenException('Admin no permitido en allowlist');
        }
    }
    assertNotLocked(user) {
        if (!user.adminLockedUntil) {
            return;
        }
        if (user.adminLockedUntil > new Date()) {
            const secs = Math.max(1, Math.ceil((user.adminLockedUntil.getTime() - Date.now()) / 1000));
            this.throwTooManyRequests(`Cuenta temporalmente bloqueada. Reintenta en ${secs}s`);
        }
    }
    async registerFailedUserAttempt(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { adminFailedLoginAttempts: true },
        });
        if (!user) {
            return;
        }
        const attempts = user.adminFailedLoginAttempts + 1;
        const data = {
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
    async clearFailedUserAttempts(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                adminFailedLoginAttempts: 0,
                adminLockedUntil: null,
            },
        });
    }
    isAdminRole(role) {
        if (!role) {
            return false;
        }
        const normalized = role.toUpperCase();
        return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
    }
    buildRateKey(ip, email) {
        return `${ip.toLowerCase()}::${email.toLowerCase()}`;
    }
    assertIpRateLimit(ip, email) {
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
    recordFailedIpAttempt(ip, email) {
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
    clearIpAttempts(ip, email) {
        this.ipAttempts.delete(this.buildRateKey(ip, email));
    }
    throwTooManyRequests(message) {
        throw new common_1.HttpException(message, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
};
exports.AdminAuthService = AdminAuthService;
exports.AdminAuthService = AdminAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        admin_audit_service_1.AdminAuditService])
], AdminAuthService);
//# sourceMappingURL=admin-auth.service.js.map