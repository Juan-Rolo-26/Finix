import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import * as ipaddr from 'ipaddr.js';
import { PrismaService } from '../prisma.service';

interface AdminJwtPayload {
    sub: string;
    sid: string;
    role: string;
    mfa: boolean;
    type: 'admin_access';
    iat?: number;
    exp?: number;
}

@Injectable()
export class AdminGuard implements CanActivate {
    private readonly accessCookieName = process.env.ADMIN_ACCESS_COOKIE_NAME || 'finix_admin_at';

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request & { user?: any }>();
        const token = this.extractAccessToken(request);
        const requestIp = this.extractRequestIp(request);

        if (!token) {
            throw new UnauthorizedException('Sesión admin requerida');
        }

        let payload: AdminJwtPayload;
        try {
            payload = await this.jwtService.verifyAsync<AdminJwtPayload>(token);
        } catch {
            throw new UnauthorizedException('Token admin inválido o expirado');
        }

        if (payload.type !== 'admin_access' || !payload.sub || !payload.sid || !payload.mfa) {
            throw new UnauthorizedException('Token admin inválido');
        }

        const session = await this.prisma.adminSession.findUnique({
            where: { id: payload.sid },
        });

        if (!session || session.revokedAt || session.userId !== payload.sub || session.expiresAt < new Date()) {
            throw new UnauthorizedException('Sesión admin inválida o expirada');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

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

    private extractAccessToken(request: Request) {
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

    private isAdminRole(role?: string | null) {
        if (!role) {
            return false;
        }

        const normalized = role.toUpperCase();
        return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
    }

    private extractRequestIp(request: Request) {
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

    private assertIpAllowlist(requestIp: string) {
        const ipAllowlist = (process.env.ADMIN_IP_ALLOWLIST || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);

        if (ipAllowlist.length === 0) {
            return;
        }

        if (!this.isIpAllowed(requestIp, ipAllowlist)) {
            throw new ForbiddenException('IP no autorizada para panel admin');
        }
    }

    private isIpAllowed(requestIp: string, ipAllowlist: string[]) {
        let normalizedRequestIp: ipaddr.IPv4 | ipaddr.IPv6;
        try {
            normalizedRequestIp = ipaddr.parse(requestIp);
            if (normalizedRequestIp.kind() === 'ipv6') {
                const ipv6 = normalizedRequestIp as ipaddr.IPv6;
                if (ipv6.isIPv4MappedAddress()) {
                    normalizedRequestIp = ipv6.toIPv4Address();
                }
            }
        } catch {
            return false;
        }

        return ipAllowlist.some((entry) => this.matchesAllowlistEntry(normalizedRequestIp, entry));
    }

    private matchesAllowlistEntry(requestIp: ipaddr.IPv4 | ipaddr.IPv6, entry: string) {
        if (entry.includes('/')) {
            try {
                const [range, prefix] = ipaddr.parseCIDR(entry);
                let normalizedRange: ipaddr.IPv4 | ipaddr.IPv6 = range;
                if (normalizedRange.kind() === 'ipv6') {
                    const ipv6Range = normalizedRange as ipaddr.IPv6;
                    if (ipv6Range.isIPv4MappedAddress()) {
                        normalizedRange = ipv6Range.toIPv4Address();
                    }
                }

                if (normalizedRange.kind() !== requestIp.kind()) {
                    return false;
                }

                return requestIp.match([normalizedRange, prefix]);
            } catch {
                return false;
            }
        }

        try {
            let allowedIp: ipaddr.IPv4 | ipaddr.IPv6 = ipaddr.parse(entry);
            if (allowedIp.kind() === 'ipv6') {
                const ipv6Allowed = allowedIp as ipaddr.IPv6;
                if (ipv6Allowed.isIPv4MappedAddress()) {
                    allowedIp = ipv6Allowed.toIPv4Address();
                }
            }

            return allowedIp.kind() === requestIp.kind() && allowedIp.toString() === requestIp.toString();
        } catch {
            return false;
        }
    }
}
