import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from '../admin/admin.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarProviderService } from './services/calendar-provider.service';
import { MarketImpactScoringService } from './services/market-impact-scoring.service';
import { EarningsImpactScoringService } from './services/earnings-impact-scoring.service';
import { CalendarScheduler } from './calendar.scheduler';
import { MarketDataProviderService } from '../market-ranking/services/market-data-provider.service';

@Module({
    imports: [
        ScheduleModule,
        AdminModule,
    ],
    controllers: [CalendarController],
    providers: [
        MarketDataProviderService,
        CalendarService,
        CalendarProviderService,
        MarketImpactScoringService,
        EarningsImpactScoringService,
        CalendarScheduler,
    ],
    exports: [
        CalendarService,
        MarketImpactScoringService,
        EarningsImpactScoringService,
    ],
})
export class CalendarModule { }
