import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('analysis')
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) { }

    @UseGuards(OptionalJwtAuthGuard)
    @Get()
    async getPublicList(@Req() req: any) {
        return this.analysisService.getPublicList(req.user);
    }

    @Get('tradingview/fetch')
    async fetchTradingView(@Query('symbol') symbol: string) {
        return this.analysisService.fetchTradingViewAssetData(symbol);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':slugOrTicker')
    async getAnalysis(@Param('slugOrTicker') slugOrTicker: string, @Req() req: any) {
        return this.analysisService.getAnalysisBySlugOrTicker(slugOrTicker, req.user);
    }

    @Post('sample/seed')
    async seedSample() {
        return this.analysisService.seedAppleSample('system');
    }
}

