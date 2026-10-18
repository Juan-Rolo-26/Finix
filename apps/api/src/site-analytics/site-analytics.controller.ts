import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../admin/admin.guard';
import { AdminPermissionsGuard } from '../admin/permissions.guard';
import { RequireAdminPermissions } from '../admin/permissions.decorator';
import { AdminPermission } from '../admin/admin-permissions';
import { SiteAnalyticsService } from './site-analytics.service';

@Controller('site-analytics')
export class SiteAnalyticsController {
  constructor(private readonly analytics: SiteAnalyticsService) {}

  @Post('page')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  recordPage(@Body() body: unknown) { return this.analytics.page(body); }

  @Post('heartbeat')
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  heartbeat(@Body() body: unknown) { return this.analytics.heartbeat(body); }

  @Get('dashboard')
  @UseGuards(AdminGuard, AdminPermissionsGuard)
  @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
  async dashboard(@Query('days') rawDays = '30') {
    const parsed = Number(rawDays);
    const days = [7, 30, 90].includes(parsed) ? parsed : 30;
    return { data: await this.analytics.dashboard(days) };
  }
}
