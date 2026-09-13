import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { MarketDataProviderService } from './market-data-provider.service';
import { AssetLogoService } from './asset-logo.service';
import { MarketQuoteResult } from '../interfaces/market-data-provider.interface';

export interface TopGainersResponse {
    type: 'TOP_GAINERS' | 'TOP_LOSERS';
    date: string;
    market: 'SP500';
    isStale?: boolean;
    updatedAt: string;
    items: Array<{
        rank: number;
        ticker: string;
        companyName: string;
        price: number;
        previousClose: number;
        change: number;
        changePercent: number;
        volume: number;
        logoUrl: string;
        timestamp: string;
    }>;
}

@Injectable()
export class MarketRankingService {
    private readonly logger = new Logger(MarketRankingService.name);

    // Memoria caché para respuesta inmediata
    private cachedTopGainers: TopGainersResponse | null = null;
    private cacheTime: number = 0;
    private cachedTopLosers: TopGainersResponse | null = null;
    private cacheLosersTime: number = 0;
    private readonly CACHE_TTL_MS = 60 * 1000; // 1 minuto

    constructor(
        private prisma: PrismaService,
        private provider: MarketDataProviderService,
        private logoService: AssetLogoService,
    ) { }

    /**
     * Sincroniza los componentes del S&P 500 en la base de datos.
     */
    async syncSP500Universe(): Promise<number> {
        this.logger.log('Syncing S&P 500 universe...');
        const constituents = await this.provider.getSP500Constituents();

        const res = await this.prisma.sP500Asset.createMany({
            data: constituents.map(c => ({
                ticker: c.ticker,
                companyName: c.companyName,
                sector: c.sector || null,
                industry: c.industry || null,
                isActive: true,
                updatedAt: new Date(),
            })),
            skipDuplicates: true,
        });

        this.logger.log(`Synced ${res.count} new S&P 500 constituents in database.`);
        return res.count;
    }

    /**
     * Formatea una fecha a YYYY-MM-DD en zona horaria America/New_York
     */
    getCurrentNewYorkDate(): string {
        const d = new Date();
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(d);
    }

    /**
     * Proceso principal de ejecución diaria del ranking.
     * Idempotente: si ya se ejecutó el mismo día, actualiza sin duplicar.
     */
    async executeDailyRanking(targetDate?: string, rankingType: string = 'TOP_GAINERS'): Promise<{
        success: boolean;
        date: string;
        topResults: any[];
        topLosers?: any[];
        count: number;
        errors: number;
    }> {
        const startTime = Date.now();
        const date = targetDate || this.getCurrentNewYorkDate();
        this.logger.log(`Starting ranking execution for ${rankingType} on ${date}...`);

        let assetsProcessed = 0;
        let errorsCount = 0;
        let top5Items: any[] = [];

        try {
            // 1. Asegurar que tenemos componentes S&P 500
            let sp500Assets = await this.prisma.sP500Asset.findMany({
                where: { isActive: true },
            });

            if (sp500Assets.length < 400) {
                this.logger.warn('Fewer than 400 S&P 500 assets found. Syncing universe first...');
                await this.syncSP500Universe();
                sp500Assets = await this.prisma.sP500Asset.findMany({ where: { isActive: true } });
            }

            const tickers = sp500Assets.map(a => a.ticker);
            const assetMap = new Map(sp500Assets.map(a => [a.ticker, a]));

            // 2. Obtener cotizaciones de mercado
            const quotesMap = await this.provider.getBatchQuotes(tickers);
            assetsProcessed = quotesMap.size;

            // 3. Validar y calcular
            const validQuotes: Array<MarketQuoteResult & { sp500AssetId?: string; companyName: string }> = [];

            for (const [ticker, quote] of quotesMap.entries()) {
                const asset = assetMap.get(ticker);
                if (!asset) continue;

                // Validaciones estrictas: precio > 0, previousClose > 0, volume > 0, porcentaje válido
                if (
                    !quote.price || quote.price <= 0 ||
                    !quote.previousClose || quote.previousClose <= 0 ||
                    !quote.volume || quote.volume <= 0 ||
                    !Number.isFinite(quote.changePercent)
                ) {
                    errorsCount++;
                    continue;
                }

                // Validar coherencia del cambio porcentual
                const calculatedPercent = Number((((quote.price - quote.previousClose) / quote.previousClose) * 100).toFixed(4));
                validQuotes.push({
                    ...quote,
                    changePercent: calculatedPercent,
                    sp500AssetId: asset.id,
                    companyName: asset.companyName,
                });
            }

            // 4. TOP GAINERS (Mayor rendimiento porcentual DESC - hasta 50 para vistas ampliadas TOP 10, 25, 50)
            const gainersSorted = [...validQuotes].sort((a, b) => b.changePercent - a.changePercent);
            const topGainersToSave = gainersSorted.slice(0, 50);
            const savedGainers = await this.saveRankingList(date, 'TOP_GAINERS', topGainersToSave);

            // 5. TOP LOSERS (Peor rendimiento porcentual ASC - hasta 50 para vistas ampliadas TOP 10, 25, 50)
            const losersSorted = [...validQuotes].sort((a, b) => a.changePercent - b.changePercent);
            const topLosersToSave = losersSorted.slice(0, 50);
            const savedLosers = await this.saveRankingList(date, 'TOP_LOSERS', topLosersToSave);

            const durationMs = Date.now() - startTime;

            // 6. Registrar logs de ejecución para ambos rankings
            await this.prisma.marketRankingExecutionLog.create({
                data: {
                    rankingType: 'TOP_GAINERS',
                    targetDate: date,
                    status: 'SUCCESS',
                    providerUsed: this.provider.providerName,
                    assetsProcessed,
                    errorsCount,
                    durationMs,
                    topResultsJson: JSON.stringify(topGainersToSave.slice(0, 5).map(t => ({ ticker: t.ticker, changePercent: t.changePercent }))),
                },
            });

            await this.prisma.marketRankingExecutionLog.create({
                data: {
                    rankingType: 'TOP_LOSERS',
                    targetDate: date,
                    status: 'SUCCESS',
                    providerUsed: this.provider.providerName,
                    assetsProcessed,
                    errorsCount,
                    durationMs,
                    topResultsJson: JSON.stringify(topLosersToSave.slice(0, 5).map(t => ({ ticker: t.ticker, changePercent: t.changePercent }))),
                },
            });

            // Invalidar cache en memoria
            this.cachedTopGainers = null;
            this.cachedTopLosers = null;

            this.logger.log(`Rankings completed in ${durationMs}ms. Top 5 Gainers & Top 5 Losers saved.`);
            return {
                success: true,
                date,
                topResults: savedGainers,
                topLosers: savedLosers,
                count: assetsProcessed,
                errors: errorsCount,
            };
        } catch (error: any) {
            const durationMs = Date.now() - startTime;
            this.logger.error(`Ranking execution failed: ${error.message}`, error.stack);

            await this.prisma.marketRankingExecutionLog.create({
                data: {
                    rankingType,
                    targetDate: date,
                    status: 'FAILED',
                    providerUsed: this.provider.providerName,
                    assetsProcessed,
                    errorsCount,
                    durationMs,
                    errorMessage: error.message,
                },
            });

            throw error;
        }
    }

