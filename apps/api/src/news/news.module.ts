import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsFetcherService } from './news-fetcher.service';
import { NewsTranslationService } from './news-translation.service';
import { NewsSentimentService } from './news-sentiment.service';
import { NewsSlotsService } from './news-slots.service';
import { NewsSlotsPublicController, NewsSlotsAdminController } from './news-slots.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        AuthModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
        }),
    ],
    controllers: [NewsController, NewsSlotsPublicController, NewsSlotsAdminController],
    providers: [
        NewsService,
        NewsFetcherService,
        NewsTranslationService,
        NewsSentimentService,
        NewsSlotsService,
    ],
    exports: [NewsService, NewsSlotsService],
})
export class NewsModule { }
