import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const FINIX_AUTH_USER_SELECT = {
    id: true,
    email: true,
    username: true,
    role: true,
    plan: true,
    subscriptionStatus: true,
    proAccessOverride: true,
    status: true,
} as const;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (request: any) => request?.cookies?.finix_token || null,
            ]),
            ignoreExpiration: false,
            algorithms: ['HS256'],
            issuer: 'finix-api',
            secretOrKeyProvider: (_request, _token, done) => {
                const secret = process.env.JWT_SECRET?.trim();
                if (!secret) return done(new Error('JWT_SECRET no está configurado'));
                done(null, secret);
            },
        });
    }

    async validate(payload: any) {
        if (payload.iss !== 'finix-api' || typeof payload.sub !== 'string' || payload.type || payload.purpose) {
            throw new UnauthorizedException('Token de acceso inválido');
        }
        let finixUser;
        if (payload.sid) {
            const session = await this.prisma.userSession.findUnique({
                relationLoadStrategy: 'join',
                where: { id: payload.sid },
                select: { userId: true, revokedAt: true, expiresAt: true,
                    user: { select: FINIX_AUTH_USER_SELECT },
                },
            });
            if (!session || session.userId !== payload.sub || session.revokedAt || (session.expiresAt && session.expiresAt < new Date())) {
                throw new UnauthorizedException('Sesión inválida o cerrada');
            }
            finixUser = session.user;
        } else {
            finixUser = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: FINIX_AUTH_USER_SELECT,
            });
        }

        if (!finixUser) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        if (finixUser.status === 'BANNED' || finixUser.status === 'SUSPENDED') {
            throw new UnauthorizedException('Cuenta suspendida o baneada');
        }

        return {
            id: finixUser.id,
            email: finixUser.email,
            username: finixUser.username,
            role: finixUser.role,
            plan: finixUser.plan,
            subscriptionStatus: finixUser.subscriptionStatus,
            proAccessOverride: finixUser.proAccessOverride,
            status: finixUser.status,
        };
    }
}
