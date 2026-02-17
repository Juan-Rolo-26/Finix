import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { MarketModule } from './market/market.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { PostsModule } from './posts/posts.module';
import { NewsModule } from './news/news.module';
import { UserModule } from './user/user.module';
import { AnalysisModule } from './analysis/analysis.module';

import { EventsGateway } from './events.gateway';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        AuthModule,
        MarketModule,
        PortfolioModule,
        PostsModule,

        NewsModule,
        UserModule,
        AnalysisModule,
    ],
    controllers: [],
    providers: [PrismaService, EventsGateway],
    exports: [PrismaService],
})
export class AppModule { }
// Force rebuild
