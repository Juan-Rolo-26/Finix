import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { AnalysisRequestsService } from './analysis-requests.service';
import { AnalysisService } from './analysis.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('analysis')
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService, private readonly requests: AnalysisRequestsService) { }

    @UseGuards(OptionalJwtAuthGuard)
    @Get()
    async getPublicList(@Req() req: any) {
        return this.analysisService.getPublicList(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Throttle({ default: { limit: 20, ttl: 60000 } })
    @Post('requests')
    recordRequest(@Req() req: any, @Body() body: unknown) { return this.requests.record(req.user.id, body); }

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

