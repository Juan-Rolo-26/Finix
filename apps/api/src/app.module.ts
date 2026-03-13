import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
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

@Module({
    imports: [
        ScheduleModule.forRoot(),
        PrismaModule,
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
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
