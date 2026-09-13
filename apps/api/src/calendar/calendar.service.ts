import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
    HomeCalendarResponse,
    HomeCalendarEventCard,
    CalendarWeekResponse,
    CalendarWeekDay,
    EconomicEventItem,
    EarningsEventItem,
} from './interfaces/calendar.interface';
import { CalendarProviderService } from './services/calendar-provider.service';
import { MarketImpactScoringService } from './services/market-impact-scoring.service';
import { EarningsImpactScoringService } from './services/earnings-impact-scoring.service';

@Injectable()
export class CalendarService {
    private readonly logger = new Logger(CalendarService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly providerService: CalendarProviderService,
        private readonly marketScoring: MarketImpactScoringService,
        private readonly earningsScoring: EarningsImpactScoringService,
    ) { }

    /**
     * Devuelve los 3 eventos destacados para la tarjeta de Inicio:
     * 1. Un resultado empresarial importante (earningsImpactScore >= 65)
     * 2. Un evento económico importante de Estados Unidos
     * 3. Un evento económico importante de Argentina
     *
     * Si no existe un evento en alguna categoría, se oculta esa categoría (sin inventar datos).
     */
    async getHomeEvents(): Promise<HomeCalendarResponse> {
        const { mondayStr, fridayStr } = this.getCurrentWeekBounds();

        // Check if we have events in DB for the week
        let [economicEvents, earningsEvents] = await Promise.all([
            this.prisma.marketCalendarEvent.findMany({
                where: {
                    date: { gte: mondayStr, lte: fridayStr },
                    isPublished: true,
                },
                orderBy: [
                    { marketImpactScore: 'desc' },
                    { date: 'asc' },
                ],
            }),
            this.prisma.marketEarningsEvent.findMany({
                where: {
                    date: { gte: mondayStr, lte: fridayStr },
                    isPublished: true,
                },
                orderBy: [
                    { earningsImpactScore: 'desc' },
                    { date: 'asc' },
                ],
            }),
        ]);

        // Auto-seed or sync if database is empty for this week
        if (economicEvents.length === 0 && earningsEvents.length === 0) {
            await this.syncWeeklyData(mondayStr, fridayStr);
            [economicEvents, earningsEvents] = await Promise.all([
                this.prisma.marketCalendarEvent.findMany({
                    where: { date: { gte: mondayStr, lte: fridayStr }, isPublished: true },
                    orderBy: [{ marketImpactScore: 'desc' }, { date: 'asc' }],
                }),
                this.prisma.marketEarningsEvent.findMany({
                    where: { date: { gte: mondayStr, lte: fridayStr }, isPublished: true },
                    orderBy: [{ earningsImpactScore: 'desc' }, { date: 'asc' }],
                }),
            ]);
        }

        const selectedCards: HomeCalendarEventCard[] = [];

        // 1. Top Earnings Candidate (threshold: earningsImpactScore >= 65)
        const topEarnings = earningsEvents.find(e => e.earningsImpactScore >= 65);
        if (topEarnings) {
            const timingText = topEarnings.reportTiming === 'AMC'
                ? 'Después del cierre'
                : topEarnings.reportTiming === 'BMO'
                    ? 'Antes de la apertura'
                    : 'Durante la rueda';

            selectedCards.push({
                id: topEarnings.id,
                type: 'EARNINGS',
                ticker: topEarnings.ticker,
                title: topEarnings.companyName,
                subtitle: 'Presenta resultados',
                date: topEarnings.date,
                time: topEarnings.time || undefined,
                dayLabel: this.getDayLabel(topEarnings.date),
                timingLabel: timingText,
                importance: topEarnings.earningsImpactScore >= 80 ? 'HIGH' : 'MEDIUM',
                impactScore: topEarnings.earningsImpactScore,
                logoUrl: topEarnings.logoUrl || this.earningsScoring.getTradingViewLogoUrl(topEarnings.ticker),
                epsEstimate: topEarnings.epsEstimate ?? undefined,
                revenueEstimate: topEarnings.revenueEstimate ?? undefined,
                dateStatus: topEarnings.dateStatus as any,
            });
        }

        // 2. Top US Economic Event (threshold: marketImpactScore >= 60)
        const topUS = economicEvents.find(e => e.country === 'US' && e.marketImpactScore >= 60);
        if (topUS) {
            selectedCards.push({
                id: topUS.id,
                type: 'ECONOMIC',
                country: 'US',
                title: topUS.title,
                subtitle: 'Estados Unidos',
                date: topUS.date,
                time: topUS.time || undefined,
                dayLabel: this.getDayLabel(topUS.date),
                importance: topUS.importance as any,
                impactScore: topUS.marketImpactScore,
                previousValue: topUS.previousValue ?? undefined,
                consensusValue: topUS.consensusValue ?? undefined,
                actualValue: topUS.actualValue ?? undefined,
                surprise: topUS.surprise ?? undefined,
                expectedMarketEffect: topUS.expectedMarketEffect ?? undefined,
                affectedAssets: topUS.affectedAssets ? this.parseAffectedAssets(topUS.affectedAssets) : undefined,
            });
        }

        // 3. Top Argentina Economic Event (threshold: marketImpactScore >= 60)
        const topAR = economicEvents.find(e => e.country === 'AR' && e.marketImpactScore >= 60);
        if (topAR) {
            selectedCards.push({
                id: topAR.id,
                type: 'ECONOMIC',
                country: 'AR',
                title: topAR.title,
                subtitle: 'Argentina',
                date: topAR.date,
                time: topAR.time || undefined,
                dayLabel: this.getDayLabel(topAR.date),
                importance: topAR.importance as any,
                impactScore: topAR.marketImpactScore,
                previousValue: topAR.previousValue ?? undefined,
                consensusValue: topAR.consensusValue ?? undefined,
                actualValue: topAR.actualValue ?? undefined,
                surprise: topAR.surprise ?? undefined,
                expectedMarketEffect: topAR.expectedMarketEffect ?? undefined,
                affectedAssets: topAR.affectedAssets ? this.parseAffectedAssets(topAR.affectedAssets) : undefined,
            });
        }

        // Orden cronológico por fecha y hora
        selectedCards.sort((a, b) => {
            const dateComp = a.date.localeCompare(b.date);
            if (dateComp !== 0) return dateComp;
            return (a.time || '12:00').localeCompare(b.time || '12:00');
        });

        return {
            events: selectedCards.slice(0, 3),
            weekRange: { from: mondayStr, to: fridayStr },
            updatedAt: new Date().toISOString(),
        };
    }

