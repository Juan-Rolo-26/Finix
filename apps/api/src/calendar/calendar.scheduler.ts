import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CalendarService } from './calendar.service';

@Injectable()
export class CalendarScheduler {
    private readonly logger = new Logger(CalendarScheduler.name);

    constructor(private readonly calendarService: CalendarService) { }

    /**
     * Sincronización diaria matutina de eventos económicos y resultados corporativos.
     * Se ejecuta de lunes a viernes a las 06:00 AM hora de Nueva York.
     */
    @Cron('0 6 * * 1-5', {
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
     * Sincronización semanal automática todos los domingos.
     * Prepara todo el calendario completo para la semana entrante (Lunes a Domingo).
     * Se ejecuta todos los domingos a las 12:00 PM hora de Nueva York.
     */
    @Cron('0 12 * * 0', {
        timeZone: 'America/New_York',
    })
    async handleSundayWeeklySync() {
        this.logger.log('[CalendarScheduler] Domingo: Sincronizando y preparando todo el calendario semanal completo...');
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
     * Sincronización periódica de balances de acciones estadounidenses durante días hábiles.
     */
    @Cron('0 */6 * * 1-5', {
        timeZone: 'America/New_York',
    })
    async handlePeriodicEarningsSync() {
        this.logger.log('[CalendarScheduler] Iniciando sincronización periódica de Balances US...');
        try {
            await this.calendarService.syncTradingViewEarnings();
        } catch (error: any) {
            this.logger.error(`[CalendarScheduler] Error en sincronización de balances: ${error.message}`);
        }
    }

    /**
     * Sincronización periódica de dividendos del S&P 500 durante días hábiles.
     */
    @Cron('30 */6 * * 1-5', {
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

    /**
     * Sincronización diaria de Lunes a Viernes a las 11:00 AM (Hora Argentina / Local).
     * Actualiza automáticamente los balances que ya reportaron: EPS real vs estimado,
     * ingresos reales vs estimados, sorpresas y la reacción del mercado en la cotización.
     */
    @Cron('0 11 * * 1-5', {
        timeZone: 'America/Argentina/Buenos_Aires',
    })
    async handleWeekday11AmReportedEarningsSync() {
        this.logger.log('[CalendarScheduler] 11:00 AM Lunes a Viernes: Sincronizando balances reportados, sorpresas y reacción del mercado...');
        try {
            await this.calendarService.syncReportedEarningsResults();
            this.logger.log('[CalendarScheduler] Sincronización de balances 11:00 AM finalizada con éxito.');
        } catch (error: any) {
            this.logger.error(`[CalendarScheduler] Error en sincronización de balances 11:00 AM: ${error.message}`);
        }
    }
}
