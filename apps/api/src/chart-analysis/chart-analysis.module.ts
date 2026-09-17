import { Module } from '@nestjs/common';
import { ChartAnalysisService } from './chart-analysis.service';
import { ChartAnalysisController } from './chart-analysis.controller';
import { PrismaModule } from '../prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ChartAnalysisController],
    providers: [ChartAnalysisService],
    exports: [ChartAnalysisService],
})
export class ChartAnalysisModule {}
