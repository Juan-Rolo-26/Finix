import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { financialNumber, isCalendarDate, isVisibleEarnings, normalizeEarnings, earningsSurprise } from '@finix/shared';
import { PrismaService } from '../prisma.service';
import {
    HomeCalendarResponse,
    HomeCalendarEventCard,
    CalendarWeekResponse,
    CalendarWeekDay,
    EconomicEventItem,
    EarningsEventItem,
    DividendEventItem,
} from './interfaces/calendar.interface';
import { CalendarProviderService } from './services/calendar-provider.service';
import { MarketImpactScoringService } from './services/market-impact-scoring.service';
import { EarningsImpactScoringService } from './services/earnings-impact-scoring.service';
import { hasEffectiveProAccess } from '../auth/pro-access';
import { isLegacyEconomicTemplate, isLegacyEarningsTemplate } from './calendar-legacy-data';

@Injectable()
export class CalendarService {
    private readonly logger = new Logger(CalendarService.name);
    private earningsRefresh: Promise<unknown> | null = null;
    private dividendsRefresh: Promise<unknown> | null = null;

    private async refreshCorporateEvents(category?: string) {
        const pending: Promise<unknown>[] = [];
        if (!category || category === 'ALL' || category === 'EARNINGS') {
            this.earningsRefresh ??= this.providerService.fetchTradingViewSP500Earnings({ forceRefresh: true })
                .finally(() => { this.earningsRefresh = null; });
            pending.push(this.earningsRefresh);
        }
        if (!category || category === 'ALL' || category === 'DIVIDEND') {
            this.dividendsRefresh ??= this.providerService.fetchTradingViewSP500Dividends({ forceRefresh: true })
                .finally(() => { this.dividendsRefresh = null; });
            pending.push(this.dividendsRefresh);
        }
        await Promise.all(pending);
    }

    constructor(
        private readonly prisma: PrismaService,
        private readonly providerService: CalendarProviderService,
        private readonly marketScoring: MarketImpactScoringService,
        private readonly earningsScoring: EarningsImpactScoringService,
    ) { }

    private get calendarSourceRepo(): any {
        return (this.prisma as any).calendarSource;
    }

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

        economicEvents = economicEvents.filter(event => !isLegacyEconomicTemplate(event));
        const [liveEconomic, liveEarnings] = await Promise.all([
            this.providerService.getUpcomingEconomicEvents(mondayStr, fridayStr),
            this.providerService.fetchTradingViewSP500Earnings({ from: mondayStr, to: fridayStr }),
        ]);
        const eventKey = (event: any) => JSON.stringify([event.country, event.date, event.time || '', event.title.trim().toLowerCase()]);
        const merged = new Map<string, (typeof economicEvents)[number]>(economicEvents.map(event => [eventKey(event), event]));
        for (const event of liveEconomic) {
            const key = eventKey(event);
            const previous = merged.get(key);
            if (previous?.sourceType === 'MANUAL' || previous?.isManual) continue;
            const availableFields = Object.fromEntries(Object.entries(event).filter(([, value]) => value !== undefined));
            merged.set(key, { ...previous, ...availableFields, id: previous?.id || `economic-${event.externalId || key}` } as any);
        }
        economicEvents = [...merged.values()].sort((a, b) => b.marketImpactScore - a.marketImpactScore || a.date.localeCompare(b.date));
        const earningsKey = (event: any) => `${event.ticker.trim().toUpperCase().replace(/\./g, '-')}|${event.date}`;
        const mergedEarnings = new Map<string, (typeof earningsEvents)[number]>(
            earningsEvents.filter(event => !isLegacyEarningsTemplate(event)).map(event => [earningsKey(event), event]));
        for (const event of liveEarnings) {
            const key = earningsKey(event);
            const previous = mergedEarnings.get(key);
            if (previous?.sourceType === 'MANUAL') continue;
            const availableFields = Object.fromEntries(Object.entries(event).filter(([, value]) => value !== undefined));
            mergedEarnings.set(key, { ...previous, ...availableFields, id: previous?.id || `earnings-${key}` } as any);
        }
        earningsEvents = [...mergedEarnings.values()].map(normalizeEarnings).filter(isVisibleEarnings)
            .sort((a, b) => b.earningsImpactScore - a.earningsImpactScore || a.date.localeCompare(b.date));
        const selectedCards: HomeCalendarEventCard[] = [];

