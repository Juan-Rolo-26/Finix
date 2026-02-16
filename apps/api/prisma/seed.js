"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = require("argon2");
const prisma = new client_1.PrismaClient();
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
    await prisma.post.create({
        data: {
            content: 'Bitcoin looking bullish today! $BTC',
            authorId: influencer.id,
            tickers: '$BTC',
        }
    });
    await prisma.post.create({
        data: {
            content: 'Vigilando de cerca la resistencia de $AAPL en 175. Si rompe con volumen, podríamos ver un rally hasta 182 para el fin de semana. 🚀',
            authorId: influencer.id,
            tickers: '$AAPL',
        }
    });
    await prisma.post.create({
        data: {
            content: '¿Qué opinan de $TSLA? Está en un nivel interesante para entrar largo plazo.',
            authorId: user.id,
            tickers: '$TSLA',
        }
    });
    await prisma.post.create({
        data: {
            content: 'El mercado está muy volátil hoy. Mejor esperar a que se calme antes de tomar posiciones. $SPY',
            authorId: influencer.id,
            tickers: '$SPY',
        }
    });
    const portfolio = await prisma.portfolio.create({
        data: {
            userId: user.id,
            nombre: 'Mi Portfolio Principal',
            descripcion: 'Portfolio de inversión a largo plazo',
            objetivo: 'largo plazo',
            monedaBase: 'USD',
            nivelRiesgo: 'medio',
            esPrincipal: true,
        }
    });
    await prisma.asset.create({
        data: {
            portfolioId: portfolio.id,
            ticker: 'AAPL',
            tipoActivo: 'acciones',
            montoInvertido: 1500.00,
            ppc: 150.00,
            cantidad: 10,
            precioActual: 155.00,
        }
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
//# sourceMappingURL=seed.js.map