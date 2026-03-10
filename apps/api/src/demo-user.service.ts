import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from './prisma.service';

@Injectable()
export class DemoUserService {
    private cachedId: string | null = null;
    private readonly demoEmail = 'demo@finix.local';
    private readonly demoUsername = 'demo_user';
    private readonly demoPassword = 'finixdemo123';

    constructor(private prisma: PrismaService) { }

    private async buildDemoPasswordHash() {
        return argon2.hash(this.demoPassword);
    }

    private demoUserData(passwordHash: string) {
        return {
            email: this.demoEmail,
            username: this.demoUsername,
            password: passwordHash,
            role: 'USER',
            isInfluencer: false,
            isVerified: true,
            emailVerified: true,
            plan: 'FREE',
            onboardingCompleted: true,
            onboardingStep: 5,
            bio: 'Usuario demo de Finix para pruebas locales.',
            location: 'Cordoba, Argentina',
        } as const;
    }

    async getOrCreateDemoUser() {
        if (this.cachedId) {
            const cachedUser = await this.prisma.user.findUnique({
                where: { id: this.cachedId },
            });
            if (cachedUser) {
                return cachedUser;
            }
            this.cachedId = null;
        }

        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: this.demoEmail },
                    { username: this.demoUsername },
                ],
            },
        });

        const passwordHash = await this.buildDemoPasswordHash();
        const demoData = this.demoUserData(passwordHash);

        if (existing?.id) {
            const updated = await this.prisma.user.update({
                where: { id: existing.id },
                data: {
                    ...demoData,
                    username: existing.username === this.demoUsername ? this.demoUsername : existing.username,
                },
            });
            this.cachedId = updated.id;
            return updated;
        }

        try {
            const created = await this.prisma.user.create({
                data: demoData,
            });
            this.cachedId = created.id;
            return created;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const fallbackUsername = `demo_${Math.random().toString(36).slice(2, 8)}`;
                const created = await this.prisma.user.create({
                    data: {
                        ...demoData,
                        username: fallbackUsername,
                    },
                });
                this.cachedId = created.id;
                return created;
            }
            throw error;
        }
    }

    getDemoCredentials() {
        return {
            email: this.demoEmail,
            username: this.demoUsername,
            password: this.demoPassword,
        };
    }
}
