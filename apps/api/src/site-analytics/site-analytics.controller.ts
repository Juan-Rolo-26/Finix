import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../admin/admin.guard';
import { AdminPermissionsGuard } from '../admin/permissions.guard';
import { RequireAdminPermissions } from '../admin/permissions.decorator';
import { AdminPermission } from '../admin/admin-permissions';
import { AnalyticsAuthGuard } from './analytics-auth.guard';
import { SiteAnalyticsService } from './site-analytics.service';

@Controller('site-analytics')
export class SiteAnalyticsController {
  constructor(private readonly analytics: SiteAnalyticsService) {}

  @Post('page')
  @UseGuards(AnalyticsAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  recordPage(@Body() body: unknown,@Req() req:any) { return this.analytics.page(body,req.user?.id); }

  @Post('heartbeat')
  @UseGuards(AnalyticsAuthGuard)
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  heartbeat(@Body() body: unknown,@Req() req:any) { return this.analytics.heartbeat(body,req.user?.id); }

  @Get('visitors')
  @UseGuards(AdminGuard, AdminPermissionsGuard)
  @RequireAdminPermissions(AdminPermission.DASHBOARD_READ, AdminPermission.USERS_READ)
  async visitors(@Query('days') rawDays='30',@Query('page') rawPage='1') {
    const days=[7,30,90].includes(Number(rawDays))?Number(rawDays):30;
    const page=Math.min(100000,Math.max(1,Math.floor(Number(rawPage)||1)));
    return {data:await this.analytics.visitors(days,page)};
  }

  @Get('dashboard')
  @UseGuards(AdminGuard, AdminPermissionsGuard)
  @RequireAdminPermissions(AdminPermission.DASHBOARD_READ)
  async dashboard(@Query('days') rawDays = '30') {
    const parsed = Number(rawDays);
    const days = [7, 30, 90].includes(parsed) ? parsed : 30;
    return { data: await this.analytics.dashboard(days) };
  }
}
