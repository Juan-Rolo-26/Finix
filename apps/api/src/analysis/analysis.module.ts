import { FundamentalRefreshService } from './fundamental-refresh.service';
import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisRequestsService } from './analysis-requests.service';
import { AnalysisService } from './analysis.service';

@Module({
    controllers: [AnalysisController],
    providers: [AnalysisService, AnalysisRequestsService, FundamentalRefreshService],
    exports: [AnalysisService, AnalysisRequestsService],
})
export class AnalysisModule { }
