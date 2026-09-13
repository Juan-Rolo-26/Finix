import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MarketRankingService } from './services/market-ranking.service';

@Injectable()
export class MarketRankingScheduler {
    private readonly logger = new Logger(MarketRankingScheduler.name);

    constructor(private readonly rankingService: MarketRankingService) { }

    /**
     * Se ejecuta de lunes a viernes a las 4:50 PM (16:50 ET) hora de Nueva York (America/New_York).
     * Solo en días en los que haya habido mercado bursátil estadounidense (excluye fines de semana y feriados de Wall Street).
     */
    @Cron('50 16 * * 1-5', {
        timeZone: 'America/New_York',
    })
    async handleMarketCloseRanking() {
        const now = new Date();
        if (this.isUSMarketHoliday(now)) {
            this.logger.log(`[Cron 16:50 ET] Hoy no hubo operaciones en el mercado bursátil de EE.UU. (Feriado). Omitiendo cálculo.`);
            return;
        }

        this.logger.log('[Cron 16:50 ET] Cierre y consolidación del mercado bursátil de EE.UU. Ejecutando ranking S&P 500...');
        try {
            const result = await this.rankingService.executeDailyRanking();
            this.logger.log(`[Cron 16:50 ET] Ranking finalizado con éxito para ${result.date}. Top 5 guardado.`);
        } catch (error: any) {
            this.logger.error(`[Cron 16:50 ET] Error en ejecución de ranking: ${error.message}`);
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
