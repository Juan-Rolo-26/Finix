import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { AnalysisService } from '../src/analysis/analysis.service';

const TARGET_TICKERS = [
    'TSLA',   // Tesla
    'AAPL',   // Apple
    'MSFT',   // Microsoft
    'AMZN',   // Amazon
    'NVDA',   // NVIDIA
    'META',   // Meta Platforms
    'NFLX',   // Netflix
    'AMD',    // Advanced Micro Devices
    'INTC',   // Intel
    'BABA',   // Alibaba
    'MELI',   // MercadoLibre
    'KO',     // Coca-Cola
    'PEP',    // PepsiCo
    'DIS',    // Walt Disney
    'NKE',    // Nike
    'JPM',    // JPMorgan Chase
    'V',      // Visa
    'WMT',    // Walmart
    'MCD',    // McDonald's
    'PYPL',   // PayPal
    'UBER',   // Uber
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log('🚀 Starting Seeding of Top 20 Companies into AssetAnalysis (Real DB)...');
    const prisma = new PrismaClient();
    const service = new AnalysisService(prisma as any);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < TARGET_TICKERS.length; i++) {
        const ticker = TARGET_TICKERS[i];
        console.log(`\n[${i + 1}/${TARGET_TICKERS.length}] Procesando ${ticker}...`);

        try {
            const data: any = await service.fetchTradingViewAssetData(ticker);
            if (!data || !data.ticker) {
                console.warn(`⚠️ No se obtuvieron datos para ${ticker}`);
                failCount++;
                continue;
            }

            data.status = 'PUBLISHED';
            data.isActive = true;

            const saved = await service.createAnalysis(data, undefined);
            console.log(`✅ [OK] ${saved.ticker} - "${saved.companyName}" guardado con éxito (Status: ${saved.status}, Precio: $${saved.currentPrice})`);
            successCount++;
        } catch (err: any) {
            console.error(`❌ Error procesando ${ticker}:`, err.message || err);
            failCount++;
        }

        // Delay 1.2s to avoid rate limiting
        await sleep(1200);
    }

    console.log('\n=============================================');
    console.log(`✨ Proceso completado: ${successCount} exitosos, ${failCount} fallidos.`);

    const totalAnalyses = await prisma.assetAnalysis.findMany({
        select: {
            id: true,
            ticker: true,
            companyName: true,
            currentPrice: true,
            peRatio: true,
            status: true,
        },
        orderBy: { ticker: 'asc' },
    });

    console.log(`\n📊 Total de análisis en la base de datos (${totalAnalyses.length}):`);
    console.table(totalAnalyses);

    await prisma.$disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error in seeding script:', err);
    process.exit(1);
});