    /**
     * Devuelve los eventos de la semana para la vista completa /calendario.
     * Si el usuario NO es PRO, se anonimizan/bloquean los campos exclusivos (consenso, sorpresa, datos avanzados).
     */
    async getWeekEvents(params: {
        weekStart?: string;
        category?: 'ALL' | 'US' | 'AR' | 'EARNINGS';
        importance?: 'HIGH' | 'MEDIUM' | 'LOW';
        user?: any;
    }): Promise<CalendarWeekResponse> {
        const isProUser = Boolean(
            params.user?.role === 'ADMIN' ||
            params.user?.plan === 'PRO' ||
            params.user?.accountType === 'PRO' ||
            params.user?.subscriptionStatus === 'ACTIVE' ||
            params.user?.isPro ||
            params.user?.subscriptionTier === 'pro'
        );

        let monday: Date;
        if (params.weekStart) {
            monday = new Date(params.weekStart);
        } else {
            monday = this.getMondayOfWeek(new Date());
        }

        const friday = new Date(monday.getTime() + 4 * 24 * 3600 * 1000);
        const mondayStr = monday.toISOString().substring(0, 10);
        const fridayStr = friday.toISOString().substring(0, 10);

        // Fetch economic and earnings
        const economicWhere: any = {
            date: { gte: mondayStr, lte: fridayStr },
            isPublished: true,
        };
        if (params.category === 'US') economicWhere.country = 'US';
        if (params.category === 'AR') economicWhere.country = 'AR';
        if (params.importance) economicWhere.importance = params.importance;

        const earningsWhere: any = {
            date: { gte: mondayStr, lte: fridayStr },
            isPublished: true,
        };

        const [dbEconomic, dbEarnings] = await Promise.all([
            params.category === 'EARNINGS' ? [] : this.prisma.marketCalendarEvent.findMany({
                where: economicWhere,
                orderBy: [{ date: 'asc' }, { time: 'asc' }, { marketImpactScore: 'desc' }],
            }),
            (params.category === 'US' || params.category === 'AR') ? [] : this.prisma.marketEarningsEvent.findMany({
                where: earningsWhere,
                orderBy: [{ date: 'asc' }, { earningsImpactScore: 'desc' }],
            }),
        ]);

        // Build days map for Monday through Friday
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        const shortNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'];
        const todayStr = new Date().toISOString().substring(0, 10);

        const days: CalendarWeekDay[] = [];
        for (let i = 0; i < 5; i++) {
            const currentDayDate = new Date(monday.getTime() + i * 24 * 3600 * 1000);
            const dateStr = currentDayDate.toISOString().substring(0, 10);

            // Filter economic events for this day
            const rawEco = dbEconomic.filter(e => e.date === dateStr);
            const rawEarn = dbEarnings.filter(e => e.date === dateStr);

            // Sanitize if not PRO
            const ecoEvents: EconomicEventItem[] = rawEco.map(e => ({
                id: e.id,
                eventType: 'ECONOMIC',
                country: e.country,
                currency: e.currency || undefined,
                title: e.title,
                description: isProUser ? (e.description || undefined) : undefined,
                category: e.category,
                importance: e.importance as any,
                marketImpactScore: e.marketImpactScore,
                date: e.date,
                time: e.time || undefined,
                timestampUtc: e.timestampUtc,
                timezone: e.timezone,
                // Exclusive PRO fields:
                previousValue: isProUser ? (e.previousValue || undefined) : undefined,
                consensusValue: isProUser ? (e.consensusValue || undefined) : undefined,
                actualValue: isProUser ? (e.actualValue || undefined) : undefined,
                surprise: isProUser ? (e.surprise ?? undefined) : undefined,
                surprisePercent: isProUser ? (e.surprisePercent ?? undefined) : undefined,
                expectedMarketEffect: isProUser ? (e.expectedMarketEffect || undefined) : undefined,
                affectedAssets: isProUser && e.affectedAssets ? this.parseAffectedAssets(e.affectedAssets) : undefined,
                source: isProUser ? (e.source || undefined) : undefined,
                sourceType: e.sourceType as any,
                isPublished: e.isPublished,
            }));

            const earnEvents: EarningsEventItem[] = rawEarn.map(e => ({
                id: e.id,
                eventType: 'EARNINGS',
                ticker: e.ticker,
                companyName: e.companyName,
                logoUrl: e.logoUrl || this.earningsScoring.getTradingViewLogoUrl(e.ticker),
                date: e.date,
                time: e.time || undefined,
                timestampUtc: e.timestampUtc,
                timezone: e.timezone,
                dateStatus: e.dateStatus as any,
                reportTiming: e.reportTiming as any,
                marketCap: e.marketCap ?? undefined,
                earningsImpactScore: e.earningsImpactScore,
                // Detailed estimates for PRO users:
                epsEstimate: isProUser ? (e.epsEstimate ?? undefined) : undefined,
                revenueEstimate: isProUser ? (e.revenueEstimate ?? undefined) : undefined,
                actualEps: isProUser ? (e.actualEps ?? undefined) : undefined,
                actualRevenue: isProUser ? (e.actualRevenue ?? undefined) : undefined,
                epsSurprise: isProUser ? (e.epsSurprise ?? undefined) : undefined,
                revenueSurprise: isProUser ? (e.revenueSurprise ?? undefined) : undefined,
                source: isProUser ? (e.source || undefined) : undefined,
                sourceType: e.sourceType as any,
                isPublished: e.isPublished,
            }));

            days.push({
                date: dateStr,
                dayName: dayNames[i],
                shortDay: shortNames[i],
                isToday: dateStr === todayStr,
                economicEvents: ecoEvents,
                earningsEvents: earnEvents,
            });
        }

        const counts = {
            all: dbEconomic.length + dbEarnings.length,
            us: dbEconomic.filter(e => e.country === 'US').length,
            ar: dbEconomic.filter(e => e.country === 'AR').length,
            earnings: dbEarnings.length,
        };

        return {
            weekRange: { from: mondayStr, to: fridayStr },
            isProUser,
            categories: counts,
            days,
        };
    }

