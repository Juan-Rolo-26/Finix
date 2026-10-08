import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    const portfolios = await prisma.portfolio.findMany({
        include: {
            holdings: { include: { asset: true } },
            transactions: { include: { asset: true }, orderBy: { date: 'asc' } },
        },
    });

    console.log('=== PORTFOLIOS IN DB ===', portfolios.length);
    for (const p of portfolios) {
        console.log({
            id: p.id,
            nombre: p.nombre,
            userId: p.userId,
            monedaBase: p.monedaBase,
            holdingsCount: p.holdings.length,
            txsCount: p.transactions.length,
            holdings: p.holdings.map(h => ({ ticker: h.asset?.ticker, qty: String(h.quantity), cost: String(h.averageCost) })),
            txs: p.transactions.map(t => ({ ticker: t.asset?.ticker, type: t.type, qty: String(t.quantity), price: String(t.pricePerUnit), date: t.date })),
        });
    }

    await prisma.$disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
