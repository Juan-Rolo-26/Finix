import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { MarketService } from './src/market/market.service';

async function main() {
    const prisma = new PrismaClient();
    const market = new MarketService(prisma as any);

    const res1 = await market.getCandles('MSFT', '1d', 'max');
    const c1 = res1.candles ?? [];
    console.log('MSFT max candles:');
    console.log('First candle:', c1[0] ? new Date(c1[0].time * 1000).toISOString() : 'none', c1[0]);
    console.log('Last candle:', c1[c1.length - 1] ? new Date(c1[c1.length - 1].time * 1000).toISOString() : 'none', c1[c1.length - 1]);

    const res2 = await market.getCandles('MSFT', '1d', '1y');
    const c2 = res2.candles ?? [];
    console.log('MSFT 1y candles:');
    console.log('First candle:', c2[0] ? new Date(c2[0].time * 1000).toISOString() : 'none', c2[0]);
    console.log('Last candle:', c2[c2.length - 1] ? new Date(c2[c2.length - 1].time * 1000).toISOString() : 'none', c2[c2.length - 1]);

    await prisma.$disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
