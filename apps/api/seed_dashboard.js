const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    let trader = await prisma.user.findFirst({ where: { username: 'TopTraderPRO' } });
    if (!trader) {
        trader = await prisma.user.create({
            data: {
                email: 'trader@finixarg.com',
                username: 'TopTraderPRO',
                bio: 'Trader profesional 📊',
                role: 'INFLUENCER',
                isInfluencer: true,
            }
        });
    }

    let channel = await prisma.hubChannel.findFirst({ where: { slug: 'general' } });
    if (!channel) {
        channel = await prisma.hubChannel.create({
            data: {
                name: 'General',
                slug: 'general',
                type: 'POSTS',
                order: 1
            }
        });
    }

    const postsCount = await prisma.hubPost.count();
    if (postsCount === 0) {
        await prisma.hubPost.create({
            data: {
                content: 'El mercado cripto está experimentando una corrección fuerte hoy. Es momento de observar los retrocesos en $BTC y $ETH. ¿Qué opinan?',
                authorId: trader.id,
                channelId: channel.id,
            }
        });
        await prisma.hubPost.create({
            data: {
                content: 'Acabo de actualizar mi portafolio. Agregué posiciones en $AMD y $TSLA a la espera de la apertura de mañana.',
                authorId: trader.id,
                channelId: channel.id,
            }
        });
        await prisma.hubPost.create({
            data: {
                content: 'Impresionante el rendimiento del sector energético. YPF marcando máximos en la bolsa local. $YPF',
                authorId: trader.id,
                channelId: channel.id,
            }
        });
        console.log('Hub Posts seeded!');
    } else {
        console.log('Hub Posts already existed: ' + postsCount);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