        // 1. Top Earnings Candidate (threshold: earningsImpactScore >= 65)
        const topEarnings = earningsEvents.find(e => e.earningsImpactScore >= 65);
        if (topEarnings) {
            const timingText = topEarnings.reportTiming === 'AMC'
                ? 'Después del cierre'
                : topEarnings.reportTiming === 'BMO'
                    ? 'Antes de la apertura'
                    : topEarnings.reportTiming === 'DMH' ? 'Durante la rueda' : 'Horario pendiente';

            selectedCards.push({
                id: topEarnings.id,
                type: 'EARNINGS',
                ticker: topEarnings.ticker,
                title: topEarnings.companyName,
                subtitle: topEarnings.actualEps != null || topEarnings.actualRevenue != null ? 'Resultados publicados' : 'Presenta resultados',
                date: topEarnings.date,
                time: topEarnings.time || undefined,
                dayLabel: this.getDayLabel(topEarnings.date),
                timingLabel: timingText,
                importance: topEarnings.earningsImpactScore >= 80 ? 'HIGH' : 'MEDIUM',
                impactScore: topEarnings.earningsImpactScore,
                logoUrl: topEarnings.logoUrl || this.earningsScoring.getTradingViewLogoUrl(topEarnings.ticker),
                epsEstimate: topEarnings.epsEstimate ?? undefined,
                revenueEstimate: topEarnings.revenueEstimate ?? undefined,
                actualEps: topEarnings.actualEps ?? undefined,
                actualRevenue: topEarnings.actualRevenue ?? undefined,
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

        // Fill remaining slots up to 3 from other high-impact economic events if needed
        if (selectedCards.length < 3) {
            for (const eco of economicEvents) {
                if (selectedCards.length >= 3) break;
                if (!selectedCards.some(c => c.id === eco.id || c.title.trim().toLowerCase() === eco.title.trim().toLowerCase())) {
                    selectedCards.push({
                        id: eco.id,
                        type: 'ECONOMIC',
                        country: eco.country as any,
                        title: eco.title,
                        subtitle: eco.country === 'AR' ? 'Argentina' : 'Estados Unidos',
                        date: eco.date,
                        time: eco.time || undefined,
                        dayLabel: this.getDayLabel(eco.date),
                        importance: eco.importance as any,
                        impactScore: eco.marketImpactScore,
                        previousValue: eco.previousValue ?? undefined,
                        consensusValue: eco.consensusValue ?? undefined,
                        actualValue: eco.actualValue ?? undefined,
                        surprise: eco.surprise ?? undefined,
                        expectedMarketEffect: eco.expectedMarketEffect ?? undefined,
                        affectedAssets: eco.affectedAssets ? this.parseAffectedAssets(eco.affectedAssets) : undefined,
                    });
                }
            }
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
        category?: 'ALL' | 'US' | 'AR' | 'EARNINGS' | 'DIVIDEND' | string;
        importance?: 'HIGH' | 'MEDIUM' | 'LOW';
        user?: any;
    }): Promise<CalendarWeekResponse> {
        const isProUser = hasEffectiveProAccess(params.user);
        const tickerKey = (ticker: string) => ticker.trim().toUpperCase().replace(/\./g, '-');

        const isAll = params.weekStart === 'ALL' || params.weekStart === 'all';

        let monday: Date = new Date();
        let mondayStr = '';
        let sundayStr = '';

        if (!isAll) {
            if (params.weekStart) {
                monday = new Date(params.weekStart);
            } else {
                monday = this.getMondayOfWeek(new Date());
            }

            const sunday = new Date(monday.getTime() + 6 * 24 * 3600 * 1000);
            mondayStr = monday.toISOString().substring(0, 10);
            sundayStr = sunday.toISOString().substring(0, 10);
        }

        // Fetch current provider data without waiting for the scheduled DB sync.
        // Concurrent page loads share the same in-flight provider request.
        await this.refreshCorporateEvents(params.category);

        // Fetch economic and earnings
        const economicWhere: any = {
            isPublished: true,
        };
        if (!isAll) {
            economicWhere.date = { gte: mondayStr, lte: sundayStr };
        }
        if (params.category === 'US') economicWhere.country = 'US';
        if (params.category === 'AR') economicWhere.country = 'AR';
        if (params.importance) economicWhere.importance = params.importance;

        const earningsWhere: any = {
            isPublished: true,
        };
        if (!isAll) {
            earningsWhere.date = { gte: mondayStr, lte: sundayStr };
        }

        let [dbEconomic, dbEarnings] = await Promise.all([
            (params.category === 'EARNINGS' || params.category === 'DIVIDEND') ? [] : this.prisma.marketCalendarEvent.findMany({
                where: economicWhere,
                orderBy: [{ date: 'asc' }, { time: 'asc' }, { marketImpactScore: 'desc' }],
            }),
            (params.category === 'US' || params.category === 'AR' || params.category === 'DIVIDEND') ? [] : this.prisma.marketEarningsEvent.findMany({
                where: earningsWhere,
                orderBy: [{ date: 'asc' }, { earningsImpactScore: 'desc' }],
            }),
        ]);

        const excludedLegacyEvents = dbEconomic.filter(isLegacyEconomicTemplate).length;
        dbEconomic = dbEconomic.filter(event => !isLegacyEconomicTemplate(event));
        dbEarnings = dbEarnings.filter(event => !isLegacyEarningsTemplate(event));
        let economicData: CalendarWeekResponse['economicData'];
        if (!isAll && params.category !== 'EARNINGS' && params.category !== 'DIVIDEND') {
            const countries = params.category === 'US' || params.category === 'AR'
                ? [params.category] : ['US', 'AR'];
            const liveEconomic = await this.providerService.getUpcomingEconomicEvents(mondayStr, sundayStr, countries);
            economicData = {
                ...this.providerService.getEconomicFeedStatus(mondayStr, sundayStr, countries),
                excludedLegacyEvents,
            };
            const eventKey = (event: any) => JSON.stringify([
                event.country, event.date, event.time || '', event.title.trim().toLowerCase(),
            ]);
            const merged = new Map<string, (typeof dbEconomic)[number]>(dbEconomic.map(event => [eventKey(event), event]));
            for (const event of liveEconomic) {
                if (params.importance && event.importance !== params.importance) continue;
                const key = eventKey(event);
                const previous = merged.get(key);
                if (previous?.sourceType === 'MANUAL' || previous?.isManual) continue;
                const availableFields = Object.fromEntries(Object.entries(event).filter(([, value]) => value !== undefined));
                merged.set(key, { ...previous, ...availableFields } as any);
            }
            dbEconomic = [...merged.values()].sort((a, b) =>
                a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
        }

        if (params.category !== 'US' && params.category !== 'AR' && params.category !== 'DIVIDEND') {
            const tvEarnings = await this.providerService.fetchTradingViewSP500Earnings({ from: mondayStr, to: sundayStr });
            const existingByKey = new Map<string, number>(dbEarnings.map((e, index) => [`${tickerKey(e.ticker)}|${e.date}`, index]));
            for (const event of tvEarnings) {
                const key = `${tickerKey(event.ticker)}|${event.date}`;
                const index = existingByKey.get(key);
                if (index === undefined) {
                    existingByKey.set(key, dbEarnings.length);
                    dbEarnings.push(event as any);
                } else if (dbEarnings[index].sourceType !== 'MANUAL') {
                    const availableFields = Object.fromEntries(Object.entries(event).filter(([, value]) => value !== undefined));
                    dbEarnings[index] = { ...dbEarnings[index], ...availableFields } as any;
                }
            }
            dbEarnings.sort((a, b) => a.date.localeCompare(b.date) || b.earningsImpactScore - a.earningsImpactScore);
        }

        // Fetch S&P 500 dividends from DB or TradingView.
        let dbDividends: any[] = [];
        if (params.category !== 'US' && params.category !== 'AR' && params.category !== 'EARNINGS') {
            try {
                if ((this.prisma as any).marketDividendEvent) {
                    const dividendWhere: any = { isPublished: true };
                    if (!isAll) {
                        dividendWhere.OR = [
                            { paymentDate: { gte: mondayStr, lte: sundayStr } },
                            { exDate: { gte: mondayStr, lte: sundayStr } },
                        ];
                    }
                    dbDividends = await (this.prisma as any).marketDividendEvent.findMany({
                        where: dividendWhere,
                        orderBy: [{ paymentDate: 'asc' }, { exDate: 'asc' }],
                    });
                }
            } catch {
                // Table might not exist yet
            }

            const tvDivs = await this.providerService.fetchTradingViewSP500Dividends({ from: mondayStr, to: sundayStr });
            const dividendKey = (d: any) => `${String(d.ticker).trim().toUpperCase().replace(/\./g, '-')}|${d.exDate || ''}|${d.paymentDate || ''}|${d.amount ?? ''}`;
            const existingByKey = new Map(dbDividends.map((d, index) => [dividendKey(d), index]));
            for (const event of tvDivs) {
                const key = dividendKey(event);
                const index = existingByKey.get(key);
                if (index === undefined) {
                    existingByKey.set(key, dbDividends.length);
                    dbDividends.push(event as any);
                } else if (dbDividends[index].sourceType !== 'MANUAL') {
                    dbDividends[index] = { ...dbDividends[index], ...event };
                }
            }
            dbDividends.sort((a, b) => (a.paymentDate || a.exDate).localeCompare(b.paymentDate || b.exDate));
        }


        dbEarnings = dbEarnings.map(normalizeEarnings).filter(isVisibleEarnings);
        dbDividends = dbDividends.filter(event =>
            event.ticker?.trim() && (isCalendarDate(event.exDate) || isCalendarDate(event.paymentDate)) &&
            financialNumber(event.amount) !== undefined && financialNumber(event.amount)! >= 0);

        // Deduplicate stored records too, preserving the first (persisted) event.
        const uniqueEvents = <T,>(events: T[], key: (event: T) => string): T[] =>
            Array.from(events.reduce((map, event) => {
                const id = key(event);
                if (!map.has(id)) map.set(id, event);
                return map;
            }, new Map<string, T>()).values());
        dbEarnings = uniqueEvents(dbEarnings, (e: { ticker: string; date: string }) => `${tickerKey(e.ticker)}|${e.date}`);
        const dividendDisplayDate = (d: any) =>
            d.paymentDate && (isAll || (d.paymentDate >= mondayStr && d.paymentDate <= sundayStr))
                ? d.paymentDate : d.exDate;
        dbDividends.sort((a, b) =>
            (dividendDisplayDate(a) || '').localeCompare(dividendDisplayDate(b) || ''));
        // Different distributions of the same company must remain visible.
        dbDividends = uniqueEvents(dbDividends, d =>
            `${tickerKey(d.ticker)}|${d.exDate || ''}|${d.paymentDate || ''}|${d.amount ?? ''}`);

        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const shortNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
        const todayStr = new Date().toISOString().substring(0, 10);

        const days: CalendarWeekDay[] = [];

        // Función mapeadora de eventos económicos con sanitización PRO
        const mapEcoEvents = (rawEco: any[]): EconomicEventItem[] => rawEco.map(e => ({
            id: e.id || `economic-${e.country}-${e.date}-${e.time || ''}-${e.externalId || e.title}`,
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
            previousValue: isProUser ? (e.previousValue || undefined) : undefined,
            forecastValue: isProUser ? (e.forecastValue ?? undefined) : undefined,
            consensusValue: isProUser ? (e.consensusValue || undefined) : undefined,
            actualValue: isProUser ? (e.actualValue || undefined) : undefined,
            unit: e.unit || undefined,
            surprise: isProUser ? (e.surprise ?? undefined) : undefined,
            surprisePercent: isProUser ? (e.surprisePercent ?? undefined) : undefined,
            expectedMarketEffect: isProUser ? (e.expectedMarketEffect || undefined) : undefined,
            affectedAssets: isProUser && e.affectedAssets ? this.parseAffectedAssets(e.affectedAssets) : undefined,
            source: isProUser ? (e.source || undefined) : undefined,
            sourceName: isProUser ? (e.sourceName || undefined) : undefined,
            sourceUrl: isProUser ? (e.sourceUrl || undefined) : undefined,
            sourceType: e.sourceType as any,
            isPublished: e.isPublished,
        }));

        // Función mapeadora de earnings con sanitización PRO
        const mapEarnEvents = (rawEarn: any[]): EarningsEventItem[] => rawEarn.map(e => ({
            id: e.id || `earnings-${tickerKey(e.ticker)}-${e.date}`,
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
            epsEstimate: e.epsEstimate ?? undefined,
            revenueEstimate: e.revenueEstimate ?? undefined,
            actualEps: e.actualEps ?? undefined,
            actualRevenue: e.actualRevenue ?? undefined,
            epsSurprise: e.epsSurprise ?? undefined,
            revenueSurprise: e.revenueSurprise ?? undefined,
            marketReaction: (e as any).marketReaction ?? undefined,
            source: e.source || undefined,
            sourceType: e.sourceType as any,
            isPublished: e.isPublished,
        }));

        // Función mapeadora de dividendos del universo estadounidense.
        const mapDivEvents = (rawDiv: any[]): DividendEventItem[] => rawDiv.map(d => ({
            id: d.id || `dividend-${tickerKey(d.ticker)}-${d.exDate || ''}-${d.paymentDate || ''}-${d.amount ?? ''}`,
            eventType: 'DIVIDEND',
            ticker: d.ticker,
            companyName: d.companyName,
            logoUrl: d.logoUrl || this.earningsScoring.getTradingViewLogoUrl(d.ticker),
            exDate: d.exDate,
            paymentDate: d.paymentDate || undefined,
            recordDate: d.recordDate || undefined,
            declarationDate: d.declarationDate || undefined,
            amount: d.amount != null ? Number(d.amount) : undefined,
            yield: d.yield != null ? Number(d.yield) : undefined,
            frequency: d.frequency || undefined,
            marketCap: d.marketCap ?? undefined,
            source: d.source || 'TradingView Official Scanner',
            sourceType: (d.sourceType || 'AUTOMATIC') as any,
            isPublished: d.isPublished ?? true,
        }));

        if (isAll) {
            // Agrupar por todas las fechas únicas que tienen eventos
            const allDatesSet = new Set<string>([
                ...dbEconomic.map(e => e.date),
                ...dbEarnings.map(e => e.date),
                ...dbDividends.map(d => d.paymentDate || d.exDate).filter(Boolean),
            ]);
            const sortedDates = Array.from(allDatesSet).sort();

            for (const dateStr of sortedDates) {
                const parts = dateStr.split('-').map(Number);
                const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
                const dayIndex = dObj.getDay();

                const rawEco = dbEconomic.filter(e => e.date === dateStr);
                const rawEarn = dbEarnings.filter(e => e.date === dateStr);
                const rawDiv = dbDividends.filter(d => dividendDisplayDate(d) === dateStr);

                days.push({
                    date: dateStr,
                    dayName: dayNames[dayIndex],
                    shortDay: shortNames[dayIndex],
                    isToday: dateStr === todayStr,
                    economicEvents: mapEcoEvents(rawEco),
                    earningsEvents: mapEarnEvents(rawEarn),
                    dividendEvents: mapDivEvents(rawDiv),
                });
            }
        } else {
            // Vista de semana estándar (Lunes a Viernes / Domingo)
            for (let i = 0; i < 7; i++) {
                const currentDayDate = new Date(monday.getTime() + i * 24 * 3600 * 1000);
                const dateStr = currentDayDate.toISOString().substring(0, 10);
                const dayIndex = currentDayDate.getDay();

                const rawEco = dbEconomic.filter(e => e.date === dateStr);
                const rawEarn = dbEarnings.filter(e => e.date === dateStr);
                const rawDiv = dbDividends.filter(d => dividendDisplayDate(d) === dateStr);

                // Omitir sábado y domingo si no tienen eventos
                if ((i === 5 || i === 6) && rawEco.length === 0 && rawEarn.length === 0 && rawDiv.length === 0) {
                    continue;
                }

                days.push({
                    date: dateStr,
                    dayName: dayNames[dayIndex],
                    shortDay: shortNames[dayIndex],
                    isToday: dateStr === todayStr,
                    economicEvents: mapEcoEvents(rawEco),
                    earningsEvents: mapEarnEvents(rawEarn),
                    dividendEvents: mapDivEvents(rawDiv),
                });
            }
        }

        const counts = {
            all: dbEconomic.length + dbEarnings.length + dbDividends.length,
            us: dbEconomic.filter(e => e.country === 'US').length,
            ar: dbEconomic.filter(e => e.country === 'AR').length,
            earnings: dbEarnings.length,
            dividends: dbDividends.length,
        };

        const rangeFrom = days[0]?.date || mondayStr;
        const rangeTo = days[days.length - 1]?.date || sundayStr;

        return {
            weekRange: { from: rangeFrom, to: rangeTo },
            isProUser,
            economicData,
            categories: counts,
            days,
        };
    }

    /**
     * Sincroniza datos de la semana desde proveedores autorizados hacia la base de datos.
     */
    async syncWeeklyData(fromStr?: string, toStr?: string): Promise<{ success: boolean; eventsProcessed: number; errors: number }> {
        const macroRes = await this.syncMacroData(fromStr, toStr);
        const earnRes = await this.syncTradingViewEarnings();
        const repRes = await this.syncReportedEarningsResults();
        const divRes = await this.syncTradingViewDividends();
        return {
            success: macroRes.success && earnRes.success && divRes.success,
            eventsProcessed: (macroRes.eventsCreated + macroRes.eventsUpdated) + (earnRes.eventsProcessed || 0) + (repRes.updated || 0) + (divRes.eventsProcessed || 0),
            errors: macroRes.errorsCount + (earnRes.errors || 0) + (repRes.errors || 0) + (divRes.errors || 0),
        };
    }

    /**
     * Asegura que las fuentes institucionales predefinidas existan en la tabla CalendarSource.
     */
    async ensureSourcesInitialized() {
        try {
            const count = await this.calendarSourceRepo.count();
            if (count === 0) {
                const defaults = this.providerService.getPredefinedSources();
                for (const s of defaults) {
                    await this.calendarSourceRepo.create({ data: s });
                }
                this.logger.log(`Initialized ${defaults.length} predefined calendar sources in database.`);
            }
        } catch (e: any) {
            this.logger.warn(`Could not initialize predefined sources: ${e.message}`);
        }
    }

    /**
     * Sincronización inteligente de eventos macroeconómicos y de mercado.
     * Incluye normalización, cálculo de impactScore 0-100, categoría, deduplicación canónica
     * mediante eventFingerprint y jerarquía de prioridad de fuentes.
     */
    async syncMacroData(fromStr?: string, toStr?: string, sourceId?: string): Promise<{
        success: boolean;
        message: string;
        eventsFound: number;
        eventsCreated: number;
        eventsUpdated: number;
        duplicatesIgnored: number;
        errorsCount: number;
        durationMs: number;
    }> {
        const startTime = Date.now();
        await this.ensureSourcesInitialized();

        const { mondayStr, fridayStr } = this.getCurrentWeekBounds();
        const from = fromStr || mondayStr;
        const to = toStr || new Date(new Date(from).getTime() + 14 * 24 * 3600 * 1000).toISOString().substring(0, 10);

        let eventsFound = 0;
        let eventsCreated = 0;
        let eventsUpdated = 0;
        let duplicatesIgnored = 0;
        let errorsCount = 0;

        try {
            this.logger.log(`[MarketCalendar] Starting macro sync from ${from} to ${to}... (Source: ${sourceId || 'ALL'})`);

            // 1. Obtener eventos normalizados desde los adaptadores
            const rawEvents = await this.providerService.getUpcomingEconomicEvents(from, to, ['US', 'AR']);
            const economicStatus = this.providerService.getEconomicFeedStatus(from, to);
            if (economicStatus.status !== 'READY') {
                throw new Error(economicStatus.status === 'NOT_CONFIGURED'
                    ? 'Economic calendar provider is not configured'
                    : `Economic calendar provider unavailable${economicStatus.httpStatus ? ` (HTTP ${economicStatus.httpStatus})` : ''}`);
            }
            eventsFound = rawEvents.length;

            for (const item of rawEvents) {
                try {
                    const country = (item.country || 'US').toUpperCase().trim();
                    const date = (item.date || from).substring(0, 10).trim();
                    const title = item.title.trim();
                    const ticker = item.ticker ? item.ticker.toUpperCase().trim() : undefined;

                    // Evaluar scoring e impacto
                    const evalRes = this.marketScoring.evaluateEvent(title, country, ticker);
                    const score = item.impactScore ?? item.marketImpactScore ?? evalRes.score;
                    const impact = this.marketScoring.scoreToImpact(score);
                    const category = item.category || evalRes.category;
                    const fingerprint = this.marketScoring.generateFingerprint(country, date, title, ticker);
                    const sourceName = item.sourceName || item.source || 'Official Source';
                    const incomingPriority = this.marketScoring.getSourcePriority(sourceName);

                    // Regla de publicación inteligente:
                    // impactScore >= 70 o fuente oficial -> PUBLISHED
                    // impactScore >= 40 -> APPROVED
                    // impactScore < 40 -> PENDING_REVIEW
                    const autoStatus = score >= 70 ? 'PUBLISHED' : (score >= 40 ? 'APPROVED' : 'PENDING_REVIEW');
                    const isPub = autoStatus === 'PUBLISHED' || autoStatus === 'APPROVED';

                    // Deduplicación por fingerprint canónico
                    const existing = await this.prisma.marketCalendarEvent.findFirst({
                        where: {
                            OR: [
                                { eventFingerprint: fingerprint },
                                { country, date, title: { contains: title.substring(0, 16), mode: 'insensitive' } },
                            ],
                        },
                    });

                    if (existing) {
                        const existingPriority = this.marketScoring.getSourcePriority(existing.sourceName || existing.source || '');
                        const hasNewActual = item.actualValue && !existing.actualValue;
                        const hasNewConsensus = item.consensusValue && !existing.consensusValue;

                        // Si la fuente entrante tiene mayor o igual prioridad, o aporta datos reales
                        if (incomingPriority <= existingPriority || hasNewActual || hasNewConsensus) {
                            await this.prisma.marketCalendarEvent.update({
                                where: { id: existing.id },
                                data: {
                                    previousValue: item.previousValue ?? existing.previousValue,
                                    forecastValue: item.forecastValue ?? existing.forecastValue,
                                    consensusValue: item.consensusValue ?? existing.consensusValue,
                                    actualValue: item.actualValue ?? existing.actualValue,
                                    unit: item.unit ?? existing.unit,
                                    surprise: item.surprise ?? existing.surprise,
                                    surprisePercent: item.surprisePercent ?? existing.surprisePercent,
                                    time: item.time ?? existing.time,
                                    impact,
                                    impactScore: score,
                                    importance: impact,
                                    marketImpactScore: score,
                                    eventFingerprint: fingerprint,
                                    sourceName: incomingPriority <= existingPriority ? sourceName : existing.sourceName,
                                    sourceUrl: item.sourceUrl ?? existing.sourceUrl,
                                    updatedAt: new Date(),
                                },
                            });
                            eventsUpdated++;
                        } else {
                            duplicatesIgnored++;
                        }
                    } else {
                        // Crear nuevo evento canónico
                        await this.prisma.marketCalendarEvent.create({
                            data: {
                                eventType: item.eventType || 'ECONOMIC',
                                country,
                                countryCode: country,
                                currency: item.currency || (country === 'AR' ? 'ARS' : 'USD'),
                                title,
                                description: item.description,
                                category,
                                subcategory: item.subcategory,
                                importance: impact,
                                impact,
                                marketImpactScore: score,
                                impactScore: score,
                                date,
                                time: item.time || '12:00',
                                timestampUtc: item.timestampUtc || new Date(`${date}T12:00:00Z`),
                                timezone: item.timezone || (country === 'AR' ? 'America/Argentina/Buenos_Aires' : 'America/New_York'),
                                previousValue: item.previousValue,
                                forecastValue: item.forecastValue,
                                consensusValue: item.consensusValue,
                                actualValue: item.actualValue,
                                unit: item.unit,
                                surprise: item.surprise,
                                surprisePercent: item.surprisePercent,
                                expectedMarketEffect: item.expectedMarketEffect || evalRes.expectedEffect,
                                affectedAssets: item.affectedAssets ? JSON.stringify(item.affectedAssets) : JSON.stringify(evalRes.affectedAssets),
                                source: sourceName,
                                sourceName,
                                sourceUrl: item.sourceUrl,
                                sourceType: 'AUTOMATIC',
                                companyName: item.companyName,
                                ticker,
                                status: autoStatus,
                                isManual: false,
                                isAutomatic: true,
                                isVerified: incomingPriority === 1,
                                isPublished: isPub,
                                eventFingerprint: fingerprint,
                            },
                        });
                        eventsCreated++;
                    }
                } catch (err: any) {
                    errorsCount++;
                    this.logger.warn(`[MarketCalendar] Error processing event ${item.title}: ${err.message}`);
                }
            }

            const durationMs = Date.now() - startTime;
            await this.prisma.calendarSyncLog.create({
                data: {
                    syncType: 'MACRO',
                    status: errorsCount === 0 ? 'SUCCESS' : 'PARTIAL',
                    providerUsed: 'Official US/AR & Market Feeds',
                    eventsProcessed: eventsCreated + eventsUpdated,
                    eventsFound,
                    eventsCreated,
                    eventsUpdated,
                    duplicates: duplicatesIgnored,
                    errorsCount,
                    durationMs,
                },
            });

            // Actualizar timestamp en las fuentes activas
            await this.calendarSourceRepo.updateMany({
                where: { isActive: true },
                data: { lastSyncAt: new Date(), syncStatus: 'SUCCESS' },
            });

            const msg = `Sincronización completada: ${eventsFound} encontrados, ${eventsCreated} nuevos, ${eventsUpdated} actualizados, ${duplicatesIgnored} duplicados ignorados.`;
            this.logger.log(`[MarketCalendar] ${msg} in ${durationMs}ms`);

            return {
                success: true,
                message: msg,
                eventsFound,
                eventsCreated,
                eventsUpdated,
                duplicatesIgnored,
                errorsCount,
                durationMs,
            };
        } catch (error: any) {
            const durationMs = Date.now() - startTime;
            this.logger.error(`[MarketCalendar] Sync failed: ${error.message}`);
            await this.prisma.calendarSyncLog.create({
                data: {
                    syncType: 'MACRO',
                    status: 'FAILED',
                    providerUsed: 'Official US/AR & Market Feeds',
                    eventsProcessed: 0,
                    eventsFound,
                    eventsCreated,
                    eventsUpdated,
                    duplicates: duplicatesIgnored,
                    errorsCount: errorsCount + 1,
                    durationMs,
                    errorMessage: error.message,
                },
            });

            return {
                success: false,
                message: `Error al sincronizar: ${error.message}`,
                eventsFound,
                eventsCreated,
                eventsUpdated,
                duplicatesIgnored,
                errorsCount: errorsCount + 1,
                durationMs,
            };
        }
    }

    // --- Admin Endpoints Support ---

    /**
     * Sincroniza en tiempo real los balances del universo estadounidense desde TradingView Scanner.
     */
    async syncTradingViewEarnings(targetDate?: string) {
        const startTime = Date.now();
        this.logger.log(`Starting TradingView US earnings sync... ${targetDate ? `(Target Date: ${targetDate})` : ''}`);

        try {
            const list = await this.providerService.fetchTradingViewSP500Earnings({
                targetDate,
                forceRefresh: true,
            });

            let created = 0;
            let updated = 0;
            let errors = 0;

            if (list.length > 0) {
                // Preserve real historical results for prior weeks.
                const uniqueItems = Array.from(new Map(
                    list.map(normalizeEarnings).filter(isVisibleEarnings).map(item => [`${item.ticker.toUpperCase()}|${item.date}`, item]),
                ).values());
                const existing = await this.prisma.marketEarningsEvent.findMany({
                    where: {
                        sourceType: 'AUTOMATIC',
                        OR: uniqueItems.map(item => ({ ticker: item.ticker, date: item.date })),
                    },
                    select: { id: true, ticker: true, date: true },
                });
                const existingByKey = new Map(existing.map(event => [
                    `${event.ticker.toUpperCase()}|${event.date}`,
                    event.id,
                ]));

                for (const item of uniqueItems) {
                    const data = {
                        companyName: item.companyName,
                        logoUrl: item.logoUrl,
                        time: item.time ?? null,
                        timestampUtc: item.timestampUtc,
                        timezone: item.timezone || 'America/New_York',
                        dateStatus: item.dateStatus,
                        reportTiming: item.reportTiming ?? null,
                        epsEstimate: item.epsEstimate,
                        revenueEstimate: item.revenueEstimate,
                        actualEps: item.actualEps,
                        actualRevenue: item.actualRevenue,
                        epsSurprise: item.epsSurprise,
                        revenueSurprise: item.revenueSurprise,
                        marketCap: item.marketCap,
                        earningsImpactScore: item.earningsImpactScore,
                        marketReaction: item.marketReaction ?? null,
                        source: 'TradingView Official Scanner',
                        isPublished: true,
                    };
                    const existingId = existingByKey.get(`${item.ticker.toUpperCase()}|${item.date}`);
                    if (existingId) {
                        await this.prisma.marketEarningsEvent.update({ where: { id: existingId }, data });
                        updated += 1;
                    } else {
                        await this.prisma.marketEarningsEvent.create({
                            data: {
                                ...data,
                                ticker: item.ticker,
                                date: item.date,
                                sourceType: 'AUTOMATIC',
                            },
                        });
                        created += 1;
                    }
                }
            }

            const durationMs = Date.now() - startTime;
            await this.prisma.calendarSyncLog.create({
                data: {
                    syncType: 'EARNINGS',
                    status: errors === 0 ? 'SUCCESS' : 'PARTIAL',
                    providerUsed: 'TradingView Official Scanner (NASDAQ/NYSE/AMEX)',
                    eventsProcessed: created + updated,
                    eventsFound: list.length,
                    eventsCreated: created,
                    eventsUpdated: updated,
                    duplicates: 0,
                    errorsCount: errors,
                    durationMs,
                },
            });

            this.logger.log(`TradingView earnings sync finished: ${created} creados, ${updated} actualizados, ${errors} errores en ${durationMs}ms`);
            return {
                success: true,
                eventsProcessed: created + updated,
                errors,
                count: list.length,
                durationMs,
            };
        } catch (err: any) {
            this.logger.error(`TradingView earnings sync error: ${err.message}`);
            return {
                success: false,
                eventsProcessed: 0,
                errors: 1,
                errorMessage: err.message,
            };
        }
    }

    /**
     * Sincroniza y actualiza los resultados reales de los balances ya reportados
     * (EPS real, ingresos reales y comparaciones con estimaciones del mismo período).
     * Se ejecuta automáticamente de Lunes a Viernes a las 11:00 AM hora local.
     */
    async syncReportedEarningsResults(): Promise<{ updated: number; errors: number }> {
        this.logger.log('[CalendarService] Sincronizando balances reportados...');
        let updated = 0;
        let errors = 0;

        try {
            const now = new Date();
            const todayStr = now.toISOString().substring(0, 10);
            const lookback = new Date(now);
            lookback.setDate(lookback.getDate() - 21);
            const lookbackStr = lookback.toISOString().substring(0, 10);

            const candidates = await this.prisma.marketEarningsEvent.findMany({
                where: {
                    isPublished: true,
                    date: { gte: lookbackStr, lte: todayStr },
                },
                orderBy: { date: 'desc' },
            });
            // Un balance AMC del mismo día aún no terminó. Para cada ticker se usa
            // solamente el reporte más reciente elegible, nunca todo su historial.
            const eventsByTicker = new Map<string, typeof candidates[number]>();
            for (const event of candidates) {
                if (event.sourceType === 'MANUAL') continue;
                const isReported = event.date < todayStr
                    || (event.date === todayStr && event.reportTiming === 'BMO');
                if (isReported && !eventsByTicker.has(event.ticker.toUpperCase())) {
                    eventsByTicker.set(event.ticker.toUpperCase(), event);
                }
            }
            const events = Array.from(eventsByTicker.values());

            if (events.length === 0) {
                return { updated: 0, errors: 0 };
            }

            const tickers = Array.from(new Set(events.map(e => e.ticker.toUpperCase())));
            const batchSize = 60;

            for (let i = 0; i < tickers.length; i += batchSize) {
                const chunk = tickers.slice(i, i + batchSize);
                const symbols = chunk.flatMap(t => [`NASDAQ:${t}`, `NYSE:${t}`]);

                try {
                    const res = await fetch('https://scanner.tradingview.com/america/scan', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        },
                        body: JSON.stringify({
                            symbols: { tickers: symbols },
                            columns: [
                                'name',
                                'earnings_per_share_fq',
                                'earnings_per_share_forecast_fq',
                                'revenue_fq',
                                'revenue_forecast_fq',
                                'earnings_release_date',
                                'change',
                            ],
                        }),
                        signal: AbortSignal.timeout(10000),
                    });

                    if (!res.ok) continue;

                    const json: any = await res.json();
                    if (!Array.isArray(json?.data)) continue;

                    for (const row of json.data) {
                        if (!row?.d) continue;
                        const symbolTicker = (row.d[0] || '').toUpperCase().trim();
                        if (!symbolTicker) continue;
                        const event = eventsByTicker.get(symbolTicker);
                        if (!event) continue;
                        // Never attach the previous quarter's numbers to an
                        // upcoming report just because its scheduled date passed.
                        const releaseEpoch = financialNumber(row.d[5]);
                        const releaseDate = releaseEpoch !== undefined && releaseEpoch > 0 ? new Date(releaseEpoch * 1000) : null;
                        if (!releaseDate || !Number.isFinite(releaseDate.getTime()) || releaseDate.toISOString().slice(0, 10) !== event.date) continue;

                        const actualEps = financialNumber(row.d[1]);
                        const forecastEps = financialNumber(row.d[2]);
                        const actualRevenue = financialNumber(row.d[3]);
                        const forecastRevenue = financialNumber(row.d[4]);
                        const marketReaction = financialNumber(row.d[6]);
                        const epsSurprise = earningsSurprise(actualEps, forecastEps);
                        const revenueSurprise = earningsSurprise(actualRevenue, forecastRevenue);
                        const updateData: any = {};
                        if (actualEps !== undefined) updateData.actualEps = actualEps;
                        if (actualRevenue !== undefined) updateData.actualRevenue = actualRevenue;
                        if (forecastEps !== undefined) updateData.epsEstimate = forecastEps;
                        if (forecastRevenue !== undefined) updateData.revenueEstimate = forecastRevenue;
                        if (actualEps !== undefined) updateData.epsSurprise = epsSurprise ?? null;
                        if (actualRevenue !== undefined) updateData.revenueSurprise = revenueSurprise ?? null;
                        if (marketReaction !== undefined) updateData.marketReaction = marketReaction;

                        if (Object.keys(updateData).length > 0) {
                            await this.prisma.marketEarningsEvent.update({
                                where: { id: event.id },
                                data: updateData,
                            });
                            updated += 1;
                        }
                    }
                } catch (e: any) {
                    errors++;
                    this.logger.warn(`[CalendarService] Error en lote de balances reportados: ${e.message}`);
                }
            }

            this.logger.log(`[CalendarService] Sincronización de balances reportados finalizada: ${updated} actualizados.`);
        } catch (err: any) {
            this.logger.error(`[CalendarService] Error en syncReportedEarningsResults: ${err.message}`);
            errors++;
        }

        return { updated, errors };
    }

    /**
     * Asegura la existencia de la tabla MarketDividendEvent si no existe
     */
    private async ensureDividendTable() {
        try {
            await this.prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "MarketDividendEvent" (
                    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
                    "assetId" TEXT,
                    "ticker" TEXT NOT NULL,
                    "companyName" TEXT NOT NULL,
                    "logoUrl" TEXT,
                    "exDate" TEXT NOT NULL,
                    "paymentDate" TEXT,
                    "recordDate" TEXT,
                    "declarationDate" TEXT,
                    "amount" DOUBLE PRECISION,
                    "yield" DOUBLE PRECISION,
                    "frequency" TEXT,
                    "marketCap" DOUBLE PRECISION,
                    "source" TEXT DEFAULT 'TradingView Official Scanner',
                    "sourceType" TEXT DEFAULT 'AUTOMATIC',
                    "isPublished" BOOLEAN DEFAULT true,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS "MarketDividendEvent_exDate_idx" ON "MarketDividendEvent"("exDate");
                CREATE INDEX IF NOT EXISTS "MarketDividendEvent_paymentDate_idx" ON "MarketDividendEvent"("paymentDate");
                CREATE INDEX IF NOT EXISTS "MarketDividendEvent_ticker_idx" ON "MarketDividendEvent"("ticker");
                CREATE INDEX IF NOT EXISTS "MarketDividendEvent_isPublished_idx" ON "MarketDividendEvent"("isPublished");
            `);
        } catch {
            // Ignore if already exists or permission
        }
    }

    /**
     * Sincroniza en tiempo real los dividendos del universo S&P 500 desde TradingView Scanner.
     * Incluye fecha de pago (cuándo pagan), fecha ex-dividend, monto en USD (cuánto pagan), yield y logo.
     */
    async syncTradingViewDividends() {
        const startTime = Date.now();
        this.logger.log(`Starting TradingView US dividends sync...`);

        try {
            await this.ensureDividendTable();

            const list = await this.providerService.fetchTradingViewSP500Dividends({
                forceRefresh: true,
            });

            let upserted = 0;
            let errors = 0;

            if (list.length > 0) {
                try {
                    const dataToInsert = list.map(item => ({
                        ticker: item.ticker,
                        companyName: item.companyName,
                        logoUrl: item.logoUrl,
                        exDate: item.exDate,
                        paymentDate: item.paymentDate,
                        recordDate: item.recordDate,
                        declarationDate: item.declarationDate,
                        amount: item.amount,
                        yield: item.yield,
                        frequency: item.frequency || 'Trimestral',
                        marketCap: item.marketCap,
                        source: 'TradingView Official Scanner',
                        sourceType: 'AUTOMATIC',
                        isPublished: true,
                    }));

                    for (const data of dataToInsert) {
                        const repo = (this.prisma as any).marketDividendEvent;
                        const existing = await repo.findFirst({
                            where: { ticker: data.ticker, exDate: data.exDate, ...(data.exDate ? {} : { paymentDate: data.paymentDate }), sourceType: 'AUTOMATIC' },
                        });
                        if (existing) {
                            await repo.update({ where: { id: existing.id }, data });
                        } else {
                            await repo.create({ data });
                        }
                        upserted++;
                    }
                } catch (dbErr: any) {
                    this.logger.warn(`Could not persist dividends directly to database: ${dbErr.message}. Utilizing cached provider data.`);
                    upserted = list.length;
                }
            }

            const durationMs = Date.now() - startTime;
            await this.prisma.calendarSyncLog.create({
                data: {
                    syncType: 'DIVIDENDS',
                    status: errors === 0 ? 'SUCCESS' : 'PARTIAL',
                    providerUsed: 'TradingView Official Scanner (S&P 500 Dividends)',
                    eventsProcessed: upserted,
                    eventsFound: list.length,
                    eventsCreated: upserted,
                    eventsUpdated: 0,
                    duplicates: 0,
                    errorsCount: errors,
                    durationMs,
                },
            }).catch(() => null);

            this.logger.log(`TradingView dividends sync finished: ${upserted} items in ${durationMs}ms`);
            return {
                success: true,
                eventsProcessed: upserted,
                errors,
                count: list.length,
                durationMs,
            };
        } catch (err: any) {
            this.logger.error(`TradingView dividends sync error: ${err.message}`);
            return {
                success: false,
                eventsProcessed: 0,
                errors: 1,
                errorMessage: err.message,
            };
        }
    }

    async getAdminOverview() {
        await this.ensureSourcesInitialized();

        const [
            totalEconomic,
            totalPublished,
            totalPending,
            totalCritical,
            earningsRes,
            sources,
            logs,
        ] = await Promise.all([
            this.prisma.marketCalendarEvent.count(),
            this.prisma.marketCalendarEvent.count({ where: { status: 'PUBLISHED' } }),
            this.prisma.marketCalendarEvent.count({ where: { status: 'PENDING_REVIEW' } }),
            this.prisma.marketCalendarEvent.count({ where: { impactScore: { gte: 90 } } }),
            this.getAdminEvents({ page: 1, limit: 100, type: 'EARNINGS' }),
            this.calendarSourceRepo.findMany({ orderBy: { priority: 'asc' } }),
            this.getSyncLogs(),
        ]);

        const recentEco = await this.getAdminEvents({ page: 1, limit: 50, type: 'ECONOMIC' });

        return {
            totalEconomic,
            totalPublished,
            totalPending,
            totalCritical,
            totalEarnings: earningsRes.total,
            recentEconomic: recentEco.items,
            recentEarnings: earningsRes.items,
            sources,
            syncLogs: logs,
        };
    }

    async getAdminEvents(params: {
        page?: number;
        limit?: number;
        country?: string;
        type?: 'ECONOMIC' | 'EARNINGS';
        category?: string;
        impact?: string;
        status?: string;
        source?: string;
        date?: string;
        range?: 'today' | 'week' | 'month' | 'all';
        search?: string;
        ticker?: string;
    }) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(500, params.limit || 50);
        const skip = (page - 1) * limit;

        if (params.type === 'EARNINGS') {
            const count = await this.prisma.marketEarningsEvent.count();
            if (count < 10) {
                await this.syncTradingViewEarnings();
            }

            const where: any = {};
            const todayStr = new Date().toISOString().substring(0, 10);

            if (params.date) {
                where.date = params.date === 'today' ? todayStr : params.date;
            } else if (params.range === 'today') {
                where.date = todayStr;
            } else if (params.range === 'week') {
                const now = new Date();
                const monday = this.getMondayOfWeek(now);
                const sunday = new Date(monday.getTime() + 6 * 24 * 3600 * 1000);
                where.date = {
                    gte: monday.toISOString().substring(0, 10),
                    lte: sunday.toISOString().substring(0, 10),
                };
            } else if (params.range === 'month') {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
                const end = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().substring(0, 10);
                where.date = { gte: start, lte: end };
            }

            if (params.search && params.search.trim()) {
                const term = params.search.trim();
                where.OR = [
                    { ticker: { contains: term, mode: 'insensitive' } },
                    { companyName: { contains: term, mode: 'insensitive' } },
                ];
            }

            const records = await this.prisma.marketEarningsEvent.findMany({
                where, orderBy: [{ date: 'asc' }, { earningsImpactScore: 'desc' }],
            });
            const available = records.filter(event => !isLegacyEarningsTemplate(event))
                .map(normalizeEarnings).filter(isVisibleEarnings);
            const total = available.length;
            return { items: available.slice(skip, skip + limit), total, page, limit, totalPages: Math.ceil(total / limit) };
        }

        // --- Economic / Market Calendar Filtering ---
        const where: any = {};

        if (params.country && params.country !== 'ALL') {
            where.country = params.country.toUpperCase();
        }

        if (params.category && params.category !== 'ALL') {
            where.category = params.category;
        }

        if (params.impact && params.impact !== 'ALL') {
            where.impact = params.impact.toUpperCase();
        }

        if (params.status && params.status !== 'ALL') {
            where.status = params.status.toUpperCase();
        }

        if (params.source && params.source !== 'ALL') {
            where.sourceName = { contains: params.source, mode: 'insensitive' };
        }

        if (params.ticker && params.ticker.trim()) {
            where.ticker = params.ticker.toUpperCase().trim();
        }

        const todayStr = new Date().toISOString().substring(0, 10);
        if (params.date) {
            where.date = params.date === 'today' ? todayStr : params.date;
        } else if (params.range === 'today') {
            where.date = todayStr;
        } else if (params.range === 'week') {
            const now = new Date();
            const monday = this.getMondayOfWeek(now);
            const sunday = new Date(monday.getTime() + 6 * 24 * 3600 * 1000);
            where.date = {
                gte: monday.toISOString().substring(0, 10),
                lte: sunday.toISOString().substring(0, 10),
            };
        } else if (params.range === 'month') {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
            const end = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().substring(0, 10);
            where.date = { gte: start, lte: end };
        }

        if (params.search && params.search.trim()) {
            const term = params.search.trim();
            where.OR = [
                { title: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
                { ticker: { contains: term, mode: 'insensitive' } },
                { companyName: { contains: term, mode: 'insensitive' } },
                { sourceName: { contains: term, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.marketCalendarEvent.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { date: 'desc' },
                    { impactScore: 'desc' },
                    { time: 'asc' },
                ],
            }),
            this.prisma.marketCalendarEvent.count({ where }),
        ]);

        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async createAdminManualEvent(dto: any) {
        if (dto.type === 'EARNINGS' || dto.eventType === 'EARNINGS') {
            const cleanTicker = (dto.ticker || '').toUpperCase().replace(/\./g, '-').trim();
            const score = dto.earningsImpactScore ?? this.earningsScoring.calculateEarningsImpactScore({
                ticker: cleanTicker,
                marketCap: dto.marketCap ? parseFloat(dto.marketCap) : undefined,
                isSP500: this.providerService.isSP500Constituent(cleanTicker),
            });

            const metrics = {
                epsEstimate: financialNumber(dto.epsEstimate), revenueEstimate: financialNumber(dto.revenueEstimate),
                actualEps: financialNumber(dto.actualEps), actualRevenue: financialNumber(dto.actualRevenue),
            };
            if (!isVisibleEarnings({ ...metrics, ticker: cleanTicker, date: dto.date })) {
                throw new BadRequestException('El balance necesita una fecha válida y al menos una cifra de EPS o facturación.');
            }
            return this.prisma.marketEarningsEvent.create({
                data: {
                    ticker: cleanTicker,
                    companyName: dto.companyName || cleanTicker,
                    logoUrl: dto.logoUrl || this.earningsScoring.getTradingViewLogoUrl(cleanTicker),
                    date: dto.date,
                    time: dto.time || null,
                    timestampUtc: new Date(`${dto.date}T${dto.time || '00:00'}:00Z`),
                    timezone: 'UTC',
                    dateStatus: dto.dateStatus || (metrics.actualEps !== undefined || metrics.actualRevenue !== undefined ? 'CONFIRMED' : 'ESTIMATED'),
                    reportTiming: dto.reportTiming || null,
                    ...metrics,
                    marketCap: financialNumber(dto.marketCap) ?? null,
                    earningsImpactScore: score,
                    source: dto.source || 'Admin Manual',
                    sourceType: 'MANUAL',
                    isPublished: true,
                },
            });
        }

        const country = (dto.country || 'US').toUpperCase().trim();
        const date = dto.date;
        const title = dto.title.trim();
        const ticker = dto.ticker ? dto.ticker.toUpperCase().trim() : undefined;

        const evalRes = this.marketScoring.evaluateEvent(title, country, ticker);
        const score = dto.impactScore ?? dto.marketImpactScore ?? evalRes.score;
        const impact = dto.impact || this.marketScoring.scoreToImpact(score);
        const category = dto.category || evalRes.category;
        const timezone = dto.timezone || (country === 'AR' ? 'America/Argentina/Buenos_Aires' : 'America/New_York');
        const fingerprint = this.marketScoring.generateFingerprint(country, date, title, ticker);

        const status = dto.status || 'PUBLISHED';
        const isPublished = status !== 'HIDDEN' && status !== 'DRAFT';

        return this.prisma.marketCalendarEvent.create({
            data: {
                eventType: dto.eventType || (ticker ? 'CORPORATE_EVENT' : 'ECONOMIC'),
                country,
                countryCode: country,
                currency: dto.currency || (country === 'AR' ? 'ARS' : 'USD'),
                title,
                description: dto.description,
                category,
                subcategory: dto.subcategory,
                importance: impact,
                impact,
                marketImpactScore: score,
                impactScore: score,
                date,
                time: dto.time || '12:00',
                timestampUtc: new Date(`${date}T${dto.time || '12:00'}:00Z`),
                timezone,
                previousValue: dto.previousValue,
                forecastValue: dto.forecastValue,
                consensusValue: dto.consensusValue,
                actualValue: dto.actualValue,
                unit: dto.unit,
                companyName: dto.companyName,
                ticker,
                affectedAssets: dto.affectedAssets ? JSON.stringify(dto.affectedAssets) : JSON.stringify(evalRes.affectedAssets),
                expectedMarketEffect: dto.expectedMarketEffect || evalRes.expectedEffect,
                source: dto.sourceName || dto.source || 'Admin Manual',
                sourceName: dto.sourceName || dto.source || 'Admin Manual',
                sourceUrl: dto.sourceUrl,
                sourceType: 'MANUAL',
                status,
                isManual: true,
                isAutomatic: false,
                isVerified: true,
                isPublished,
                eventFingerprint: fingerprint,
            },
        });
    }

    async updateAdminEvent(id: string, dto: any) {
        const eco = await this.prisma.marketCalendarEvent.findUnique({ where: { id } });
        if (eco) {
            const dataToUpdate: any = { ...dto };

            if (dto.impactScore !== undefined) {
                dataToUpdate.impact = this.marketScoring.scoreToImpact(dto.impactScore);
                dataToUpdate.importance = dataToUpdate.impact;
                dataToUpdate.marketImpactScore = dto.impactScore;
            } else if (dto.impact !== undefined) {
                dataToUpdate.importance = dto.impact;
            }

            if (dto.status !== undefined) {
                dataToUpdate.isPublished = dto.status === 'PUBLISHED' || dto.status === 'APPROVED';
            }

            if (dto.title || dto.date || dto.country) {
                const c = dto.country || eco.country;
                const d = dto.date || eco.date;
                const t = dto.title || eco.title;
                const tick = dto.ticker || eco.ticker;
                dataToUpdate.eventFingerprint = this.marketScoring.generateFingerprint(c, d, t, tick || undefined);
            }

            return this.prisma.marketCalendarEvent.update({
                where: { id },
                data: dataToUpdate,
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

    async getAdminSources() {
        await this.ensureSourcesInitialized();
        return this.calendarSourceRepo.findMany({
            orderBy: { priority: 'asc' },
        });
    }

    async createCalendarSource(dto: any) {
        const name = String(dto?.name || '').trim();
        const baseUrl = String(dto?.baseUrl || '').trim();
        const apiUrl = String(dto?.apiUrl || '').trim();
        if (!name) throw new Error('El nombre de la fuente es obligatorio');
        if (!baseUrl && !apiUrl) throw new Error('Ingresá la URL de la fuente');
        return this.calendarSourceRepo.create({
            data: {
                name,
                type: String(dto?.type || 'RSS').toUpperCase(),
                country: String(dto?.country || 'GLOBAL').toUpperCase(),
                baseUrl: baseUrl || null,
                apiUrl: apiUrl || null,
                priority: Math.min(10, Math.max(1, Number(dto?.priority) || 5)),
                isActive: dto?.isActive !== false,
            },
        });
    }

    async toggleSourceActive(id: string, isActive: boolean) {
        return this.calendarSourceRepo.update({
            where: { id },
            data: { isActive },
        });
    }

    async getSyncLogs() {
        return this.prisma.calendarSyncLog.findMany({
            take: 30,
            orderBy: { executedAt: 'desc' },
        });
    }

    async getEventById(id: string) {
        const eco = await this.prisma.marketCalendarEvent.findUnique({ where: { id } });
        if (eco) return eco;
        const earn = await this.prisma.marketEarningsEvent.findUnique({ where: { id } });
        if (earn && !isLegacyEarningsTemplate(earn) && isVisibleEarnings(earn)) return normalizeEarnings(earn);
        throw new NotFoundException('Evento no encontrado');
    }

    async getPublicEvents(params: {
        range?: 'today' | 'tomorrow' | 'week' | 'next_week' | 'month' | 'all';
        country?: string;
        category?: string;
        impact?: string;
        ticker?: string;
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(200, params.limit || 50);
        const skip = (page - 1) * limit;

        const where: any = {
            isPublished: true,
            status: { in: ['PUBLISHED', 'APPROVED'] },
        };

        if (params.country && params.country !== 'ALL' && params.country !== 'GLOBAL') {
            where.country = params.country.toUpperCase();
        }

        if (params.category && params.category !== 'ALL') {
            where.category = params.category;
        }

        if (params.impact && params.impact !== 'ALL') {
            where.impact = params.impact.toUpperCase();
        }

        if (params.ticker && params.ticker.trim()) {
            where.ticker = params.ticker.toUpperCase().trim();
        }

        const now = new Date();
        const todayStr = now.toISOString().substring(0, 10);

        if (params.range === 'today') {
            where.date = todayStr;
        } else if (params.range === 'tomorrow') {
            const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000).toISOString().substring(0, 10);
            where.date = tomorrow;
        } else if (params.range === 'week') {
            const monday = this.getMondayOfWeek(now);
            const sunday = new Date(monday.getTime() + 6 * 24 * 3600 * 1000);
            where.date = {
                gte: monday.toISOString().substring(0, 10),
                lte: sunday.toISOString().substring(0, 10),
            };
        } else if (params.range === 'next_week') {
            const nextMonday = new Date(this.getMondayOfWeek(now).getTime() + 7 * 24 * 3600 * 1000);
            const nextSunday = new Date(nextMonday.getTime() + 6 * 24 * 3600 * 1000);
            where.date = {
                gte: nextMonday.toISOString().substring(0, 10),
                lte: nextSunday.toISOString().substring(0, 10),
            };
        } else if (params.range === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().substring(0, 10);
            where.date = { gte: start, lte: end };
        }

        if (params.search && params.search.trim()) {
            const term = params.search.trim();
            where.OR = [
                { title: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
                { ticker: { contains: term, mode: 'insensitive' } },
                { companyName: { contains: term, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.marketCalendarEvent.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { date: 'asc' },
                    { impactScore: 'desc' },
                    { time: 'asc' },
                ],
            }),
            this.prisma.marketCalendarEvent.count({ where }),
        ]);

        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getPublicSources() {
        return this.calendarSourceRepo.findMany({
            where: { isActive: true },
            select: { id: true, name: true, type: true, country: true, baseUrl: true, priority: true, lastSyncAt: true },
            orderBy: { priority: 'asc' },
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
        // Use the same Argentina calendar date as the web, including weekends.
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit',
        }).formatToParts(d);
        const part = (type: string) => Number(parts.find(value => value.type === type)?.value);
        const date = new Date(Date.UTC(part('year'), part('month') - 1, part('day')));
        const day = date.getUTCDay();
        date.setUTCDate(date.getUTCDate() + (day === 0 ? -6 : 1 - day));
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
