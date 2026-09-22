import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { PrismaService } from '../prisma.service';
import { MarketModule } from '../market/market.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [MarketModule, MailModule],
    controllers: [AlertsController],
    providers: [AlertsService, PrismaService],
    exports: [AlertsService],
})
export class AlertsModule { }