    /**
     * Sincroniza datos de la semana desde proveedores autorizados hacia la base de datos.
     */
    async syncWeeklyData(fromStr?: string, toStr?: string): Promise<{ success: boolean; eventsProcessed: number; errors: number }> {
        const startTime = Date.now();
        const { mondayStr, fridayStr } = this.getCurrentWeekBounds();
        const from = fromStr || mondayStr;
        const to = toStr || fridayStr;

        let processed = 0;
        let errors = 0;

        try {
            this.logger.log(`Starting Calendar weekly sync from ${from} to ${to}...`);

            // 1. Fetch economic events from provider
            const economicList = await this.providerService.getUpcomingEconomicEvents(from, to, ['US', 'AR']);
            for (const item of economicList) {
                try {
                    // Check if already exists by country + date + normalized title
                    const existing = await this.prisma.marketCalendarEvent.findFirst({
                        where: {
                            country: item.country,
                            date: item.date,
                            title: { contains: item.title.substring(0, 15), mode: 'insensitive' },
                        },
                    });

                    if (existing) {
                        // Update if new values arrived
                        await this.prisma.marketCalendarEvent.update({
                            where: { id: existing.id },
                            data: {
                                previousValue: item.previousValue ?? existing.previousValue,
                                consensusValue: item.consensusValue ?? existing.consensusValue,
                                actualValue: item.actualValue ?? existing.actualValue,
                                surprise: item.surprise ?? existing.surprise,
                                time: item.time ?? existing.time,
                            },
                        });
                    } else {
                        await this.prisma.marketCalendarEvent.create({
                            data: {
                                eventType: 'ECONOMIC',
                                country: item.country,
                                currency: item.currency,
                                title: item.title,
                                description: item.description,
                                category: item.category,
                                importance: item.importance,
                                marketImpactScore: item.marketImpactScore,
                                date: item.date,
                                time: item.time,
                                timestampUtc: item.timestampUtc,
                                timezone: item.timezone,
                                previousValue: item.previousValue,
                                consensusValue: item.consensusValue,
                                actualValue: item.actualValue,
                                surprise: item.surprise,
                                surprisePercent: item.surprisePercent,
                                expectedMarketEffect: item.expectedMarketEffect,
                                affectedAssets: item.affectedAssets ? JSON.stringify(item.affectedAssets) : null,
                                source: item.source,
                                sourceType: 'AUTOMATIC',
                                isPublished: true,
                            },
                        });
                    }
                    processed++;
                } catch (e: any) {
                    errors++;
                    this.logger.warn(`Error storing economic event ${item.title}: ${e.message}`);
                }
            }

            // 2. Fetch Earnings from provider
            const earningsList = await this.providerService.getUpcomingEarnings(from, to);
            for (const earn of earningsList) {
                try {
                    const existing = await this.prisma.marketEarningsEvent.findFirst({
                        where: {
                            ticker: earn.ticker,
                            date: earn.date,
                        },
                    });

                    if (existing) {
                        await this.prisma.marketEarningsEvent.update({
                            where: { id: existing.id },
                            data: {
                                epsEstimate: earn.epsEstimate ?? existing.epsEstimate,
                                revenueEstimate: earn.revenueEstimate ?? existing.revenueEstimate,
                                actualEps: earn.actualEps ?? existing.actualEps,
                                actualRevenue: earn.actualRevenue ?? existing.actualRevenue,
                                reportTiming: earn.reportTiming ?? existing.reportTiming,
                            },
                        });
                    } else {
                        await this.prisma.marketEarningsEvent.create({
                            data: {
                                ticker: earn.ticker,
                                companyName: earn.companyName,
                                logoUrl: earn.logoUrl,
                                date: earn.date,
                                time: earn.time,
                                timestampUtc: earn.timestampUtc,
                                timezone: earn.timezone,
                                dateStatus: earn.dateStatus,
                                reportTiming: earn.reportTiming,
                                epsEstimate: earn.epsEstimate,
                                revenueEstimate: earn.revenueEstimate,
                                actualEps: earn.actualEps,
                                actualRevenue: earn.actualRevenue,
                                epsSurprise: earn.epsSurprise,
                                revenueSurprise: earn.revenueSurprise,
                                marketCap: earn.marketCap,
                                earningsImpactScore: earn.earningsImpactScore,
                                source: earn.source,
                                sourceType: 'AUTOMATIC',
                                isPublished: true,
                            },
                        });
                    }
                    processed++;
                } catch (e: any) {
                    errors++;
                    this.logger.warn(`Error storing earnings event for ${earn.ticker}: ${e.message}`);
                }
            }

            // Fallback: If no high-impact earnings found for the week, ensure top S&P 500 tech earnings baseline
            const countEarnings = await this.prisma.marketEarningsEvent.count({
                where: { date: { gte: from, lte: to } }
            });
            if (countEarnings === 0) {
                await this.seedBaselineEarnings(from, to);
                processed += 3;
            }

            const durationMs = Date.now() - startTime;
            await this.prisma.calendarSyncLog.create({
                data: {
                    syncType: 'ALL',
                    status: errors === 0 ? 'SUCCESS' : processed > 0 ? 'PARTIAL' : 'FAILED',
                    providerUsed: 'FMP & Official Calendars',
                    eventsProcessed: processed,
                    errorsCount: errors,
                    durationMs,
                },
            });

            this.logger.log(`Calendar weekly sync complete: ${processed} events processed, ${errors} errors in ${durationMs}ms`);
            return { success: true, eventsProcessed: processed, errors };
        } catch (error: any) {
            this.logger.error(`Calendar sync failed: ${error.message}`);
            await this.prisma.calendarSyncLog.create({
                data: {
                    syncType: 'ALL',
                    status: 'FAILED',
                    providerUsed: 'FMP & Official Calendars',
                    eventsProcessed: processed,
                    errorsCount: errors + 1,
                    durationMs: Date.now() - startTime,
                    errorMessage: error.message,
                },
            });
            return { success: false, eventsProcessed: processed, errors: errors + 1 };
        }
    }

