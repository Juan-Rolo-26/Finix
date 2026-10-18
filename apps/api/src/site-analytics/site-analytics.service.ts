import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAGES = new Set(['/','/dashboard','/explore','/news','/calendar','/educativa','/portfolio','/messages','/settings','/laboratorio','/pricing','/communities','/markets','/profile','/community','/login','/signup','/info','/about','/help','/analysis','/finanzas','/notifications','/creator','/payment-result','/privacy','/terms','/cookies','/legal','/auth','/verify-email','/reset-password','/posts']);

@Injectable()
export class SiteAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async pruneOldData() {
    const cutoff = new Date(Date.now() - 395 * 86400000);
    await this.prisma.siteAnalyticsVisitor.deleteMany({ where: { lastSeenAt: { lt: cutoff } } });
  }

  async page(input: any) {
    const { visitorId, sessionId, page } = input || {};
    if (!UUID.test(visitorId || '') || !UUID.test(sessionId || '') || !PAGES.has(page)) {
      throw new BadRequestException('Datos de analítica inválidos');
    }
    const existing = await this.prisma.siteAnalyticsSession.findUnique({ where: { id: sessionId }, select: { visitorId: true } });
    if (existing && existing.visitorId !== visitorId) throw new BadRequestException('Sesión inválida');
    const now = new Date();
    await this.prisma.siteAnalyticsVisitor.upsert({
      where: { id: visitorId }, create: { id: visitorId, firstSeenAt: now, lastSeenAt: now }, update: { lastSeenAt: now },
    });
    await this.prisma.siteAnalyticsSession.upsert({
      where: { id: sessionId }, create: { id: sessionId, visitorId, startedAt: now, lastSeenAt: now }, update: { lastSeenAt: now },
    });
    const view = await this.prisma.siteAnalyticsPageView.create({ data: { id: randomUUID(), sessionId, page, startedAt: now } });
    return { pageViewId: view.id };
  }

  async heartbeat(input: any) {
    const { visitorId, sessionId, pageViewId, seconds } = input || {};
    if (!UUID.test(visitorId || '') || !UUID.test(sessionId || '') || !UUID.test(pageViewId || '') || !Number.isInteger(seconds) || seconds < 1 || seconds > 30) {
      throw new BadRequestException('Datos de analítica inválidos');
    }
    const existingSession = await this.prisma.siteAnalyticsSession.findUnique({ where: { id: sessionId }, select: { visitorId: true } });
    if (!existingSession || existingSession.visitorId !== visitorId) return { accepted: false };
    const now = new Date();
    const updated = await this.prisma.siteAnalyticsPageView.updateMany({
      where: { id: pageViewId, sessionId }, data: { visibleSeconds: { increment: seconds } },
    });
    if (!updated.count) return { accepted: false };
    await this.prisma.siteAnalyticsSession.updateMany({ where: { id: sessionId, visitorId }, data: { activeSeconds: { increment: seconds }, lastSeenAt: now } });
    await this.prisma.siteAnalyticsVisitor.updateMany({ where: { id: visitorId }, data: { lastSeenAt: now } });
    return { accepted: true };
  }

  async dashboard(days: number) {
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    from.setUTCDate(from.getUTCDate() - (days - 1));
    const [visitors, sessions, pageViews, returningVisitors, average, median, engagement, visibleTime, topPages, daily] = await Promise.all([
      this.prisma.siteAnalyticsVisitor.count({ where: { lastSeenAt: { gte: from } } }),
      this.prisma.siteAnalyticsSession.count({ where: { startedAt: { gte: from } } }),
      this.prisma.siteAnalyticsPageView.count({ where: { startedAt: { gte: from } } }),
      this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        'SELECT COUNT(*)::bigint AS count FROM (SELECT "visitorId" FROM "SiteAnalyticsSession" WHERE "startedAt" >= $1 GROUP BY "visitorId" HAVING COUNT(*) > 1 UNION SELECT "id" FROM "SiteAnalyticsVisitor" WHERE "firstSeenAt" < $1 AND "lastSeenAt" >= $1) repeated',
        from,
      ),
      this.prisma.siteAnalyticsSession.aggregate({ where: { startedAt: { gte: from } }, _avg: { activeSeconds: true } }),
      this.prisma.$queryRawUnsafe<Array<{ median: number | null }>>(
        'SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY "activeSeconds") AS median FROM "SiteAnalyticsSession" WHERE "startedAt" >= $1',
        from,
      ),
      this.prisma.$queryRawUnsafe<Array<{ engaged: bigint; bounce: bigint }>>(
        'SELECT COUNT(*) FILTER (WHERE COALESCE(pv.views, 0) >= 2 OR s."activeSeconds" >= 10)::bigint AS engaged, COUNT(*) FILTER (WHERE COALESCE(pv.views, 0) = 1 AND s."activeSeconds" < 10)::bigint AS bounce FROM "SiteAnalyticsSession" s LEFT JOIN (SELECT "sessionId", COUNT(*)::int AS views FROM "SiteAnalyticsPageView" WHERE "startedAt" >= $1 GROUP BY "sessionId") pv ON pv."sessionId" = s.id WHERE s."startedAt" >= $1',
        from,
      ),
      this.prisma.siteAnalyticsPageView.aggregate({ where: { startedAt: { gte: from } }, _sum: { visibleSeconds: true } }),
      this.prisma.siteAnalyticsPageView.groupBy({
        by: ['page'], where: { startedAt: { gte: from } }, _count: { _all: true }, _sum: { visibleSeconds: true },
        orderBy: { _count: { page: 'desc' } }, take: 8,
      }),
      this.prisma.$queryRawUnsafe<Array<{ day: Date; visitors: bigint; sessions: bigint; pageViews: bigint }>>(
        `WITH session_days AS (SELECT date_trunc('day', "startedAt") AS day, "visitorId" FROM "SiteAnalyticsSession" WHERE "startedAt" >= $1), page_days AS (SELECT date_trunc('day', "startedAt") AS day, COUNT(*)::bigint AS page_views FROM "SiteAnalyticsPageView" WHERE "startedAt" >= $1 GROUP BY 1) SELECT sd.day, COUNT(DISTINCT sd."visitorId")::bigint AS visitors, COUNT(*)::bigint AS sessions, COALESCE(pd.page_views, 0)::bigint AS "pageViews" FROM session_days sd LEFT JOIN page_days pd ON pd.day = sd.day GROUP BY sd.day, pd.page_views ORDER BY sd.day ASC`,
        from,
      ),
    ]);
    const byDay = new Map(daily.map(row => [new Date(row.day).toISOString().slice(0, 10), row]));
    const start = new Date(from);
    start.setUTCHours(0, 0, 0, 0);
    const series = Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      const row = byDay.get(key);
      return { date: key, visitors: Number(row?.visitors || 0), sessions: Number(row?.sessions || 0), pageViews: Number(row?.pageViews || 0) };
    });
    return {
      days, visitors, returningVisitors: Number(returningVisitors[0]?.count || 0), newVisitors: Math.max(0, visitors - Number(returningVisitors[0]?.count || 0)), sessions, pageViews,
      averageSessionSeconds: Math.round(average._avg.activeSeconds || 0),
      medianSessionSeconds: Math.round(Number(median[0]?.median || 0)),
      engagedSessions: Number(engagement[0]?.engaged || 0),
      engagementRate: sessions ? Math.round(Number(engagement[0]?.engaged || 0) / sessions * 100) : 0,
      bounceSessions: Number(engagement[0]?.bounce || 0),
      bounceRate: sessions ? Math.round(Number(engagement[0]?.bounce || 0) / sessions * 100) : 0,
      averageVisibleSecondsPerPage: pageViews ? Math.round((visibleTime._sum.visibleSeconds || 0) / pageViews) : 0,
      pagesPerSession: sessions ? Number((pageViews / sessions).toFixed(1)) : 0,
      topPages: topPages.map(row => ({ page: row.page, views: row._count._all, visibleSeconds: row._sum.visibleSeconds || 0 })),
      series,
    };
  }
}
