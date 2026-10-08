import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { MarketService } from './src/market/market.service';

async function main() {
    const prisma = new PrismaClient();
    const market = new MarketService(prisma as any);

    for (const ticker of ['MSFT', 'AMD', 'SPY', 'BTC-USD', 'BTCUSDT']) {
        console.log(`\nTesting getCandles for ${ticker}:`);
        for (const range of ['1mo', '1y', 'max']) {
            try {
                const res = await market.getCandles(ticker, '1d', range);
                console.log(`  range ${range}: candles count = ${res.candles?.length ?? 0}`);
            } catch (err: any) {
                console.error(`  range ${range} ERROR:`, err.message);
            }
        }
    }

    await prisma.$disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
