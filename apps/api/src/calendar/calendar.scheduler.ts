import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CalendarService } from './calendar.service';

@Injectable()
export class CalendarScheduler {
    private readonly logger = new Logger(CalendarScheduler.name);

    constructor(private readonly calendarService: CalendarService) { }

    /**
     * Actualiza el calendario y los dividendos después del cierre del viernes,
     * dejando preparados los eventos de lunes a domingo de la semana siguiente.
     */
    @Cron('15 16 * * 5', {
        timeZone: 'America/New_York',
    })
    async handleFridayWeeklySync() {
        const now = new Date();
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).formatToParts(now);
        const part = (type: string) => parts.find(item => item.type === type)?.value || '';
        const nextMonday = new Date(Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day')) + 3));
        const nextSunday = new Date(nextMonday);
        nextSunday.setUTCDate(nextSunday.getUTCDate() + 6);
        const from = nextMonday.toISOString().slice(0, 10);
        const to = nextSunday.toISOString().slice(0, 10);

        this.logger.log(`[CalendarScheduler] Viernes tras el cierre: preparando calendario de la semana siguiente (${from} a ${to})...`);
        try {
            const result = await this.calendarService.syncWeeklyData(from, to);
            this.logger.log(`[CalendarScheduler] Sincronización semanal finalizada: ${result.eventsProcessed} eventos procesados y ${result.errors} errores.`);
        } catch (error: any) {
            this.logger.error(`[CalendarScheduler] Error en sincronización semanal: ${error.message}`);
        }
    }

    /**
     * Actualiza balances ya reportados durante los días hábiles.
     */
    @Cron('0 11 * * 1-5', {
        timeZone: 'America/Argentina/Buenos_Aires',
    })
    async handleWeekday11AmReportedEarningsSync() {
        this.logger.log('[CalendarScheduler] Sincronizando balances reportados y sorpresas...');
        try {
            await this.calendarService.syncReportedEarningsResults();
            this.logger.log('[CalendarScheduler] Sincronización de balances reportados finalizada.');
        } catch (error: any) {
            this.logger.error(`[CalendarScheduler] Error al actualizar balances reportados: ${error.message}`);
        }
    }
}
