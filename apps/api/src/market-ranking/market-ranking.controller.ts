import { Controller, Get, Post, Query, Body, UseGuards, Req } from '@nestjs/common';
import { MarketRankingService } from './services/market-ranking.service';
import { AdminGuard } from '../admin/admin.guard';
import { AdminPermissionsGuard } from '../admin/permissions.guard';
import { RequireAdminPermissions } from '../admin/permissions.decorator';
import { AdminPermission } from '../admin/admin-permissions';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('market/rankings')
export class MarketRankingController {
    constructor(private readonly rankingService: MarketRankingService) { }

    /**
     * Endpoint público principal:
     * Devuelve el TOP 5 de mejores rendimientos del S&P 500 para la tarjeta.
     */
    @Get('top-gainers')
    async getTopGainers(
        @Query('date') date?: string,
        @Query('refresh') refresh?: string,
    ) {
        return await this.rankingService.getTopGainers(date, refresh === 'true' || refresh === '1');
    }

    /**
     * Endpoint público principal:
     * Devuelve el TOP 5 de peores rendimientos del S&P 500 para la tarjeta.
     */
    @Get('top-losers')
    async getTopLosers(
        @Query('date') date?: string,
        @Query('refresh') refresh?: string,
    ) {
        return await this.rankingService.getTopLosers(date, refresh === 'true' || refresh === '1');
    }

    /**
     * Endpoint para consulta extendida / página "Ver todos"
     * TOP 5 es libre para todos los usuarios.
     * Rangos > 5 (TOP 10, 25, 50) requieren membresía PRO.
     */
    @Get()
    @UseGuards(OptionalJwtAuthGuard)
    async getRankings(
        @Query('type') type?: string,
        @Query('date') date?: string,
        @Query('limit') limit?: string,
        @Query('refresh') refresh?: string,
        @Req() req?: any,
    ) {
        return await this.rankingService.getRankingsList({
            type,
            date,
            limit: limit ? parseInt(limit, 10) : 50,
            user: req?.user,
            refresh: refresh === 'true' || refresh === '1',
        });
    }

    /**
     * Endpoints de administración: consultar estado y logs
     */
    @Get('admin/overview')
    @UseGuards(AdminGuard, AdminPermissionsGuard)
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async getAdminOverview() {
        return await this.rankingService.getAdminOverview();
    }

    /**
     * Endpoint de administración: trigger manual de cálculo de ranking
     */
    @Post('admin/trigger')
    @UseGuards(AdminGuard, AdminPermissionsGuard)
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async triggerManualRanking(@Body() body: { date?: string; rankingType?: string }) {
        return await this.rankingService.executeDailyRanking(body?.date, body?.rankingType);
    }

    /**
     * Endpoint de administración: sincronización manual de constituyentes S&P 500
     */
    @Post('admin/sync-universe')
    @UseGuards(AdminGuard, AdminPermissionsGuard)
    @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
    async triggerSyncUniverse() {
        const count = await this.rankingService.syncSP500Universe();
        return { success: true, count };
    }
}
