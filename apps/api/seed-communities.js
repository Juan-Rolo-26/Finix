"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    let adminUser = await prisma.user.findFirst({
        where: { email: 'finix_news@finixarg.com' }
    });
    if (!adminUser) {
        adminUser = await prisma.user.create({
            data: {
                id: 'finix-official-creator',
                email: 'finix_news@finixarg.com',
                username: 'finix_oficial',
                password: 'no-password',
                isVerified: true,
                role: 'ADMIN',
                emailVerified: true,
                plan: 'PRO_CREATOR',
            }
        });
    }
    const categories = [
        { name: 'Inversores Argentinos', desc: 'La comunidad más grande de inversores argentinos. Analizamos el Merval, CEDEARs, dólar MEP y oportunidades locales todos los días.', cat: 'Acciones' },
        { name: 'Finanzas Personales AR', desc: '¿Cómo cuidar tu plata con inflación? Ahorro, tarjetas de crédito, plazos fijos y los mejores fondos comunes de inversión.', cat: 'Finanzas personales' },
        { name: 'Crypto Argentina', desc: 'Bitcoin, Ethereum, USDT y el ecosistema DeFi. Compartí estrategias y enterate de las últimas noticias sobre regulaciones crypto.', cat: 'Cripto' },
        { name: 'Tech & IA Stocks', desc: 'Seguimiento de Nvidia, Microsoft, Apple y todo el mundo de la Inteligencia Artificial. ¿Es burbuja o futuro?', cat: 'Tecnología' },
        { name: 'Club de Dividendos', desc: 'El lugar para los amantes del interés compuesto. Estrategias para armar un portafolio sólido enfocado en flujo de caja pasivo.', cat: 'Dividendos' }
    ];
    for (const c of categories) {
        await prisma.community.create({
            data: {
                name: c.name,
                description: c.desc,
                category: c.cat,
                privacyType: 'PUBLIC',
                creatorId: adminUser.id,
                imageUrl: 'https://i.ibb.co/31zL73f/finix-logo.png',
                plans: {
                    create: [
                        {
                            name: 'Gratis',
                            price: 0,
                            tierLevel: 1,
                            features: JSON.stringify(['Acceso a foros base', 'Eventos semanales libres'])
                        }
                    ]
                }
            }
        });
        console.log('Comunidad creada:', c.name);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-communities.js.map