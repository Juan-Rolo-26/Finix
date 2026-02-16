import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

@Injectable()
export class DemoUserService {
    private cachedId: string | null = null;

    constructor(private prisma: PrismaService) { }

    async getOrCreateDemoUserId() {
        if (this.cachedId) {
            return this.cachedId;
        }

        const email = 'demo@finix.local';
        const username = 'demo_user';

        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username },
                ],
            },
            select: { id: true },
        });

        if (existing?.id) {
            this.cachedId = existing.id;
            return existing.id;
        }

        try {
            const created = await this.prisma.user.create({
                data: {
                    email,
                    username,
                    password: 'demo',
                    role: 'USER',
                    isInfluencer: false,
                },
                select: { id: true },
            });
            this.cachedId = created.id;
            return created.id;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const fallbackUsername = `demo_${Math.random().toString(36).slice(2, 8)}`;
                const created = await this.prisma.user.create({
                    data: {
                        email,
                        username: fallbackUsername,
                        password: 'demo',
                        role: 'USER',
                        isInfluencer: false,
                    },
                    select: { id: true },
                });
                this.cachedId = created.id;
                return created.id;
            }
            throw error;
        }
    }
}