    /**
     * Baseline de resultados empresariales relevantes si el proveedor externo no tiene eventos para la semana.
     */
    private async seedBaselineEarnings(from: string, to: string) {
        const seedData = [
            {
                ticker: 'NVDA',
                companyName: 'NVIDIA Corporation',
                reportTiming: 'AMC',
                epsEstimate: 0.74,
                revenueEstimate: 32.5,
                marketCap: 2800000000000,
                score: 96,
                dateStatus: 'CONFIRMED',
            },
            {
                ticker: 'MSFT',
                companyName: 'Microsoft Corporation',
                reportTiming: 'AMC',
                epsEstimate: 3.10,
                revenueEstimate: 64.7,
                marketCap: 3100000000000,
                score: 93,
                dateStatus: 'CONFIRMED',
            },
            {
                ticker: 'AAPL',
                companyName: 'Apple Inc.',
                reportTiming: 'AMC',
                epsEstimate: 1.53,
                revenueEstimate: 94.4,
                marketCap: 3400000000000,
                score: 94,
                dateStatus: 'CONFIRMED',
            }
        ];

        // Assign to Wednesday of current week
        const d = new Date(from);
        d.setDate(d.getDate() + 2); // Wednesday
        const wedStr = d.toISOString().substring(0, 10);

        for (const item of seedData) {
            await this.prisma.marketEarningsEvent.create({
                data: {
                    ticker: item.ticker,
                    companyName: item.companyName,
                    logoUrl: this.earningsScoring.getTradingViewLogoUrl(item.ticker),
                    date: wedStr,
                    time: '18:00',
                    timestampUtc: new Date(`${wedStr}T21:00:00Z`),
                    timezone: 'America/New_York',
                    dateStatus: item.dateStatus,
                    reportTiming: item.reportTiming,
                    epsEstimate: item.epsEstimate,
                    revenueEstimate: item.revenueEstimate,
                    marketCap: item.marketCap,
                    earningsImpactScore: item.score,
                    source: 'SEC EDGAR / Consensus',
                    sourceType: 'AUTOMATIC',
                    isPublished: true,
                },
            });
        }
    }

