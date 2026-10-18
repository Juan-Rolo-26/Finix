import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SiteAnalyticsController } from './site-analytics.controller';
import { SiteAnalyticsService } from './site-analytics.service';

@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET })], controllers: [SiteAnalyticsController], providers: [SiteAnalyticsService] })
export class SiteAnalyticsModule {}
