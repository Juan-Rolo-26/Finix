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
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto, UpdatePortfolioDto, CreateAssetDto, UpdateAssetDto, CreateTransactionDto } from './dto/portfolio.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LimitFreePortfolioGuard } from '../access/limit-free-portfolio.guard';

@Controller('portfolios')
export class PortfolioController {
    constructor(private portfolioService: PortfolioService) { }

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
    async createWatchlist(@Request() req, @Body() body: { name: string; tickers: string }) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.createWatchlist(userId, body.name, body.tickers || '');
    }

    @UseGuards(JwtAuthGuard)
    @Patch('watchlists/:id')
    async updateWatchlist(
        @Request() req,
        @Param('id') id: string,
        @Body() body: { name?: string; tickers?: string },
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
        return this.portfolioService.createTransaction(portfolioId, userId, dto);
    }
}
