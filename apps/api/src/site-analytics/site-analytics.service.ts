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

  async page(input: any, userId?: string) {
    const { visitorId, sessionId, page } = input || {};
    if (!UUID.test(visitorId || '') || !UUID.test(sessionId || '') || !PAGES.has(page)) {
      throw new BadRequestException('Datos de analítica inválidos');
    }
    const user = userId ? await this.prisma.user.findUnique({where:{id:userId},select:{id:true,email:true}}) : null;
    if (user && excludedAnalyticsEmail(user.email)) return {ignored:true,pageViewId:null};
    const accountId=user?.id || null;
    const existing = await this.prisma.siteAnalyticsSession.findUnique({ where: { id: sessionId }, select: { visitorId: true, userId:true } });
    if (existing && (existing.visitorId !== visitorId || existing.userId !== accountId)) throw new BadRequestException('Sesión inválida');
    const now = new Date();
    await this.prisma.siteAnalyticsVisitor.upsert({
      where: { id: visitorId }, create: { id: visitorId, firstSeenAt: now, lastSeenAt: now }, update: { lastSeenAt: now },
    });
    await this.prisma.siteAnalyticsSession.upsert({
      where: { id: sessionId }, create: { id: sessionId, visitorId, userId:accountId, startedAt: now, lastSeenAt: now }, update: { lastSeenAt: now },
    });
    const view = await this.prisma.siteAnalyticsPageView.create({ data: { id: randomUUID(), sessionId, page, startedAt: now } });
    return { pageViewId: view.id };
  }

  async heartbeat(input: any, userId?: string) {
    const { visitorId, sessionId, pageViewId, seconds } = input || {};
    if (!UUID.test(visitorId || '') || !UUID.test(sessionId || '') || !UUID.test(pageViewId || '') || !Number.isInteger(seconds) || seconds < 1 || seconds > 30) {
      throw new BadRequestException('Datos de analítica inválidos');
    }
    const existingSession = await this.prisma.siteAnalyticsSession.findUnique({ where: { id: sessionId }, select: { visitorId: true,userId:true } });
    if (!existingSession || existingSession.visitorId !== visitorId || existingSession.userId !== (userId || null)) return { accepted: false };
    const now = new Date();
    const updated = await this.prisma.siteAnalyticsPageView.updateMany({
      where: { id: pageViewId, sessionId }, data: { visibleSeconds: { increment: seconds } },
    });
    if (!updated.count) return { accepted: false };
    await this.prisma.siteAnalyticsSession.updateMany({ where: { id: sessionId, visitorId }, data: { activeSeconds: { increment: seconds }, lastSeenAt: now } });
    await this.prisma.siteAnalyticsVisitor.updateMany({ where: { id: visitorId }, data: { lastSeenAt: now } });
    return { accepted: true };
  }

  async visitors(days: number, page = 1) {
    const from=analyticsPeriodStart(days),take=30;
    const where={sessions:{some:{startedAt:{gte:from}}}};
    const [total,rows]=await Promise.all([
      this.prisma.siteAnalyticsVisitor.count({where}),
      this.prisma.siteAnalyticsVisitor.findMany({where,orderBy:[{lastSeenAt:'desc'},{id:'asc'}],skip:(page-1)*take,take,select:{id:true,firstSeenAt:true,lastSeenAt:true,sessions:{where:{startedAt:{gte:from}},select:{startedAt:true,lastSeenAt:true,activeSeconds:true,user:{select:{email:true}},_count:{select:{pageViews:true}}}}}}),
    ]);
    return {total,page,pageSize:take,items:rows.map(row=>({id:row.id,firstSeenAt:row.firstSeenAt,lastSeenAt:row.lastSeenAt,emails:[...new Set(row.sessions.flatMap(session=>session.user?.email?[session.user.email]:[]))],sessions:row.sessions.length,pageViews:row.sessions.reduce((n,session)=>n+session._count.pageViews,0),visibleSeconds:row.sessions.reduce((n,session)=>n+session.activeSeconds,0)}))};
  }

  async dashboard(days: number) {
    const from = analyticsPeriodStart(days);
    const [visitors, returningVisitors, sessionsSummary, pageSummary, topPages, daily] = await Promise.all([
      this.prisma.siteAnalyticsVisitor.count({ where: { sessions: {some:{startedAt:{gte:from}}} } }),
      this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        'SELECT COUNT(*)::bigint AS count FROM (SELECT "visitorId" FROM "SiteAnalyticsSession" WHERE "startedAt" >= $1 GROUP BY "visitorId" HAVING COUNT(*) > 1 UNION SELECT "id" FROM "SiteAnalyticsVisitor" WHERE "firstSeenAt" < $1 AND "lastSeenAt" >= $1) repeated',
        from,
      ),
      this.prisma.$queryRawUnsafe<Array<{ sessions: bigint; average: number | null; median: number | null; engaged: bigint; bounce: bigint }>>(
        'WITH page_counts AS (SELECT "sessionId", COUNT(*)::int AS views FROM "SiteAnalyticsPageView" WHERE "startedAt" >= $1 GROUP BY "sessionId"), session_rows AS (SELECT s."activeSeconds", COALESCE(pv.views, 0) AS views FROM "SiteAnalyticsSession" s LEFT JOIN page_counts pv ON pv."sessionId" = s.id WHERE s."startedAt" >= $1) SELECT COUNT(*)::bigint AS sessions, AVG("activeSeconds") AS average, percentile_cont(0.5) WITHIN GROUP (ORDER BY "activeSeconds") AS median, COUNT(*) FILTER (WHERE views >= 2 OR "activeSeconds" >= 10)::bigint AS engaged, COUNT(*) FILTER (WHERE views = 1 AND "activeSeconds" < 10)::bigint AS bounce FROM session_rows',
        from,
      ),
      this.prisma.siteAnalyticsPageView.aggregate({
        where: { startedAt: { gte: from } },
        _count: { _all: true },
        _sum: { visibleSeconds: true },
      }),
      this.prisma.siteAnalyticsPageView.groupBy({
        by: ['page'], where: { startedAt: { gte: from } }, _count: { _all: true }, _sum: { visibleSeconds: true },
        orderBy: { _count: { page: 'desc' } }, take: 8,
      }),
      this.prisma.$queryRawUnsafe<Array<{ day: Date; visitors: bigint; sessions: bigint; pageViews: bigint }>>(
        `WITH session_days AS (SELECT date_trunc('day', "startedAt") AS day, "visitorId" FROM "SiteAnalyticsSession" WHERE "startedAt" >= $1), page_days AS (SELECT date_trunc('day', "startedAt") AS day, COUNT(*)::bigint AS page_views FROM "SiteAnalyticsPageView" WHERE "startedAt" >= $1 GROUP BY 1) SELECT sd.day, COUNT(DISTINCT sd."visitorId")::bigint AS visitors, COUNT(*)::bigint AS sessions, COALESCE(pd.page_views, 0)::bigint AS "pageViews" FROM session_days sd LEFT JOIN page_days pd ON pd.day = sd.day GROUP BY sd.day, pd.page_views ORDER BY sd.day ASC`,
        from,
      ),
    ]);
    const sessions = Number(sessionsSummary[0]?.sessions || 0);
    const engagedSessions = Number(sessionsSummary[0]?.engaged || 0);
    const bounceSessions = Number(sessionsSummary[0]?.bounce || 0);
    const pageViews = pageSummary._count._all;
    const visibleSeconds = pageSummary._sum.visibleSeconds || 0;
    const repeated = Number(returningVisitors[0]?.count || 0);
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
      days, visitors, returningVisitors: repeated, newVisitors: Math.max(0, visitors - repeated), sessions, pageViews,
      averageSessionSeconds: Math.round(Number(sessionsSummary[0]?.average || 0)),
      medianSessionSeconds: Math.round(Number(sessionsSummary[0]?.median || 0)),
      engagedSessions,
      engagementRate: sessions ? Math.round(engagedSessions / sessions * 100) : 0,
      bounceSessions,
      bounceRate: sessions ? Math.round(bounceSessions / sessions * 100) : 0,
      averageVisibleSecondsPerPage: pageViews ? Math.round(visibleSeconds / pageViews) : 0,
      pagesPerSession: sessions ? Number((pageViews / sessions).toFixed(1)) : 0,
      topPages: topPages.map(row => ({ page: row.page, views: row._count._all, visibleSeconds: row._sum.visibleSeconds || 0 })),
      series,
    };
  }
}

export function excludedAnalyticsEmail(email: string) {
  const normalized=String(email||'').trim().toLowerCase();
  return ['juanpablorolo2007@gmail.com','finixarg@gmail.com','finixarg.com'].includes(normalized)||normalized.endsWith('@finixarg.com');
}
function analyticsPeriodStart(days:number){const from=new Date();from.setUTCHours(0,0,0,0);from.setUTCDate(from.getUTCDate()-(days-1));return from;}
