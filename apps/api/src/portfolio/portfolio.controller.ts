import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Request,
    UseGuards,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioPerformanceService } from './portfolio-performance.service';
import { CreatePortfolioDto, UpdatePortfolioDto, CreateAssetDto, UpdateAssetDto, CreateTransactionDto, CreateWatchlistDto, UpdateWatchlistDto } from './dto/portfolio.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LimitFreePortfolioGuard } from '../access/limit-free-portfolio.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('portfolios')
// The portfolio screen loads several authenticated read endpoints together.
// Keep throttling enabled, but allow that normal dashboard burst.
@Throttle({
    short: { limit: 20, ttl: 1000 },
    medium: { limit: 80, ttl: 10000 },
    long: { limit: 300, ttl: 60000 },
})
export class PortfolioController {
    constructor(
        private portfolioService: PortfolioService,
        private performanceService: PortfolioPerformanceService,
    ) { }

    private resolveUserId(req: any) {
        return req.user.id;
    }

    // ==================== WATCHLISTS ====================

    @UseGuards(JwtAuthGuard)
    @Get('watchlists')
    async getWatchlists(@Request() req) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getWatchlists(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('watchlists')
    async createWatchlist(@Request() req, @Body() body: CreateWatchlistDto) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.createWatchlist(userId, body.name, body.tickers || '');
    }

