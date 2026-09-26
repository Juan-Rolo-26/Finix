import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { MarketModule } from '../market/market.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { PrismaModule } from '../prisma.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
    imports: [PrismaModule, AccessModule, MarketModule, PortfolioModule],
    controllers: [FinanceController],
    providers: [FinanceService],
})
export class FinanceModule {}
