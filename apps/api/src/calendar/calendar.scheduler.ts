import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CalendarService } from './calendar.service';

@Injectable()
export class CalendarScheduler {
    private readonly logger = new Logger(CalendarScheduler.name);

    constructor(private readonly calendarService: CalendarService) { }

    /**
     * Sincronización diaria matutina de eventos económicos y resultados corporativos.
     * Se ejecuta todos los días a las 06:00 AM hora de Nueva York.
     */
    @Cron('0 6 * * *', {
        timeZone: 'America/New_York',
    })
    async handleMorningSync() {
        this.logger.log('[CalendarScheduler] Iniciando sincronización matutina del Calendario...');
        try {
            await this.calendarService.syncWeeklyData();
            this.logger.log('[CalendarScheduler] Sincronización matutina finalizada exitosamente.');
        } catch (error: any) {
            this.logger.error(`[CalendarScheduler] Error en sincronización matutina: ${error.message}`);
        }
    }

    /**
     * Sincronización semanal automática todos los domingos por la tarde.
     * Prepara todo el calendario completo para la semana entrante (Lunes a Viernes).
     * Se ejecuta todos los domingos a las 18:00 hora de Nueva York (19:00 hora de Argentina).
     */
    @Cron('0 18 * * 0', {
        timeZone: 'America/New_York',
    })
    async handleSundayWeeklySync() {
        this.logger.log('[CalendarScheduler] Domingo a la tarde: Sincronizando y preparando todo el calendario semanal completo...');
        try {
            await this.calendarService.syncWeeklyData();
            this.logger.log('[CalendarScheduler] Sincronización dominical completada exitosamente.');
        } catch (error: any) {
            this.logger.error(`[CalendarScheduler] Error en sincronización dominical: ${error.message}`);
        }
    }

    /**
     * Sincronización vespertina tras el cierre del mercado para actualizar sorpresas de resultados y datos macro.
     * Se ejecuta de lunes a viernes a las 17:30 ET.
     */
    /**
     * Sincronización periódica de eventos Macro y de Mercado (cada 2 horas en días hábiles).
     */
    @Cron('0 */2 * * 1-5', {
        timeZone: 'America/New_York',
    })
    async handlePeriodicMacroSync() {
        this.logger.log('[CalendarScheduler] Iniciando sincronización periódica de datos Macro...');
        try {
            await this.calendarService.syncMacroData();
        } catch (error: any) {
            this.logger.error(`[CalendarScheduler] Error en sincronización periódica Macro: ${error.message}`);
        }
    }

    /**
     * Sincronización periódica de balances S&P 500 (cada 6 horas).
     */
    @Cron('0 */6 * * *', {
        timeZone: 'America/New_York',
    })
    async handlePeriodicEarningsSync() {
        this.logger.log('[CalendarScheduler] Iniciando sincronización periódica de Balances S&P 500...');
        try {
            await this.calendarService.syncTradingViewEarnings();
        } catch (error: any) {
            this.logger.error(`[CalendarScheduler] Error en sincronización de balances: ${error.message}`);
        }
    }

    /**
     * Sincronización periódica de dividendos S&P 500 (cada 6 horas).
     */
    @Cron('30 */6 * * *', {
        timeZone: 'America/New_York',
    })
    async handlePeriodicDividendsSync() {
        this.logger.log('[CalendarScheduler] Iniciando sincronización periódica de Dividendos S&P 500...');
        try {
            await this.calendarService.syncTradingViewDividends();
        } catch (error: any) {
            this.logger.error(`[CalendarScheduler] Error en sincronización de dividendos: ${error.message}`);
        }
    }
}

