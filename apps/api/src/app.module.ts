import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { MarketModule } from './market/market.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { PostsModule } from './posts/posts.module';
import { NewsModule } from './news/news.module';
import { UserModule } from './user/user.module';
import { AnalysisModule } from './analysis/analysis.module';
import { CommunitiesModule } from './communities/communities.module';
import { StripeModule } from './stripe/stripe.module';
import { BillingModule } from './billing/billing.module';
import { AccessModule } from './access/access.module';
import { CreatorApplicationModule } from './creator-application/creator-application.module';
import { SettingsModule } from './settings/settings.module';
import { FundamentalModule } from './fundamental/fundamental.module';
import { AiModule } from './ai/ai.module';
import { MessagesModule } from './messages/messages.module';
import { EventsGateway } from './events.gateway';
import { AdminModule } from './admin/admin.module';

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
        CommunitiesModule,
        StripeModule,
        BillingModule,
        AccessModule,
        CreatorApplicationModule,
        SettingsModule,
        FundamentalModule,
        AiModule,
        MessagesModule,
        AdminModule,
        MailModule,
    ],
    controllers: [],
    providers: [PrismaService, EventsGateway],
    exports: [PrismaService],
})
export class AppModule { }
