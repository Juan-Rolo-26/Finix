import { Module } from '@nestjs/common';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { PrismaService } from '../prisma.service';
import { MarketModule } from '../market/market.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
    imports: [MarketModule, AlertsModule],
    controllers: [WatchlistController],
    providers: [WatchlistService, PrismaService],
    exports: [WatchlistService],
})
export class WatchlistModule { }