    @UseGuards(JwtAuthGuard)
    @Patch('watchlists/:id')
    async updateWatchlist(
        @Request() req,
        @Param('id') id: string,
        @Body() body: UpdateWatchlistDto,
    ) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.updateWatchlist(id, userId, body);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('watchlists/:id')
    async deleteWatchlist(@Request() req, @Param('id') id: string) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.deleteWatchlist(id, userId);
    }

    // ==================== PORTFOLIOS ====================

    @UseGuards(JwtAuthGuard, LimitFreePortfolioGuard)
    @Post()
    async createPortfolio(@Request() req, @Body() dto: CreatePortfolioDto) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.createPortfolio(userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getUserPortfolios(@Request() req) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getUserPortfolios(userId);
    }

    @Get('public/:userId')
    async getPublicPortfolios(@Param('userId') userId: string) {
        return this.portfolioService.getPublicPortfolios(userId);
    }

    @Get('public/portfolio/:id/metrics')
    async getPublicPortfolioMetrics(@Param('id') id: string) {
        return this.portfolioService.getPublicPortfolioMetrics(id);
    }

    @Get('public/portfolio/:id/movements')
    async getPublicPortfolioMovements(@Param('id') id: string) {
        return this.portfolioService.getPublicPortfolioMovements(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getPortfolioById(@Request() req, @Param('id') id: string) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getPortfolioById(id, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/metrics')
    async getPortfolioMetrics(@Request() req, @Param('id') id: string) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getPortfolioMetrics(id, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/history')
    async getPortfolioHistory(
        @Request() req,
        @Param('id') id: string,
        @Query('range') range?: string,
    ) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getPortfolioHistory(id, userId, range || '1M');
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async updatePortfolio(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: UpdatePortfolioDto,
    ) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.updatePortfolio(id, userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deletePortfolio(@Request() req, @Param('id') id: string) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.deletePortfolio(id, userId);
    }

    // ==================== ASSETS ====================

    @UseGuards(JwtAuthGuard)
    @Post(':id/assets')
    async addAsset(
        @Request() req,
        @Param('id') portfolioId: string,
        @Body() dto: CreateAssetDto,
    ) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.addAsset(portfolioId, userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/assets')
    async getPortfolioAssets(@Request() req, @Param('id') portfolioId: string) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getPortfolioAssets(portfolioId, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Put('assets/:assetId')
    async updateAsset(
        @Request() req,
        @Param('assetId') assetId: string,
        @Body() dto: UpdateAssetDto,
    ) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.updateAsset(assetId, userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('assets/:assetId')
    async deleteAsset(
        @Request() req,
        @Param('assetId') assetId: string,
        @Query('portfolioId') portfolioId?: string,
    ) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.deleteAsset(assetId, userId, portfolioId);
    }

    // ==================== MOVEMENTS ====================

    @UseGuards(JwtAuthGuard)
    @Get(':id/movements')
    async getPortfolioMovements(
        @Request() req,
        @Param('id') portfolioId: string,
        @Query('tipoMovimiento') tipoMovimiento?: string,
        @Query('ticker') ticker?: string,
        @Query('fechaDesde') fechaDesde?: string,
        @Query('fechaHasta') fechaHasta?: string,
    ) {
        const userId = this.resolveUserId(req);
        const filters = {
            tipoMovimiento,
            ticker,
            fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
            fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
        };
        return this.portfolioService.getPortfolioMovements(portfolioId, userId, filters);
    }

    // ==================== TRANSACTIONS ====================

    @UseGuards(JwtAuthGuard)
    @Post(':id/transactions')
    async createTransaction(
        @Request() req,
        @Param('id') portfolioId: string,
        @Body() dto: CreateTransactionDto,
    ) {
        const userId = this.resolveUserId(req);
        try {
            return await this.portfolioService.createTransaction(portfolioId, userId, dto);
        } catch (err: any) {
            if (err instanceof NotFoundException || err instanceof BadRequestException) {
                throw err;
            }
            throw new BadRequestException(err?.message || 'Error al registrar la transacción');
        }
    }

    // ==================== PORTFOLIO ANALYTICS (Charts) ====================

    @UseGuards(JwtAuthGuard)
    @Get(':id/summary')
    async getPortfolioSummary(
        @Request() req,
        @Param('id') id: string,
        @Query('currency') currency?: string,
    ) {
        const userId = this.resolveUserId(req);
        return this.performanceService.getSummary(id, userId, currency || 'USD');
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/performance')
    async getPortfolioPerformance(
        @Request() req,
        @Param('id') id: string,
        @Query('range') range?: string,
        @Query('currency') currency?: string,
    ) {
        const userId = this.resolveUserId(req);
        return this.performanceService.getPerformance(id, userId, range || '1M', currency || 'USD');
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/allocation')
    async getPortfolioAllocation(
        @Request() req,
        @Param('id') id: string,
        @Query('groupBy') groupBy?: string,
        @Query('currency') currency?: string,
    ) {
        const userId = this.resolveUserId(req);
        return this.performanceService.getAllocation(id, userId, groupBy || 'asset', currency || 'USD');
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/asset-pnl')
    async getAssetPnL(
        @Request() req,
        @Param('id') id: string,
        @Query('currency') currency?: string,
    ) {
        const userId = this.resolveUserId(req);
        return this.performanceService.getAssetPnL(id, userId, currency || 'USD');
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/returns')
    async getPortfolioReturns(
        @Request() req,
        @Param('id') id: string,
        @Query('currency') currency?: string,
    ) {
        const userId = this.resolveUserId(req);
        return this.performanceService.getReturns(id, userId, currency || 'USD');
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/drawdown')
    async getPortfolioDrawdown(
        @Request() req,
        @Param('id') id: string,
        @Query('range') range?: string,
        @Query('currency') currency?: string,
    ) {
        const userId = this.resolveUserId(req);
        return this.performanceService.getDrawdown(id, userId, range || 'ALL', currency || 'USD');
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/dividends')
    async getPortfolioDividends(
        @Request() req,
        @Param('id') id: string,
        @Query('range') range?: string,
        @Query('currency') currency?: string,
    ) {
        const userId = this.resolveUserId(req);
        return this.performanceService.getDividends(id, userId, range || 'ALL', currency || 'USD');
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/risk')
    async getPortfolioRisk(
        @Request() req,
        @Param('id') id: string,
        @Query('currency') currency?: string,
    ) {
        const userId = this.resolveUserId(req);
        return this.performanceService.getRisk(id, userId, currency || 'USD');
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/benchmarks')
    async getPortfolioBenchmarks(
        @Request() req,
        @Param('id') id: string,
        @Query('range') range?: string,
        @Query('benchmarks') benchmarks?: string,
        @Query('currency') currency?: string,
    ) {
        const userId = this.resolveUserId(req);
        const benchmarkList = benchmarks ? benchmarks.split(',').map((b) => b.trim()) : ['sp500'];
        return this.performanceService.getBenchmarks(id, userId, range || '1Y', benchmarkList, currency || 'USD');
    }
}
