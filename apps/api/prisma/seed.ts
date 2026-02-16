import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    const password = await argon2.hash('password123');

    const admin = await prisma.user.upsert({
        where: { email: 'admin@finix.com' },
        update: {},
        create: {
            email: 'admin@finix.com',
            username: 'admin',
            password,
            role: 'ADMIN',
        },
    });

    const influencer = await prisma.user.upsert({
        where: { email: 'trader@finix.com' },
        update: {},
        create: {
            email: 'trader@finix.com',
            username: 'TopTrader',
            password,
            role: 'INFLUENCER',
            isInfluencer: true,
            bio: 'Professional FX Trader. Follow for signals.',
        },
    });

    const user = await prisma.user.upsert({
        where: { email: 'user@finix.com' },
        update: {},
        create: {
            email: 'user@finix.com',
            username: 'crypto_fan',
            password,
            role: 'USER',
        },
    });

    console.log({ admin, influencer, user });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
