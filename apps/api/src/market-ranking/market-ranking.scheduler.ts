import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MarketRankingService } from './services/market-ranking.service';

@Injectable()
export class MarketRankingScheduler implements OnModuleInit {
    private readonly logger = new Logger(MarketRankingScheduler.name);

    constructor(private readonly rankingService: MarketRankingService) { }

    /**
     * Al iniciar el módulo, verificamos si ya existe el ranking del último día hábil.
     * Si no existe o la base de datos está vacía, se ejecuta inmediatamente.
     */
    async onModuleInit() {
        this.logger.log('Inicializando MarketRankingScheduler. Verificando frescura de rankings...');
        setTimeout(async () => {
            try {
                const today = this.rankingService.getCurrentNewYorkDate();
                const existing = await this.rankingService.getTopGainers(today);
                if (!existing || existing.items.length === 0 || existing.isStale) {
                    this.logger.log(`No hay ranking actualizado para la fecha ${today}. Ejecutando cálculo inicial...`);
                    await this.rankingService.executeDailyRanking();
                }
            } catch (err: any) {
                this.logger.warn(`Error en verificación inicial de rankings: ${err.message}`);
            }
        }, 5000); // 5s delay para permitir inicialización de Prisma y conexiones
    }

    /**
     * Se ejecuta de lunes a viernes al cierre de Wall Street:
     * 1) 16:50 ET: Consolidación preliminar tras el toque de campana.
     */
    @Cron('50 16 * * 1-5', {
        timeZone: 'America/New_York',
    })
    async handleMarketCloseRanking() {
        await this.runRankingJob('Cierre oficial 16:50 ET');
    }

    /**
     * 2) 18:15 ET: Liquidación y cierre definitivo de la jornada.
     */
    @Cron('15 18 * * 1-5', {
        timeZone: 'America/New_York',
    })
    async handlePostMarketSettlement() {
        await this.runRankingJob('Liquidación post-mercado 18:15 ET');
    }

    /**
     * 3) Actualizaciones intradía durante la rueda (11:00, 13:00, 15:00 ET).
     */
    @Cron('0 11,13,15 * * 1-5', {
        timeZone: 'America/New_York',
    })
    async handleIntradayRanking() {
        await this.runRankingJob('Actualización intradía');
    }

    /**
     * 4) Chequeo diario a las 20:00 ET (todos los días para garantizar consistencia).
     */
    @Cron('0 20 * * *', {
        timeZone: 'America/New_York',
    })
    async handleDailyEveningCheck() {
        await this.runRankingJob('Verificación nocturna diaria 20:00 ET');
    }

    private async runRankingJob(triggerName: string) {
        const now = new Date();
        const dayOfWeek = now.getDay();
        // Si es fin de semana (0=Domingo, 6=Sábado), omitir ejecución si los mercados están cerrados
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return;
        }

        if (this.isUSMarketHoliday(now)) {
            this.logger.log(`[${triggerName}] Hoy no hubo operaciones en el mercado bursátil de EE.UU. (Feriado). Omitiendo.`);
            return;
        }

        this.logger.log(`[${triggerName}] Ejecutando actualización de rankings diarios S&P 500...`);
        try {
            const result = await this.rankingService.executeDailyRanking();
            this.logger.log(`[${triggerName}] Ranking finalizado con éxito para ${result.date}. Top Gainers y Losers actualizados.`);
        } catch (error: any) {
            this.logger.error(`[${triggerName}] Error en ejecución de ranking: ${error.message}`);
        }
    }

    /**
     * Días festivos oficiales del New York Stock Exchange (NYSE) / NASDAQ donde el mercado está cerrado.
     */
    private isUSMarketHoliday(date: Date): boolean {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const dateStr = formatter.format(date); // e.g. "2026-09-13"

        // Calendario oficial de feriados del NYSE / NASDAQ
        const usMarketHolidays = new Set([
            // 2025
            '2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18', '2025-05-26',
            '2025-06-19', '2025-07-04', '2025-09-01', '2025-11-27', '2025-12-25',
            // 2026
            '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25',
            '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
            // 2027
            '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31',
            '2027-06-18', '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24',
        ]);

        return usMarketHolidays.has(dateStr);
    }
}
