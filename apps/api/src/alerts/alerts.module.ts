import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { MarketModule } from '../market/market.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [MarketModule, MailModule],
    controllers: [AlertsController],
    providers: [AlertsService],
    exports: [AlertsService],
})
export class AlertsModule { }
