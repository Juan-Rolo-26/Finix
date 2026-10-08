import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client, CodeChallengeMethod } from 'google-auth-library';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GoogleAuthService {
    constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}

    isConfigured() {
        return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
    }

    private client() {
        if (!this.isConfigured()) throw new ServiceUnavailableException('Falta configurar el acceso con Google. Podés ingresar con email o recuperar tu contraseña.');
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${(process.env.API_URL || 'http://localhost:3010').replace(/\/$/, '')}/api/auth/google/callback`;
        return new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUri);
    }

    async start(username?: string, linkUserId?: string) {
        if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) throw new BadRequestException('El nombre de usuario debe tener entre 3 y 20 letras, números o guiones bajos.');
        const client = this.client();
        const state = randomBytes(32).toString('hex');
        const nonce = randomBytes(32).toString('hex');
        const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
        const cookie = await this.jwt.signAsync({ purpose: 'google-login', state, nonce, codeVerifier, username, linkUserId }, { expiresIn: '10m', audience: 'google-login', issuer: 'finix-api' });
        const url = client.generateAuthUrl({ scope: ['openid', 'email', 'profile'], state, nonce,
            code_challenge: codeChallenge, code_challenge_method: CodeChallengeMethod.S256,
            prompt: 'select_account', access_type: 'online' });
        return { cookie, url };
    }

    async finish(code: string, state: string, cookie: string) {
        if (!code || !state || !cookie) throw new UnauthorizedException('La solicitud de Google venció. Volvé a iniciar sesión.');
        let flow: any;
        try { flow = await this.jwt.verifyAsync(cookie, { audience: 'google-login', issuer: 'finix-api', algorithms: ['HS256'] }); }
        catch { throw new UnauthorizedException('La solicitud de Google venció.'); }
        if (flow.purpose !== 'google-login' || flow.state !== state) throw new UnauthorizedException('Solicitud de Google inválida.');
        const client = this.client();
        const { tokens } = await client.getToken({ code, codeVerifier: flow.codeVerifier });
        if (!tokens.id_token) throw new UnauthorizedException('Google no devolvió una identidad.');
        const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
        const identity = ticket.getPayload();
        if (!identity?.sub || !identity.email || !identity.email_verified || (identity as any).nonce !== flow.nonce) {
            throw new UnauthorizedException('No se pudo verificar la identidad de Google.');
        }
        return this.resolveIdentity(identity, flow.username, flow.linkUserId);
    }

    async resolveIdentity(identity: { sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string }, username?: string, linkUserId?: string) {
        const email = identity.email?.trim().toLowerCase();
        if (!email || !identity.email_verified) throw new UnauthorizedException('Google debe verificar tu correo.');
        return this.prisma.$transaction(async tx => {
            const existingIdentity = await tx.externalIdentity.findUnique({ where: { provider_subject: { provider: 'google', subject: identity.sub } }, include: { user: true } });
            if (existingIdentity) {
                if (linkUserId && existingIdentity.userId !== linkUserId) throw new BadRequestException('La identidad ya pertenece a otra cuenta.');
                return existingIdentity.user;
            }
            const existingUser = await tx.user.findUnique({ where: { email } });
            // Imported Google identities bind by provider subject. Do not silently
            // link an unrelated password account just because its email matches.
            if (existingUser) {
                if (linkUserId !== existingUser.id) throw new BadRequestException('Ya existe una cuenta con este correo. Ingresá con tu contraseña o recuperala para conservar tu cuenta.');
                await tx.externalIdentity.create({ data: { provider: 'google', subject: identity.sub, userId: existingUser.id, metadata: { email } } });
                return existingUser;
            }
            if (linkUserId) throw new BadRequestException('Usá la cuenta de Google correspondiente al correo de Finix.');
            const base = (username || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 15).padEnd(3, '_');
            let chosen = base;
            for (let attempt = 0; await tx.user.findUnique({ where: { username: chosen }, select: { id: true } }); attempt++) {
                if (username) throw new BadRequestException('El nombre de usuario ya está en uso.');
                if (attempt > 20) throw new BadRequestException('No se pudo asignar un nombre de usuario.');
                chosen = `${base}_${randomBytes(2).toString('hex')}`;
            }
            const user = await tx.user.create({ data: { email, username: chosen, avatarUrl: identity.picture, emailVerified: true } });
            await tx.externalIdentity.create({ data: { provider: 'google', subject: identity.sub, userId: user.id, metadata: { email } } });
            return user;
        });
    }
}