    /**
     * Helper para guardar items de ranking con sus logos de TradingView
     */
    private async saveRankingList(date: string, rankingType: string, items: any[]): Promise<any[]> {
        const savedList = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const rank = i + 1;
            const logoUrl = await this.logoService.resolveTradingViewLogo(item.ticker);

            const saved = await this.prisma.dailyMarketRanking.upsert({
                where: {
                    date_rankingType_rank: {
                        date,
                        rankingType,
                        rank,
                    },
                },
                update: {
                    ticker: item.ticker,
                    companyName: item.companyName,
                    price: item.price,
                    previousClose: item.previousClose,
                    change: item.change,
                    changePercent: item.changePercent,
                    volume: item.volume,
                    logoUrl,
                    marketTimestamp: new Date(item.timestamp * 1000),
                    sp500AssetId: item.sp500AssetId,
                },
                create: {
                    date,
                    rankingType,
                    rank,
                    ticker: item.ticker,
                    companyName: item.companyName,
                    price: item.price,
                    previousClose: item.previousClose,
                    change: item.change,
                    changePercent: item.changePercent,
                    volume: item.volume,
                    logoUrl,
                    marketTimestamp: new Date(item.timestamp * 1000),
                    sp500AssetId: item.sp500AssetId,
                },
            });
            savedList.push(saved);
        }
        return savedList;
    }

    /**
     * Obtiene los mejores rendimientos del S&P 500 (TOP 5 Gainers).
     */
    async getTopGainers(requestedDate?: string): Promise<TopGainersResponse> {
        return this.getTopRankings('TOP_GAINERS', requestedDate);
    }

    /**
     * Obtiene los peores rendimientos del S&P 500 (TOP 5 Losers).
     */
    async getTopLosers(requestedDate?: string): Promise<TopGainersResponse> {
        return this.getTopRankings('TOP_LOSERS', requestedDate);
    }

    /**
     * Método genérico para consultar TOP 5 de cualquier tipo de ranking (GAINERS o LOSERS).
     */
    async getTopRankings(rankingType: 'TOP_GAINERS' | 'TOP_LOSERS', requestedDate?: string): Promise<TopGainersResponse> {
        const isGainers = rankingType === 'TOP_GAINERS';
        const cached = isGainers ? this.cachedTopGainers : this.cachedTopLosers;
        const cacheTime = isGainers ? this.cacheTime : this.cacheLosersTime;

        if (!requestedDate && cached && Date.now() - cacheTime < this.CACHE_TTL_MS) {
            return cached;
        }

        const currentDate = this.getCurrentNewYorkDate();
        const date = requestedDate || currentDate;

        let rankings = await this.prisma.dailyMarketRanking.findMany({
            where: {
                date,
                rankingType,
            },
            orderBy: { rank: 'asc' },
            take: 5,
        });

        let isStale = false;
        let actualDate = date;

        if (rankings.length === 0) {
            const latestRecord = await this.prisma.dailyMarketRanking.findFirst({
                where: { rankingType },
                orderBy: { date: 'desc' },
            });

            if (latestRecord) {
                actualDate = latestRecord.date;
                rankings = await this.prisma.dailyMarketRanking.findMany({
                    where: {
                        date: actualDate,
                        rankingType,
                    },
                    orderBy: { rank: 'asc' },
                    take: 5,
                });
                isStale = true;
            }
        }

        const response: TopGainersResponse = {
            type: rankingType,
            date: actualDate,
            market: 'SP500',
            isStale,
            updatedAt: rankings[0]?.updatedAt ? rankings[0].updatedAt.toISOString() : new Date().toISOString(),
            items: rankings.map(r => ({
                rank: r.rank,
                ticker: r.ticker,
                companyName: r.companyName,
                price: Number(r.price.toFixed(2)),
                previousClose: Number(r.previousClose.toFixed(2)),
                change: Number(r.change.toFixed(2)),
                changePercent: Number(r.changePercent.toFixed(2)),
                volume: r.volume,
                logoUrl: (r.logoUrl && r.logoUrl.includes('tradingview.com')) ? r.logoUrl : this.logoService.getCanonicalLogoUrl(r.ticker),
                timestamp: r.marketTimestamp.toISOString(),
            })),
        };

        if (!requestedDate) {
            if (isGainers) {
                this.cachedTopGainers = response;
                this.cacheTime = Date.now();
            } else {
                this.cachedTopLosers = response;
                this.cacheLosersTime = Date.now();
            }
        }

        return response;
    }

    /**
     * Devuelve el ranking con soporte para paginación/filtros (para página "Ver todos").
     */
    async getRankingsList(options: {
        type?: string;
        date?: string;
        limit?: number;
    }) {
        const rankingType = options.type || 'TOP_GAINERS';
        let date = options.date;

        if (!date) {
            const latest = await this.prisma.dailyMarketRanking.findFirst({
                where: { rankingType },
                orderBy: { date: 'desc' },
            });
            date = latest ? latest.date : this.getCurrentNewYorkDate();
        }

        const requestedLimit = options.limit || 50;
        let items = await this.prisma.dailyMarketRanking.findMany({
            where: {
                date,
                rankingType,
            },
            orderBy: { rank: 'asc' },
            take: requestedLimit,
        });

        // Si se pidieron más items de los que existen almacenados (ej: TOP 10, 25 o 50),
        // ejecutamos el cálculo para expandir la lista completa
        if (items.length < requestedLimit && items.length < 50) {
            try {
                this.logger.log(`Expanding rankings for ${rankingType} on ${date}: have ${items.length}, requested ${requestedLimit}...`);
                await this.executeDailyRanking();
                items = await this.prisma.dailyMarketRanking.findMany({
                    where: {
                        date,
                        rankingType,
                    },
                    orderBy: { rank: 'asc' },
                    take: requestedLimit,
                });
            } catch (err: any) {
                this.logger.warn(`Could not expand rankings automatically: ${err.message}`);
            }
        }

        return {
            type: rankingType,
            date,
            market: 'SP500',
            total: items.length,
            items: items.map(r => ({
                rank: r.rank,
                ticker: r.ticker,
                companyName: r.companyName,
                price: Number(r.price.toFixed(2)),
                previousClose: Number(r.previousClose.toFixed(2)),
                change: Number(r.change.toFixed(2)),
                changePercent: Number(r.changePercent.toFixed(2)),
                volume: r.volume,
                logoUrl: (r.logoUrl && r.logoUrl.includes('tradingview.com')) ? r.logoUrl : this.logoService.getCanonicalLogoUrl(r.ticker),
                timestamp: r.marketTimestamp.toISOString(),
            })),
        };
    }

    /**
     * Consulta historial y logs para panel administrativo.
     */
    async getAdminOverview() {
        const latestRankings = await this.getTopGainers();
        const logs = await this.prisma.marketRankingExecutionLog.findMany({
            orderBy: { executedAt: 'desc' },
            take: 20,
        });
        const totalSP500 = await this.prisma.sP500Asset.count();

        return {
            latestRankings,
            logs,
            totalSP500Assets: totalSP500,
            serverDateNY: this.getCurrentNewYorkDate(),
        };
    }
}
