import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { RegisterDto, LoginDto } from '@finix/shared';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        // Check if user exists
        const exists = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, { username: dto.username }],
            },
        });

        if (exists) {
            throw new BadRequestException('User already exists');
        }

        const hashedPassword = await argon2.hash(dto.password);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                username: dto.username,
                password: hashedPassword,
            },
        });

        return this.signToken(user);
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const valid = await argon2.verify(user.password, dto.password);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.signToken(user);
    }

    private async signToken(user: User) {
        const payload = { sub: user.id, username: user.username, role: user.role };
        const token = await this.jwtService.signAsync(payload);
        return {
            access_token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email,
                isInfluencer: user.isInfluencer,
                bio: user.bio ?? null,
                avatarUrl: user.avatarUrl ?? null,
                createdAt: user.createdAt,
            }
        };
    }
}
