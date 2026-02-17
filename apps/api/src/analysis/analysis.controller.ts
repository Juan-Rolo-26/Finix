import { Controller, Get, Param, Post, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('analysis')
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) { }

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':ticker')
    async getAnalysis(@Param('ticker') ticker: string) {
        // Normalize ticker
        const normalizedTicker = ticker.toUpperCase();
        return this.analysisService.getAnalysis(normalizedTicker);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':ticker/refresh')
    async refreshAnalysis(@Param('ticker') ticker: string) {
        return this.analysisService.refreshAnalysis(ticker.toUpperCase());
    }
}
