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
            avatarUrl: 'https://i.pravatar.cc/150?u=admin',
            bio: 'Admin de Finix',
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
            bio: 'Professional FX Trader. Follow for signals and market analysis.',
            avatarUrl: 'https://i.pravatar.cc/150?u=trader',
            title: 'Analista de Trading',
            company: 'Finix Capital',
            accountType: 'PRO',
            plan: 'PRO',
            totalReturn: 125.4,
            winRate: 78.5,
        },
    });

    const user1 = await prisma.user.upsert({
        where: { email: 'sofia.cripto@finix.com' },
        update: {},
        create: {
            email: 'sofia.cripto@finix.com',
            username: 'SofiaCripto',
            password,
            role: 'USER',
            bio: 'Entusiasta de las finanzas descentralizadas (DeFi). HODL 🚀',
            avatarUrl: 'https://i.pravatar.cc/150?u=sofia',
            title: 'DeFi Investor',
            location: 'Buenos Aires, Argentina',
            specializations: JSON.stringify(["Crypto", "DeFi", "Web3"]),
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'martin.inversor@finix.com' },
        update: {},
        create: {
            email: 'martin.inversor@finix.com',
            username: 'MartinBull',
            password,
            role: 'USER',
            bio: 'Inversor a largo plazo. Value investing. Buscando los futuros unicornios.',
            avatarUrl: 'https://i.pravatar.cc/150?u=martin',
            title: 'Value Investor',
            location: 'Rosario, Argentina',
            specializations: JSON.stringify(["Stocks", "ETFs", "Value Investing"]),
            totalReturn: 42.1,
            accountType: 'BASIC',
        },
    });

    const user3 = await prisma.user.upsert({
        where: { email: 'lucia.fintech@finix.com' },
        update: {},
        create: {
            email: 'lucia.fintech@finix.com',
            username: 'LuciaTech',
            password,
            role: 'INFLUENCER',
            isInfluencer: true,
            bio: 'Especialista en Fintech y Mercados Emergentes. Analítica de datos aplicada al trading.',
            avatarUrl: 'https://i.pravatar.cc/150?u=lucia',
            title: 'Fintech Analyst',
            company: 'Tech Capital',
            location: 'Córdoba, Argentina',
            specializations: JSON.stringify(["Fintech", "Emerging Markets", "Data Analysis"]),
            accountType: 'PRO',
            plan: 'PRO',
            totalReturn: 88.3,
            winRate: 65.2,
        },
    });

    const user4 = await prisma.user.upsert({
        where: { email: 'carlos.acciones@finix.com' },
        update: {},
        create: {
            email: 'carlos.acciones@finix.com',
            username: 'CarlosAcciones',
            password,
            role: 'USER',
            bio: 'Amante de las acciones tradicionales. Inversiones seguras y dividendos.',
            avatarUrl: 'https://i.pravatar.cc/150?u=carlos',
            title: 'Inversor de Dividendos',
            location: 'Mendoza, Argentina',
            specializations: JSON.stringify(["Dividend Stocks", "Bonds"]),
        },
    });

    console.log({ admin, influencer, user1, user2, user3, user4 });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
