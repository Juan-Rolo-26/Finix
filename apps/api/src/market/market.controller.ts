import { Controller, Get, Query } from '@nestjs/common';
import { MarketService } from './market.service';

@Controller('market')
export class MarketController {
    constructor(private marketService: MarketService) {
        console.log('MarketController initialized');
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

    @Get('dolar/mep')
    getDolarMep() {
        return this.marketService.getDolarMep();
    }

    @Get('news')
    getNews(@Query() q: any) {
        const symbol = q.symbol || q.s || '';
        return this.marketService.getNews(symbol);
    }
}
