import { Module } from '@nestjs/common';
import { SiteAnalyticsController } from './site-analytics.controller';
import { SiteAnalyticsService } from './site-analytics.service';

@Module({ controllers: [SiteAnalyticsController], providers: [SiteAnalyticsService] })
export class SiteAnalyticsModule {}
