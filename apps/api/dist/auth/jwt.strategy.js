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
exports.JwtStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma.service");
const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;
const signingKeyCache = new Map();
const decodeJwtHeader = (token) => {
    const [encodedHeader] = token.split('.');
    if (!encodedHeader) {
        throw new Error('JWT malformado: falta el header');
    }
    return JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
};
const decodeJwtPayload = (token) => {
    const [, encodedPayload] = token.split('.');
    if (!encodedPayload) {
        throw new Error('JWT malformado: falta el payload');
    }
    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
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
const fetchSigningKey = async (kid) => {
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
    const { keys = [] } = await response.json();
    const jwk = keys.find((candidate) => candidate.kid === kid);
    if (!jwk) {
        throw new Error(`No existe la signing key ${kid} en la JWKS de Supabase`);
    }
    const key = (0, crypto_1.createPublicKey)({
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
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
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
                }
                catch (error) {
                    done(error);
                }
            },
        });
        this.prisma = prisma;
    }
    async validate(payload) {
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
                throw new common_1.UnauthorizedException('Usuario no encontrado');
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
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map