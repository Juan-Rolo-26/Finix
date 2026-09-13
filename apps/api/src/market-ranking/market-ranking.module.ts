import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketRankingService } from './services/market-ranking.service';
import { MarketDataProviderService } from './services/market-data-provider.service';
import { AssetLogoService } from './services/asset-logo.service';
import { MarketRankingScheduler } from './market-ranking.scheduler';
import { MarketRankingController } from './market-ranking.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
    imports: [
        ScheduleModule,
        AdminModule,
    ],
    controllers: [MarketRankingController],
    providers: [
        MarketRankingService,
        MarketDataProviderService,
        AssetLogoService,
        MarketRankingScheduler,
    ],
    exports: [
        MarketRankingService,
        AssetLogoService,
    ],
})
export class MarketRankingModule { }
