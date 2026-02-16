import {
    Controller,
    Get,
    Post,
    Put,
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

@UseGuards(JwtAuthGuard)
@Controller('portfolios')
export class PortfolioController {
    constructor(private portfolioService: PortfolioService) { }

    private resolveUserId(req: any) {
        return req.user.id;
    }

    // ==================== PORTFOLIOS ====================

    @Post()
    async createPortfolio(@Request() req, @Body() dto: CreatePortfolioDto) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.createPortfolio(userId, dto);
    }

    @Get()
    async getUserPortfolios(@Request() req) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getUserPortfolios(userId);
    }

    @Get(':id')
    async getPortfolioById(@Request() req, @Param('id') id: string) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getPortfolioById(id, userId);
    }

    @Get(':id/metrics')
    async getPortfolioMetrics(@Request() req, @Param('id') id: string) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getPortfolioMetrics(id, userId);
    }

    @Put(':id')
    async updatePortfolio(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: UpdatePortfolioDto,
    ) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.updatePortfolio(id, userId, dto);
    }

    @Delete(':id')
    async deletePortfolio(@Request() req, @Param('id') id: string) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.deletePortfolio(id, userId);
    }

    // ==================== ASSETS ====================

    @Post(':id/assets')
    async addAsset(
        @Request() req,
        @Param('id') portfolioId: string,
        @Body() dto: CreateAssetDto,
    ) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.addAsset(portfolioId, userId, dto);
    }

    @Get(':id/assets')
    async getPortfolioAssets(@Request() req, @Param('id') portfolioId: string) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.getPortfolioAssets(portfolioId, userId);
    }

    @Put('assets/:assetId')
    async updateAsset(
        @Request() req,
        @Param('assetId') assetId: string,
        @Body() dto: UpdateAssetDto,
    ) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.updateAsset(assetId, userId, dto);
    }

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

    @Post(':id/transactions')
    async createTransaction(
        @Request() req,
        @Param('id') portfolioId: string,
        @Body() dto: CreateTransactionDto,
    ) {
        const userId = this.resolveUserId(req);
        return this.portfolioService.createTransaction(portfolioId, userId, dto);
    }

    // ==================== ASSETS (Legacy) ====================
    // ... existing asset methods ...
}
