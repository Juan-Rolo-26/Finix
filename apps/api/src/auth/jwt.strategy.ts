import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createPublicKey, type JsonWebKey, KeyObject } from 'crypto';
import { PrismaService } from '../prisma.service';

type JwtHeader = {
    alg?: string;
    kid?: string;
};

type SigningJwk = JsonWebKey & {
    kid?: string;
};

type JwksResponse = {
    keys?: SigningJwk[];
};

type JwtPayload = {
    iss?: string;
    email?: string;
    sub?: string;
    user_metadata?: {
        username?: string;
    };
};

const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;
const signingKeyCache = new Map<string, { key: KeyObject; expiresAt: number }>();

const decodeJwtHeader = (token: string): JwtHeader => {
    const [encodedHeader] = token.split('.');
    if (!encodedHeader) {
        throw new Error('JWT malformado: falta el header');
    }
    return JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8')) as JwtHeader;
};

const decodeJwtPayload = (token: string): JwtPayload => {
    const [, encodedPayload] = token.split('.');
    if (!encodedPayload) {
        throw new Error('JWT malformado: falta el payload');
    }
    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as JwtPayload;
};

const resolveSupabaseIssuer = () => {
    if (process.env.SUPABASE_JWT_ISSUER) {
        return process.env.SUPABASE_JWT_ISSUER.replace(/\/$/, '');
    }
    if (process.env.SUPABASE_URL) {
        return `${process.env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1`;
    }
    return undefined;
};

const fetchSigningKey = async (kid: string) => {
    const cached = signingKeyCache.get(kid);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.key;
    }

    const issuer = resolveSupabaseIssuer();
    if (!issuer) {
        throw new Error('Falta SUPABASE_URL o SUPABASE_JWT_ISSUER para validar JWTs de Supabase');
    }

    const response = await fetch(`${issuer}/.well-known/jwks.json`);
    if (!response.ok) {
        throw new Error(`No se pudo obtener la JWKS de Supabase (${response.status})`);
    }

    const { keys = [] } = await response.json() as JwksResponse;
    const jwk = keys.find((candidate) => candidate.kid === kid);
    if (!jwk) {
        throw new Error(`No existe la signing key ${kid} en la JWKS de Supabase`);
    }

    const key = createPublicKey({
        key: jwk,
        format: 'jwk',
    });

    signingKeyCache.set(kid, {
        key,
        expiresAt: Date.now() + JWKS_CACHE_TTL_MS,
    });

    return key;
};

const resolveLegacySecret = () => {
    const secret = process.env.SUPABASE_JWT_SECRET?.trim();
    if (!secret) {
        throw new Error('Falta SUPABASE_JWT_SECRET para validar JWTs HS256 legacy de Supabase');
    }
    return secret;
};

const resolveFinixSecret = () => process.env.JWT_SECRET || 'secretKey';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            algorithms: ['ES256', 'RS256', 'HS256'],
            secretOrKeyProvider: async (_request, rawJwtToken, done) => {
                try {
                    const header = decodeJwtHeader(rawJwtToken);
                    const payload = decodeJwtPayload(rawJwtToken);

                    if (payload.iss === 'finix-api') {
                        done(null, resolveFinixSecret());
                        return;
                    }

                    if (header.alg === 'HS256') {
                        done(null, resolveLegacySecret());
                        return;
                    }

                    if (!header.kid) {
                        throw new Error('JWT sin kid');
                    }

                    const key = await fetchSigningKey(header.kid);
                    done(null, key);
                } catch (error) {
                    done(error as Error);
                }
            },
        });
    }

    async validate(payload: any) {
        if (payload.iss === 'finix-api') {
            const finixUser = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    role: true,
                    plan: true,
                    subscriptionStatus: true,
                    status: true,
                },
            });

            if (!finixUser) {
                throw new UnauthorizedException('Usuario no encontrado');
            }

            return {
                id: finixUser.id,
                email: finixUser.email,
                username: finixUser.username,
                role: finixUser.role,
                plan: finixUser.plan,
                subscriptionStatus: finixUser.subscriptionStatus,
                status: finixUser.status,
            };
        }

        const supabaseId = payload.sub;

        const user = await this.prisma.user.findUnique({
            where: { id: supabaseId },
            select: {
                id: true,
                username: true,
                role: true,
                plan: true,
                subscriptionStatus: true,
                status: true,
            },
        });

        return {
            id: supabaseId,
            email: payload.email,
            username: user?.username ?? (payload.user_metadata?.username ?? null),
            role: user?.role ?? 'USER',
            plan: user?.plan ?? 'FREE',
            subscriptionStatus: user?.subscriptionStatus ?? 'INACTIVE',
            status: user?.status ?? 'ACTIVE',
        };
    }
}
