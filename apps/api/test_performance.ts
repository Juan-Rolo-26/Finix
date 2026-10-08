import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PortfolioPerformanceService } from './src/portfolio/portfolio-performance.service';
import { MarketService } from './src/market/market.service';

async function main() {
    const prisma = new PrismaClient();
    const marketService = new MarketService(prisma as any);
    const service = new PortfolioPerformanceService(prisma as any, marketService);

    const portfolioId = '6c4db5d8-d4d0-4f24-b663-67759c36f884';
    const userId = '68661e5a-0ebb-4add-b409-d9f08365332e';

    console.log('Testing getPerformance for ranges: 1D, 1M, ALL...');
    for (const range of ['1D', '1M', 'ALL']) {
        try {
            const perf = await service.getPerformance(portfolioId, userId, range, 'ARS');
            console.log(`\n--- Range: ${range} ---`);
            console.log('insufficientData:', (perf as any).insufficientData);
            console.log('message:', (perf as any).message);
            console.log('series count:', (perf as any).series?.length);
            console.log('series sample:', (perf as any).series?.slice(0, 3));
            console.log('markers:', (perf as any).markers);
        } catch (err: any) {
            console.error(`Error on range ${range}:`, err.message);
        }
    }

    console.log('\nTesting getBenchmarks for ALL...');
    try {
        const bench = await service.getBenchmarks(portfolioId, userId, 'ALL', ['sp500'], 'ARS');
        console.log('benchmarks:', {
            benchmarkAvailable: bench.benchmarkAvailable,
            seriesCount: bench.series?.length,
            seriesSample: bench.series?.slice(0, 3),
            returns: bench.returns,
        });
    } catch (err: any) {
        console.error('Error on getBenchmarks:', err.message);
    }

    console.log('\nTesting getReturns (Monthly)...');
    try {
        const returns = await service.getReturns(portfolioId, userId, 'ARS');
        console.log('returns count:', returns.length, returns);
    } catch (err: any) {
        console.error('Error on getReturns:', err.message);
    }

    await prisma.$disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
