import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Query,
    Body,
    Param,
    Req,
    UseGuards,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { AdminGuard } from '../admin/admin.guard';

@Controller('calendar')
export class CalendarController {
    constructor(private readonly calendarService: CalendarService) { }

    /**
     * Endpoint liviano para la tarjeta de Inicio (Home Card)
     * Devuelve máximo 3 eventos destacados (1 Earnings + 1 US + 1 AR).
     */
    @Get('home')
    async getHomeCalendar() {
        return this.calendarService.getHomeEvents();
    }

    /**
     * Endpoint para la vista semanal completa en /calendario.
     * Verifica acceso Free / Pro en backend.
     */
    @UseGuards(OptionalJwtAuthGuard)
    @Get('week')
    async getWeekCalendar(
        @Query('weekStart') weekStart?: string,
        @Query('category') category?: 'ALL' | 'US' | 'AR' | 'EARNINGS',
        @Query('importance') importance?: 'HIGH' | 'MEDIUM' | 'LOW',
        @Req() req?: any,
    ) {
        return this.calendarService.getWeekEvents({
            weekStart,
            category,
            importance,
            user: req?.user,
        });
    }

    /**
     * Consulta pública de eventos económicos
     */
    @UseGuards(OptionalJwtAuthGuard)
    @Get('economic')
    async getEconomicEvents(
        @Query('weekStart') weekStart?: string,
        @Req() req?: any,
    ) {
        return this.calendarService.getWeekEvents({
            weekStart,
            category: 'ALL',
            user: req?.user,
        });
    }

    /**
     * Consulta pública de resultados corporativos
     */
    @UseGuards(OptionalJwtAuthGuard)
    @Get('earnings')
    async getEarningsEvents(
        @Query('weekStart') weekStart?: string,
        @Req() req?: any,
    ) {
        return this.calendarService.getWeekEvents({
            weekStart,
            category: 'EARNINGS',
            user: req?.user,
        });
    }

    /**
     * Consulta pública de dividendos de empresas S&P 500
     */
    @UseGuards(OptionalJwtAuthGuard)
    @Get('dividends')
    async getDividendEvents(
        @Query('weekStart') weekStart?: string,
        @Req() req?: any,
    ) {
        return this.calendarService.getWeekEvents({
            weekStart,
            category: 'DIVIDEND' as any,
            user: req?.user,
        });
    }

    /**
     * Consulta pública de eventos de mercado (solo status PUBLISHED o APPROVED)
     */
    @UseGuards(OptionalJwtAuthGuard)
    @Get('events')
    async getPublicEvents(
        @Query('range') range?: 'today' | 'tomorrow' | 'week' | 'next_week' | 'month' | 'all',
        @Query('country') country?: string,
        @Query('category') category?: string,
        @Query('impact') impact?: string,
        @Query('ticker') ticker?: string,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.calendarService.getPublicEvents({
            range,
            country,
            category,
            impact,
            ticker,
            search,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 50,
        });
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get('events/:id')
    async getEventById(@Param('id') id: string) {
        return this.calendarService.getEventById(id);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get('today')
    async getTodayEvents(@Query('country') country?: string) {
        return this.calendarService.getPublicEvents({
            range: 'today',
            country,
            limit: 50,
        });
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get('upcoming')
    async getUpcomingEvents(@Query('country') country?: string) {
        return this.calendarService.getPublicEvents({
            range: 'week',
            country,
            limit: 100,
        });
    }

    @Get('sources')
    async getPublicSources() {
        return this.calendarService.getPublicSources();
    }

    // --- Endpoints de Administración ---

    @UseGuards(AdminGuard)
    @Get('admin/overview')
    async getAdminOverview() {
        return this.calendarService.getAdminOverview();
    }

    @UseGuards(AdminGuard)
    @Get('admin/events')
    async getAdminEvents(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('country') country?: string,
        @Query('type') type?: 'ECONOMIC' | 'EARNINGS',
        @Query('category') category?: string,
        @Query('impact') impact?: string,
        @Query('status') status?: string,
        @Query('source') source?: string,
        @Query('ticker') ticker?: string,
        @Query('date') date?: string,
        @Query('range') range?: 'today' | 'week' | 'month' | 'all',
        @Query('search') search?: string,
    ) {
        return this.calendarService.getAdminEvents({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 50,
            country,
            type,
            category,
            impact,
            status,
            source,
            ticker,
            date,
            range,
            search,
        });
    }

    @UseGuards(AdminGuard)
    @Post('admin/events')
    async createAdminEvent(@Body() dto: any) {
        return this.calendarService.createAdminManualEvent(dto);
    }

    @UseGuards(AdminGuard)
    @Patch('admin/events/:id')
    async updateAdminEvent(@Param('id') id: string, @Body() dto: any) {
        return this.calendarService.updateAdminEvent(id, dto);
    }

    @UseGuards(AdminGuard)
    @Delete('admin/events/:id')
    async deleteAdminEvent(@Param('id') id: string) {
        return this.calendarService.deleteAdminEvent(id);
    }

    @UseGuards(AdminGuard)
    @Get('admin/sources')
    async getAdminSources() {
        return this.calendarService.getAdminSources();
    }

    @UseGuards(AdminGuard)
    @Post('admin/sources')
    async createSource(@Body() dto: any) {
        return this.calendarService.createCalendarSource(dto);
    }

    @UseGuards(AdminGuard)
    @Patch('admin/sources/:id')
    async toggleSourceActive(
        @Param('id') id: string,
        @Body('isActive') isActive: boolean,
    ) {
        return this.calendarService.toggleSourceActive(id, Boolean(isActive));
    }

    @UseGuards(AdminGuard)
    @Get('admin/logs')
    async getAdminLogs() {
        return this.calendarService.getSyncLogs();
    }

    @UseGuards(AdminGuard)
    @Post('admin/sync')
    async triggerSync(
        @Body('from') from?: string,
        @Body('to') to?: string,
        @Body('sourceId') sourceId?: string,
    ) {
        return this.calendarService.syncMacroData(from, to, sourceId);
    }

    @UseGuards(AdminGuard)
    @Post('admin/sync-macro')
    async triggerSyncMacro(
        @Body('from') from?: string,
        @Body('to') to?: string,
        @Body('sourceId') sourceId?: string,
    ) {
        return this.calendarService.syncMacroData(from, to, sourceId);
    }

    @UseGuards(AdminGuard)
    @Post('admin/sync-all')
    async triggerSyncAll(
        @Body('from') from?: string,
        @Body('to') to?: string,
    ) {
        return this.calendarService.syncWeeklyData(from, to);
    }

    @UseGuards(AdminGuard)
    @Post('admin/sync-source/:sourceId')
    async triggerSyncSource(
        @Param('sourceId') sourceId: string,
    ) {
        return this.calendarService.syncMacroData(undefined, undefined, sourceId);
    }

    @UseGuards(AdminGuard)
    @Post('admin/sync-tradingview-earnings')
    async syncTradingViewEarnings(
        @Body('targetDate') targetDate?: string,
    ) {
        return this.calendarService.syncTradingViewEarnings(targetDate);
    }

    @UseGuards(AdminGuard)
    @Post('admin/sync-reported-earnings')
    async syncReportedEarnings() {
        return this.calendarService.syncReportedEarningsResults();
    }
}