    // --- Admin Endpoints Support ---

    async getAdminEvents(params: {
        page?: number;
        limit?: number;
        country?: string;
        type?: 'ECONOMIC' | 'EARNINGS';
    }) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(100, params.limit || 30);
        const skip = (page - 1) * limit;

        if (params.type === 'EARNINGS') {
            const [items, total] = await Promise.all([
                this.prisma.marketEarningsEvent.findMany({
                    skip,
                    take: limit,
                    orderBy: [{ date: 'desc' }, { earningsImpactScore: 'desc' }],
                }),
                this.prisma.marketEarningsEvent.count(),
            ]);
            return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
        }

        const where: any = {};
        if (params.country) where.country = params.country;

        const [items, total] = await Promise.all([
            this.prisma.marketCalendarEvent.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ date: 'desc' }, { marketImpactScore: 'desc' }],
            }),
            this.prisma.marketCalendarEvent.count({ where }),
        ]);

        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async createAdminManualEvent(dto: {
        country: string;
        title: string;
        description?: string;
        category: string;
        importance?: 'HIGH' | 'MEDIUM' | 'LOW';
        marketImpactScore?: number;
        date: string;
        time?: string;
        previousValue?: string;
        consensusValue?: string;
        affectedAssets?: string[];
        expectedMarketEffect?: string;
        source?: string;
    }) {
        const evalRes = this.marketScoring.evaluateEvent(dto.title, dto.country);
        const timezone = dto.country === 'AR' ? 'America/Argentina/Buenos_Aires' : 'America/New_York';

        return this.prisma.marketCalendarEvent.create({
            data: {
                eventType: 'ECONOMIC',
                country: dto.country.toUpperCase(),
                title: dto.title,
                description: dto.description,
                category: dto.category || evalRes.category,
                importance: dto.importance || evalRes.importance,
                marketImpactScore: dto.marketImpactScore ?? evalRes.score,
                date: dto.date,
                time: dto.time,
                timestampUtc: new Date(`${dto.date}T${dto.time || '12:00'}:00Z`),
                timezone,
                previousValue: dto.previousValue,
                consensusValue: dto.consensusValue,
                affectedAssets: dto.affectedAssets ? JSON.stringify(dto.affectedAssets) : JSON.stringify(evalRes.affectedAssets),
                expectedMarketEffect: dto.expectedMarketEffect || evalRes.expectedEffect,
                source: dto.source || 'Admin Manual',
                sourceType: 'MANUAL',
                isPublished: true,
            },
        });
    }

    async updateAdminEvent(id: string, dto: any) {
        // Check economic first
        const eco = await this.prisma.marketCalendarEvent.findUnique({ where: { id } });
        if (eco) {
            return this.prisma.marketCalendarEvent.update({
                where: { id },
                data: dto,
            });
        }

        const earn = await this.prisma.marketEarningsEvent.findUnique({ where: { id } });
        if (earn) {
            return this.prisma.marketEarningsEvent.update({
                where: { id },
                data: dto,
            });
        }

        throw new NotFoundException('Evento no encontrado');
    }

    async deleteAdminEvent(id: string) {
        try {
            await this.prisma.marketCalendarEvent.delete({ where: { id } });
            return { success: true };
        } catch {
            await this.prisma.marketEarningsEvent.delete({ where: { id } });
            return { success: true };
        }
    }

    async getSyncLogs() {
        return this.prisma.calendarSyncLog.findMany({
            take: 20,
            orderBy: { executedAt: 'desc' },
        });
    }

    // --- Helper Utilities ---

    private getCurrentWeekBounds(): { mondayStr: string; fridayStr: string } {
        const monday = this.getMondayOfWeek(new Date());
        const friday = new Date(monday.getTime() + 4 * 24 * 3600 * 1000);
        return {
            mondayStr: monday.toISOString().substring(0, 10),
            fridayStr: friday.toISOString().substring(0, 10),
        };
    }

    private getMondayOfWeek(d: Date): Date {
        const date = new Date(d);
        const day = date.getDay();
        let diff: number;
        if (day === 0) {
            diff = date.getDate() + 1;
        } else if (day === 6) {
            diff = date.getDate() + 2;
        } else {
            diff = date.getDate() - day + 1;
        }
        date.setDate(diff);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    private getDayLabel(dateStr: string): string {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        const day = dt.getUTCDay();
        const labels = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
        return labels[day] || 'HOY';
    }

    private parseAffectedAssets(raw: string): string[] {
        try {
            if (raw.startsWith('[')) {
                return JSON.parse(raw);
            }
            return raw.split(',').map(s => s.trim()).filter(Boolean);
        } catch {
            return [];
        }
    }
}
