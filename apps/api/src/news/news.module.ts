import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsFetcherService } from './news-fetcher.service';
import { NewsTranslationService } from './news-translation.service';
import { NewsSentimentService } from './news-sentiment.service';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [NewsController],
    providers: [
        NewsService,
        NewsFetcherService,
        NewsTranslationService,
        NewsSentimentService,
        PrismaService,
    ],
    exports: [NewsService],
})
export class NewsModule { }
