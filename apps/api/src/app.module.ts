import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
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
import { AdminModule } from './admin/admin.module';
import { StoriesModule } from './stories/stories.module';
import { PrismaModule } from './prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ContactModule } from './contact/contact.module';
import { HubModule } from './hub/hub.module';
import { HealthModule } from './health/health.module';
import { ReportsModule } from './reports/reports.module';

@Module({
    imports: [
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000,
                limit: 3,
            },
            {
                name: 'medium',
                ttl: 10000,
                limit: 20,
            },
            {
                name: 'long',
                ttl: 60000,
                limit: 100,
            }
        ]),
        ScheduleModule.forRoot(),
        PrismaModule,
        HealthModule,
        ContactModule,
        NotificationsModule,
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
        StoriesModule,
        AdminModule,
        MailModule,
        HubModule,
        ReportsModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
