import { Controller, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { MarketService } from './market.service';
import { PrismaService } from '../prisma.service';

@Controller('market')
export class MarketController {
    constructor(
        private marketService: MarketService,
        private prisma: PrismaService
    ) {
        console.log('MarketController initialized');
    }

    @Get('analysis/daily')
    async getDailyAnalysis() {
        // Obtenemos el análisis activo más reciente
        const analysis = await this.prisma.assetAnalysis.findFirst({
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' }
        });

        if (!analysis) {
            throw new NotFoundException('No active analysis found');
        }

        return analysis;
    }

    @Get('tickers')
    async getTickers() {
        return await this.marketService.getTickers();
    }

    @Get('dashboard')
    getDashboard() {
        return this.marketService.getDashboard();
    }

    @Get('search')
    search(@Query() q: any) {
        const query = q.query || q.q || q.text || q.search || '';
        return this.marketService.searchSymbols(query);
    }

    @Get('quote')
    quote(@Query() q: any) {
        const symbol = q.symbol || '';
        return this.marketService.getQuote(symbol);
    }

    @Get('finviz/heatmap')
    getFinvizHeatmap(@Query() q: any) {
        const subtype = q.st || q.subtype || 'd1';
        return this.marketService.getFinvizHeatmap(subtype);
    }

    @Get('heatmap/sp500')
    getSP500TechnicalHeatmap() {
        return this.marketService.getSP500TechnicalHeatmap();
    }

    @Get('dolar/mep')
    getDolarMep() {
        return this.marketService.getDolarMep();
    }

    @Get('dolar/ccl')
    getDolarCcl() {
        return this.marketService.getDolarCcl();
    }

    @Get('dolar/rates')
    getDolarRates() {
        return this.marketService.getDollarRates();
    }

    @Get('cedears')
    getCedears() {
        return this.marketService.getAllCedearsValuation();
    }

    @Get('cedears/:symbol')
    async getCedearDetail(@Param('symbol') symbol: string) {
        const val = await this.marketService.getCedearValuation(symbol);
        if (!val) {
            throw new NotFoundException(`CEDEAR '${symbol}' no encontrado en el registro oficial`);
        }
        return val;
    }

    @Get('news')
    getNews(@Query() q: any) {
        const symbol = q.symbol || q.s || '';
        return this.marketService.getNews(symbol);
    }

    @Get('candles')
    getCandles(@Query() q: any) {
        const symbol = q.symbol || q.s || 'AAPL';
        const interval = q.interval || q.i || '1d';
        const range = q.range || q.r || '1y';
        return this.marketService.getCandles(symbol, interval, range);
    }
}
