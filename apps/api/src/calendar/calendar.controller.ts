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

    // --- Endpoints de Administración ---

    @UseGuards(AdminGuard)
    @Get('admin/overview')
    async getAdminOverview() {
        const [economic, earnings, logs] = await Promise.all([
            this.calendarService.getAdminEvents({ page: 1, limit: 10, type: 'ECONOMIC' }),
            this.calendarService.getAdminEvents({ page: 1, limit: 10, type: 'EARNINGS' }),
            this.calendarService.getSyncLogs(),
        ]);
        return {
            totalEconomic: economic.total,
            totalEarnings: earnings.total,
            recentEconomic: economic.items,
            recentEarnings: earnings.items,
            syncLogs: logs,
        };
    }

    @UseGuards(AdminGuard)
    @Get('admin/events')
    async getAdminEvents(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('country') country?: string,
        @Query('type') type?: 'ECONOMIC' | 'EARNINGS',
    ) {
        return this.calendarService.getAdminEvents({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 30,
            country,
            type,
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
    @Post('admin/sync')
    async triggerSync(
        @Body('from') from?: string,
        @Body('to') to?: string,
    ) {
        return this.calendarService.syncWeeklyData(from, to);
    }
}
