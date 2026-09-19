import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { ValueCreationService } from './value-creation.service';
import { OpportunityScreenerService } from './opportunity-screener.service';

@Module({
    imports: [ScheduleModule],
    controllers: [MarketController],
    providers: [MarketService, ValueCreationService, OpportunityScreenerService],
    exports: [MarketService, ValueCreationService, OpportunityScreenerService],
})
export class MarketModule { }
