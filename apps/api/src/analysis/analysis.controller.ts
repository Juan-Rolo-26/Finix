import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('analysis')
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) { }

    @Get()
    async getPublicList() {
        return this.analysisService.getPublicList();
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
