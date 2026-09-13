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
     * Sincronización vespertina tras el cierre del mercado para actualizar sorpresas de resultados y datos macro.
     * Se ejecuta de lunes a viernes a las 17:30 ET.
     */
    @Cron('30 17 * * 1-5', {
        timeZone: 'America/New_York',
    })
    async handleMarketCloseSync() {
        this.logger.log('[CalendarScheduler] Cierre de mercado: actualizando sorpresas y resultados del día...');
        try {
            await this.calendarService.syncWeeklyData();
        } catch (error: any) {
            this.logger.error(`[CalendarScheduler] Error en actualización vespertina: ${error.message}`);
        }
    }
}
