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
exports.AdminGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const ipaddr = require("ipaddr.js");
const prisma_service_1 = require("../prisma.service");
let AdminGuard = class AdminGuard {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.accessCookieName = process.env.ADMIN_ACCESS_COOKIE_NAME || 'finix_admin_at';
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractAccessToken(request);
        const requestIp = this.extractRequestIp(request);
        if (!token) {
            throw new common_1.UnauthorizedException('Sesión admin requerida');
        }
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(token);
        }
        catch {
            throw new common_1.UnauthorizedException('Token admin inválido o expirado');
        }
        if (payload.type !== 'admin_access' || !payload.sub || !payload.sid || !payload.mfa) {
            throw new common_1.UnauthorizedException('Token admin inválido');
        }
        const session = await this.prisma.adminSession.findUnique({
            where: { id: payload.sid },
        });
        if (!session || session.revokedAt || session.userId !== payload.sub || session.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Sesión admin inválida o expirada');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuario no encontrado');
        }
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
        this.assertIpAllowlist(requestIp);
        request.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            sessionId: session.id,
            ipAddress: requestIp,
            userAgent: request.headers['user-agent'] || null,
        };
        return true;
    }
    extractAccessToken(request) {
        const cookieToken = request.cookies?.[this.accessCookieName];
        if (cookieToken) {
            return cookieToken;
        }
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.slice(7).trim();
        }
        return null;
    }
    isAdminRole(role) {
        if (!role) {
            return false;
        }
        const normalized = role.toUpperCase();
        return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
    }
    extractRequestIp(request) {
        const forwardedFor = request.headers['x-forwarded-for'];
        const ip = typeof forwardedFor === 'string'
            ? forwardedFor.split(',')[0].trim()
            : request.ip || request.socket.remoteAddress || 'unknown';
        if (ip === '::1') {
            return '127.0.0.1';
        }
        if (ip.startsWith('::ffff:')) {
            return ip.slice(7);
        }
        if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(ip)) {
            return ip.split(':')[0];
        }
        return ip;
    }
    assertIpAllowlist(requestIp) {
        const ipAllowlist = (process.env.ADMIN_IP_ALLOWLIST || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
        if (ipAllowlist.length === 0) {
            return;
        }
        if (!this.isIpAllowed(requestIp, ipAllowlist)) {
            throw new common_1.ForbiddenException('IP no autorizada para panel admin');
        }
    }
    isIpAllowed(requestIp, ipAllowlist) {
        let normalizedRequestIp;
        try {
            normalizedRequestIp = ipaddr.parse(requestIp);
            if (normalizedRequestIp.kind() === 'ipv6') {
                const ipv6 = normalizedRequestIp;
                if (ipv6.isIPv4MappedAddress()) {
                    normalizedRequestIp = ipv6.toIPv4Address();
                }
            }
        }
        catch {
            return false;
        }
        return ipAllowlist.some((entry) => this.matchesAllowlistEntry(normalizedRequestIp, entry));
    }
    matchesAllowlistEntry(requestIp, entry) {
        if (entry.includes('/')) {
            try {
                const [range, prefix] = ipaddr.parseCIDR(entry);
                let normalizedRange = range;
                if (normalizedRange.kind() === 'ipv6') {
                    const ipv6Range = normalizedRange;
                    if (ipv6Range.isIPv4MappedAddress()) {
                        normalizedRange = ipv6Range.toIPv4Address();
                    }
                }
                if (normalizedRange.kind() !== requestIp.kind()) {
                    return false;
                }
                return requestIp.match([normalizedRange, prefix]);
            }
            catch {
                return false;
            }
        }
        try {
            let allowedIp = ipaddr.parse(entry);
            if (allowedIp.kind() === 'ipv6') {
                const ipv6Allowed = allowedIp;
                if (ipv6Allowed.isIPv4MappedAddress()) {
                    allowedIp = ipv6Allowed.toIPv4Address();
                }
            }
            return allowedIp.kind() === requestIp.kind() && allowedIp.toString() === requestIp.toString();
        }
        catch {
            return false;
        }
    }
};
exports.AdminGuard = AdminGuard;
exports.AdminGuard = AdminGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AdminGuard);
//# sourceMappingURL=admin.guard.js.map