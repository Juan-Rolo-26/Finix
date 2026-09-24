import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioPerformanceService } from './portfolio-performance.service';
import { MarketModule } from '../market/market.module';
import { AccessModule } from '../access/access.module';

@Module({
    imports: [MarketModule, AccessModule],
    controllers: [PortfolioController],
    providers: [PortfolioService, PortfolioPerformanceService],
    exports: [PortfolioService, PortfolioPerformanceService],
})
export class PortfolioModule { }
