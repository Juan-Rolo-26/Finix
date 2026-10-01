import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { PrismaModule } from '../prisma.module';
import { FinanceController } from './workspace.controller';
import { FinanceService } from './workspace.service';

@Module({
    imports: [PrismaModule, AccessModule, NotificationsModule, PortfolioModule],
    controllers: [FinanceController],
    providers: [FinanceService],
})
export class FinanceModule {}
