import { Injectable, Logger } from '@nestjs/common';
import { financialNumber, isCalendarDate, isVisibleEarnings, normalizeEarnings, formatEconomicEventDescription } from '@finix/shared';
import {
    EconomicEventItem,
    EarningsEventItem,
    DividendEventItem,
    ICalendarProvider,
    IEarningsProvider,
    CalendarWeekResponse,
    EarningsReportTiming,
} from '../interfaces/calendar.interface';
import { MarketImpactScoringService } from './market-impact-scoring.service';
import { EarningsImpactScoringService } from './earnings-impact-scoring.service';
import { TV_SYMBOL_SLUGS } from '../../market-ranking/services/tv-slugs.const';
import { MarketDataProviderService } from '../../market-ranking/services/market-data-provider.service';

@Injectable()
export class CalendarProviderService implements ICalendarProvider, IEarningsProvider {
    private readonly logger = new Logger(CalendarProviderService.name);

    private readonly fmpApiKey = process.env.FMP_API_KEY || '';
    private readonly finnhubApiKey = process.env.FINNHUB_API_KEY || '';

    constructor(
        private readonly marketScoring: MarketImpactScoringService,
        private readonly earningsScoring: EarningsImpactScoringService,
        private readonly constituentsProvider: MarketDataProviderService,
    ) { }

    private constituentsCache: { tickers: Set<string>; fetchedAt: number } | null = null;

    private async getConstituentTickers(): Promise<string[]> {
        if (!this.constituentsCache || Date.now() - this.constituentsCache.fetchedAt > 86400000) {
            try {
                const companies = await this.constituentsProvider.getSP500Constituents();
                if (companies.length < 450) throw new Error('Incomplete constituent list');
                this.constituentsCache = {
                    tickers: new Set(companies.map(c => c.ticker.toUpperCase().replace(/\./g, '-'))),
                    fetchedAt: Date.now(),
                };
            } catch (error) {
                if (!this.constituentsCache) throw error;
                this.logger.warn('Using last available S&P 500 constituent list');
            }
        }
        return [...this.constituentsCache.tickers];
    }

    /**
     * Valida si un ticker pertenece exclusivamente al universo S&P 500.
     */
    isSP500Constituent(ticker: string): boolean {
        if (!ticker) return false;
        const clean = ticker.toUpperCase().replace(/\./g, '-').trim();
        return this.constituentsCache?.tickers.has(clean) ?? Boolean(TV_SYMBOL_SLUGS[clean]);
    }

    /**
     * TradingView expone el universo completo de acciones estadounidenses a
     * través del Scanner. Esto evita limitar el calendario a los componentes
     * del S&P 500 y permite mostrar todas las empresas con eventos publicados.
     */
    private async fetchTradingViewAmericaScan(columns: string[]): Promise<any[]> {
        const res = await fetch('https://scanner.tradingview.com/america/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
            body: JSON.stringify({
                filter: [{
                    left: 'exchange',
                    operation: 'in_range',
                    right: ['NASDAQ', 'NYSE', 'AMEX'],
                }],
                options: { lang: 'en' },
                markets: ['america'],
                symbols: { query: { types: [] }, tickers: [] },
                columns,
                sort: { sortBy: 'market_cap_basic', sortOrder: 'desc' },
                range: [0, 20000],
            }),
            signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) throw new Error(`TradingView Scanner: HTTP ${res.status}`);
        const json: any = await res.json();
        if (!Array.isArray(json?.data)) throw new Error('TradingView Scanner: invalid response');
        return json.data;
    }

    private economicCache = new Map<string, {
        events: EconomicEventItem[];
        status: NonNullable<CalendarWeekResponse['economicData']>;
        fetchedAt: number;
    }>();
    private economicRequests = new Map<string, Promise<EconomicEventItem[]>>();

    private economicCacheKey(from: string, to: string, countries: string[]): string {
        return JSON.stringify([from, to, [...countries].map(country => country.toUpperCase()).sort()]);
    }

    getEconomicFeedStatus(from: string, to: string, countries: string[] = ['US', 'AR']): NonNullable<CalendarWeekResponse['economicData']> {
        return this.economicCache.get(this.economicCacheKey(from, to, countries))?.status ??
            { status: 'UNAVAILABLE' as const };
    }

    /** Share requests and retain verified data if both sources temporarily fail. */
    async getUpcomingEconomicEvents(from: string, to: string, countries: string[] = ['US', 'AR']): Promise<EconomicEventItem[]> {
        const key = this.economicCacheKey(from, to, countries);
        const cached = this.economicCache.get(key);
        const ttl = cached?.status.status === 'READY' ? 5 * 60 * 1000 : 60 * 1000;
        if (cached && Date.now() - cached.fetchedAt < ttl) return cached.events;
        const pending = this.economicRequests.get(key);
        if (pending) return pending;
        const request = this.loadEconomicEvents(from, to, countries, key)
            .finally(() => this.economicRequests.delete(key));
        this.economicRequests.set(key, request);
        return request;
    }

    private async loadEconomicEvents(from: string, to: string, countries: string[], key: string): Promise<EconomicEventItem[]> {
        let status: NonNullable<CalendarWeekResponse['economicData']> = { status: 'UNAVAILABLE' };
        const sources: { name: string; url: URL; tradingView?: boolean }[] = [];
        if (this.fmpApiKey && !this.fmpApiKey.startsWith('REPLACE')) {
            const url = new URL('https://financialmodelingprep.com/stable/economic-calendar');
            url.search = new URLSearchParams({ from, to, apikey: this.fmpApiKey }).toString();
            sources.push({ name: 'Financial Modeling Prep', url });
        }
        const url = new URL('https://economic-calendar.tradingview.com/events');
        url.search = new URLSearchParams({
            from: from + 'T00:00:00.000Z', to: to + 'T23:59:59.999Z',
            countries: countries.map(country => country.toUpperCase()).join(','),
        }).toString();
        sources.push({ name: 'TradingView Economic Calendar', url, tradingView: true });

        for (const source of sources) {
            try {
                const response = await fetch(source.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; Finix-Calendar/1.0)',
                        Accept: 'application/json', Origin: 'https://www.tradingview.com',
                    },
                    signal: AbortSignal.timeout(10000),
                });
                if (!response.ok) {
                    status = { status: 'UNAVAILABLE', httpStatus: response.status };
                    throw new Error('HTTP ' + response.status);
                }
                const payload: any = await response.json();
                let data: any[];
                if (source.tradingView) {
                    if (payload?.status !== 'ok' || !Array.isArray(payload.result)) {
                        throw new Error('Invalid economic calendar response');
                    }
                    data = payload.result.map((item: any) => item && ({
                        ...item, event: item.title, estimate: item.forecast,
                        sourceUrl: item.source_url, description: item.comment,
                    }));
                } else {
                    if (!Array.isArray(payload)) throw new Error('Invalid economic calendar response');
                    data = payload;
                }
                const events = this.normalizeEconomicEvents(data, from, to, countries, source.name);
                status = { status: 'READY', source: source.name, updatedAt: new Date().toISOString() };
                this.economicCache.set(key, { events, status, fetchedAt: Date.now() });
                this.trimEconomicCache();
                return events;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                this.logger.warn(source.name + ' economic calendar unavailable: ' +
                    (this.fmpApiKey ? message.replaceAll(this.fmpApiKey, '[redacted]') : message));
            }
        }
        const previous = this.economicCache.get(key);
        const events = previous?.events ?? [];
        if (previous?.status.updatedAt) status.updatedAt = previous.status.updatedAt;
        if (previous?.status.source) status.source = previous.status.source;
        this.economicCache.set(key, { events, status, fetchedAt: Date.now() });
        this.trimEconomicCache();
        return events;
    }

    private trimEconomicCache(): void {
        if (this.economicCache.size > 20) this.economicCache.delete(this.economicCache.keys().next().value!);
    }

    /** Source dates are UTC; unavailable feeds never produce assumed events. */
    private normalizeEconomicEvents(data: any[], from: string, to: string, countries: string[], sourceName: string): EconomicEventItem[] {
        const events: EconomicEventItem[] = [];
        const countrySet = new Set(countries.map(country => country.toUpperCase()));
        for (const item of data) {
            if (!item || typeof item !== 'object') continue;
            const country = String(item.country || '').toUpperCase();
            if (!countrySet.has(country)) continue;
            const title = String(item.event || item.title || '').trim();
            const rawDate = String(item.date || '').trim().replace(' ', 'T');
            const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(rawDate);
            const timestamp = new Date(dateOnly ? rawDate + 'T00:00:00Z' :
                /(?:Z|[+-]\d{2}:\d{2})$/i.test(rawDate) ? rawDate : rawDate + 'Z');
            if (!title || !Number.isFinite(timestamp.getTime())) continue;
            const date = timestamp.toISOString().slice(0, 10);
            if (date < from || date > to || (dateOnly && date !== rawDate)) continue;
            const evaluation = this.marketScoring.evaluateEvent(title, country);
            const previousValue = item.previous != null && item.previous !== '' ? String(item.previous) : undefined;
            const consensusValue = item.estimate != null && item.estimate !== '' ? String(item.estimate) : undefined;
            const actualValue = item.actual != null && item.actual !== '' ? String(item.actual) : undefined;
            const actual = Number(actualValue);
            const estimate = Number(consensusValue);
            const comparable = actualValue != null && consensusValue != null &&
                Number.isFinite(actual) && Number.isFinite(estimate);
            const surprise = comparable ? Number((actual - estimate).toFixed(4)) : undefined;
            events.push({
                eventType: 'ECONOMIC', country, currency: item.currency || undefined, title,
                category: evaluation.category, importance: evaluation.importance,
                marketImpactScore: evaluation.score, date,
                time: dateOnly ? undefined : timestamp.toISOString().slice(11, 16),
                timestampUtc: dateOnly ? undefined : timestamp, timezone: 'UTC',
                previousValue, consensusValue, actualValue,
                unit: typeof item.unit === 'string' ? item.unit : undefined,
                surprise,
                surprisePercent: comparable && estimate !== 0 ?
                    Number(((actual - estimate) / Math.abs(estimate) * 100).toFixed(4)) : undefined,
                expectedMarketEffect: evaluation.expectedEffect,
                affectedAssets: evaluation.affectedAssets,
                externalId: item.id != null ? String(item.id) : undefined,
                source: sourceName, sourceName, sourceUrl: item.sourceUrl || undefined,
                description: formatEconomicEventDescription(title, item.description, country),
                sourceType: 'AUTOMATIC', isPublished: true,
            });
        }
        return events;
    }

    /**
     * Fuentes predefinidas del ecosistema Finix Market Calendar
     */
    getPredefinedSources() {
        return [
            {
                name: 'Federal Reserve (FOMC)',
                type: 'OFFICIAL',
                country: 'US',
                baseUrl: 'https://www.federalreserve.gov',
                apiUrl: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
                isActive: true,
                priority: 1,
            },
            {
                name: 'U.S. Bureau of Labor Statistics (BLS)',
                type: 'OFFICIAL',
                country: 'US',
                baseUrl: 'https://www.bls.gov',
                apiUrl: 'https://www.bls.gov/schedule/news_release/',
                isActive: true,
                priority: 1,
            },
            {
                name: 'U.S. Bureau of Economic Analysis (BEA)',
                type: 'OFFICIAL',
                country: 'US',
                baseUrl: 'https://www.bea.gov',
                apiUrl: 'https://www.bea.gov/news/schedule',
                isActive: true,
                priority: 1,
            },
            {
                name: 'U.S. Census Bureau',
                type: 'OFFICIAL',
                country: 'US',
                baseUrl: 'https://www.census.gov',
                apiUrl: 'https://www.census.gov/economic-indicators/calendar-listview.html',
                isActive: true,
                priority: 1,
            },
            {
                name: 'U.S. Department of the Treasury',
                type: 'OFFICIAL',
                country: 'US',
                baseUrl: 'https://home.treasury.gov',
                apiUrl: 'https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics',
                isActive: true,
                priority: 1,
            },
            {
                name: 'INDEC Argentina',
                type: 'OFFICIAL',
                country: 'AR',
                baseUrl: 'https://www.indec.gob.ar',
                apiUrl: 'https://www.indec.gob.ar/indec/web/Calendario-Fecha-0',
                isActive: true,
                priority: 1,
            },
            {
                name: 'Banco Central de la República Argentina (BCRA)',
                type: 'OFFICIAL',
                country: 'AR',
                baseUrl: 'https://www.bcra.gob.ar',
                apiUrl: 'https://www.bcra.gob.ar/PublicacionesEstadisticas/Relevamiento_Expectativas_de_Mercado.asp',
                isActive: true,
                priority: 1,
            },
            {
                name: 'TradingView Economic Calendar',
                type: 'TRADINGVIEW',
                country: 'GLOBAL',
                baseUrl: 'https://www.tradingview.com',
                apiUrl: 'https://www.tradingview.com/markets/world-economy/',
                isActive: true,
                priority: 3,
            },
            {
                name: 'Financial Modeling Prep (FMP)',
                type: 'FINANCIAL_API',
                country: 'GLOBAL',
                baseUrl: 'https://financialmodelingprep.com',
                apiUrl: 'https://financialmodelingprep.com/stable/economic-calendar',
                isActive: true,
                priority: 2,
            },
            {
                name: 'Corporate IR (Mega-Caps: Apple, Nvidia, Tesla, Microsoft, etc.)',
                type: 'CORPORATE_IR',
                country: 'US',
                baseUrl: 'https://investor.apple.com',
                apiUrl: 'https://investor.apple.com',
                isActive: true,
                priority: 1,
            },
        ];
    }

    private tvEarningsCache: { data: EarningsEventItem[]; fetchedAt: number } | null = null;

    /**
     * Consulta oficial a TradingView Scanner para obtener balances de todo el
     * universo de acciones de NASDAQ, NYSE y AMEX.
     */
    async fetchTradingViewSP500Earnings(options?: {
        targetDate?: string;
        from?: string;
        to?: string;
        forceRefresh?: boolean;
    }): Promise<EarningsEventItem[]> {
        const now = Date.now();
        const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

        let allEarnings: EarningsEventItem[] = [];

        if (!options?.forceRefresh && this.tvEarningsCache && (now - this.tvEarningsCache.fetchedAt < CACHE_TTL)) {
            allEarnings = this.tvEarningsCache.data;
        } else {
            try {
                const rows = await this.fetchTradingViewAmericaScan([
                    'name',
                    'description',
                    'earnings_release_next_date',
                    'earnings_release_next_time',
                    'earnings_per_share_forecast_next_fq',
                    'revenue_forecast_next_fq',
                    'market_cap_basic',
                    'logoid',
                    'earnings_release_date',
                    'earnings_per_share_fq',
                    'earnings_per_share_forecast_fq',
                    'revenue_fq',
                    'revenue_forecast_fq',
                    'change',
                ]);
                const fetchedByKey = new Map<string, EarningsEventItem>();
                const addEvent = (event: EarningsEventItem) => {
                    event = normalizeEarnings(event);
                    if (!isVisibleEarnings(event)) return;
                    const key = `${event.ticker.replace(/\./g, '-')}|${event.date}`;
                    const previous = fetchedByKey.get(key);
                    if (!previous || event.dateStatus === 'CONFIRMED') {
                        fetchedByKey.set(key, previous ? { ...previous, ...event } : event);
                    }
                };

                const releaseDate = (value: unknown): Date | undefined => {
                    const epoch = financialNumber(value);
                    if (epoch === undefined || epoch <= 0) return undefined;
                    const date = new Date(epoch * 1000);
                    return Number.isFinite(date.getTime()) && isCalendarDate(date.toISOString().slice(0, 10)) ? date : undefined;
                };
                for (const row of rows) {
                    if (!Array.isArray(row?.d)) continue;
                    const nextDate = releaseDate(row.d[2]);
                    const reportedDate = releaseDate(row.d[8]);
                    if (!nextDate && !reportedDate) continue;
                    const ticker = String(row.d[0] || row.s?.split(':').pop() || '').toUpperCase().trim();
                    if (!ticker) continue;
                    const marketCap = financialNumber(row.d[6]);
                    const logoid = row.d[7];
                    const marketReaction = financialNumber(row.d[13]);
                    const common = {
                        eventType: 'EARNINGS' as const, ticker,
                        companyName: String(row.d[1] || ticker),
                        logoUrl: logoid ? `https://s3-symbol-logo.tradingview.com/${logoid}--big.svg`
                            : this.earningsScoring.getTradingViewLogoUrl(ticker),
                        marketCap, timezone: 'America/New_York',
                        earningsImpactScore: this.earningsScoring.calculateEarningsImpactScore({
                            ticker, marketCap, isSP500: this.isSP500Constituent(ticker),
                        }),
                        source: 'TradingView Official Scanner (NASDAQ/NYSE/AMEX)',
                        sourceType: 'AUTOMATIC' as const, isPublished: true,
                    };
                    if (nextDate) {
                        const timeType = financialNumber(row.d[3]);
                        const reportTiming: EarningsReportTiming | undefined = timeType === -1 ? 'BMO'
                            : timeType === 1 ? 'AMC' : timeType === 0 ? 'DMH' : undefined;
                        addEvent({
                            ...common, date: nextDate.toISOString().slice(0, 10), timestampUtc: nextDate,
                            dateStatus: 'ESTIMATED', reportTiming,
                            epsEstimate: financialNumber(row.d[4]),
                            revenueEstimate: financialNumber(row.d[5]),
                            marketReaction,
                        });
                    }
                    if (reportedDate) {
                        addEvent({
                            ...common, date: reportedDate.toISOString().slice(0, 10), timestampUtc: reportedDate,
                            dateStatus: 'CONFIRMED',
                            actualEps: financialNumber(row.d[9]), epsEstimate: financialNumber(row.d[10]),
                            actualRevenue: financialNumber(row.d[11]), revenueEstimate: financialNumber(row.d[12]),
                            marketReaction,
                        });
                    }
                }

                const fetchedList = Array.from(fetchedByKey.values());

                fetchedList.sort((a, b) => a.date.localeCompare(b.date) || b.earningsImpactScore - a.earningsImpactScore);
                this.tvEarningsCache = { data: fetchedList, fetchedAt: now };
                allEarnings = fetchedList;
                this.logger.log(`Successfully fetched ${fetchedList.length} US earnings from TradingView Scanner.`);
            } catch (err: any) {
                this.logger.warn(`Failed to fetch TradingView US earnings: ${err.message}`);
                if (this.tvEarningsCache) {
                    allEarnings = this.tvEarningsCache.data;
                }
            }
        }

        // Filtrado
        if (options?.targetDate) {
            return allEarnings.filter(e => e.date === options.targetDate);
        }

        if (options?.from && options?.to) {
            const fromDate = options.from;
            const toDate = options.to;
            const filtered = allEarnings.filter(e => e.date >= fromDate && e.date <= toDate);
            return filtered;
        }

        return allEarnings;
    }

    private tvDividendsCache: { data: DividendEventItem[]; fetchedAt: number } | null = null;

    /**
     * Consulta oficial a TradingView Scanner para obtener dividendos del
     * universo S&P 500, con fechas ex-dividendo y de pago.
     */
    async fetchTradingViewSP500Dividends(options?: {
        from?: string;
        to?: string;
        forceRefresh?: boolean;
    }): Promise<DividendEventItem[]> {
        const now = Date.now();
        const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

        let allDividends: DividendEventItem[] = [];

        if (!options?.forceRefresh && this.tvDividendsCache && (now - this.tvDividendsCache.fetchedAt < CACHE_TTL)) {
            allDividends = this.tvDividendsCache.data;
        } else {
            try {
                const sp500Tickers = new Set(await this.getConstituentTickers());
                const rows = await this.fetchTradingViewAmericaScan([
                    'name',
                    'description',
                    'dps_common_stock_primary_issue',
                    'dividends_yield',
                    'dividend_amount_recent',
                    'dividend_ex_date_recent',
                    'dividend_payment_date_recent',
                    'market_cap_basic',
                    'logoid',
                    'dividend_amount_upcoming',
                    'dividend_ex_date_upcoming',
                    'dividend_payment_date_upcoming',
                ]);
                const fetchedByKey = new Map<string, DividendEventItem>();
                // Keep each distribution's amount paired with its dates.
                const distributions = rows.filter(row => row?.d).flatMap(row => {
                    const upcoming = [...row.d];
                    upcoming[4] = row.d[9];
                    upcoming[5] = row.d[10];
                    upcoming[6] = row.d[11];
                    return [row, { d: upcoming, s: row.s }];
                });

                for (const row of distributions) {
                    const ticker = String(row.d[0] || row.s?.split(':').pop() || '').toUpperCase().trim();
                    if (!ticker) continue;
                    const normalizedTicker = ticker.replace(/\./g, '-');
                    if (!sp500Tickers.has(normalizedTicker)) continue;

                    const companyName = row.d[1] || ticker;
                    const yieldVal = row.d[3] != null ? Number(row.d[3]) : undefined;
                    const amount = financialNumber(row.d[4]);
                    if (amount === undefined || amount < 0) continue;
                    const exTimestamp = Number(row.d[5]); // epoch seconds
                    const payTimestamp = Number(row.d[6]); // epoch seconds
                    const marketCap = row.d[7] != null ? Number(row.d[7]) : undefined;
                    const logoid = row.d[8];

                    const exDate = Number.isFinite(exTimestamp) && exTimestamp > 0
                        ? new Date(exTimestamp * 1000).toISOString().substring(0, 10) : undefined;
                    const paymentDate = Number.isFinite(payTimestamp) && payTimestamp > 0
                        ? new Date(payTimestamp * 1000).toISOString().substring(0, 10) : undefined;
                    if (!exDate && !paymentDate) continue;

                    const logoUrl = logoid
                        ? `https://s3-symbol-logo.tradingview.com/${logoid}--big.svg`
                        : this.earningsScoring.getTradingViewLogoUrl(ticker);
                    const event: DividendEventItem = {
                        eventType: 'DIVIDEND',
                        ticker,
                        companyName,
                        logoUrl,
                        exDate: exDate || '',
                        paymentDate,
                        amount: amount != null && Number.isFinite(amount) ? Number(amount.toFixed(4)) : undefined,
                        yield: yieldVal != null && Number.isFinite(yieldVal) ? Number(yieldVal.toFixed(2)) : undefined,
                        marketCap,
                        source: 'TradingView Official Scanner (S&P 500)',
                        sourceType: 'AUTOMATIC',
                        isPublished: true,
                    };
                    const key = `${ticker}|${event.exDate}|${event.paymentDate}|${event.amount ?? ''}`;
                    fetchedByKey.set(key, event);
                }

                const fetchedList = Array.from(fetchedByKey.values());

                fetchedList.sort((a, b) => {
                    const dateA = a.paymentDate || a.exDate;
                    const dateB = b.paymentDate || b.exDate;
                    return dateA.localeCompare(dateB) || ((b.marketCap || 0) - (a.marketCap || 0));
                });
                this.tvDividendsCache = { data: fetchedList, fetchedAt: now };
                allDividends = fetchedList;
                this.logger.log(`Successfully fetched ${fetchedList.length} S&P 500 dividends from TradingView Scanner.`);
            } catch (err: any) {
                this.logger.warn(`Failed to fetch TradingView S&P 500 dividends: ${err.message}`);
                if (this.tvDividendsCache) {
                    allDividends = this.tvDividendsCache.data;
                }
            }
        }

        if (options?.from && options?.to) {
            const fromDate = options.from;
            const toDate = options.to;
            const filtered = allDividends.filter(d => {
                const targetDate = d.paymentDate || d.exDate;
                return (d.paymentDate && d.paymentDate >= fromDate && d.paymentDate <= toDate) ||
                       (d.exDate && d.exDate >= fromDate && d.exDate <= toDate) ||
                       (targetDate >= fromDate && targetDate <= toDate);
            });
            return filtered;
        }

        return allDividends;
    }

    /**
     * Obtiene resultados corporativos (Earnings) de la semana para el
     * universo estadounidense consultado en TradingView.
     */
    async getUpcomingEarnings(from: string, to: string): Promise<EarningsEventItem[]> {
        return this.fetchTradingViewSP500Earnings({ from, to });
    }

    async getCompanyEarnings(symbol: string): Promise<EarningsEventItem | null> {
        const today = new Date().toISOString().substring(0, 10);
        const in30Days = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().substring(0, 10);
        const list = await this.getUpcomingEarnings(today, in30Days);
        return list.find(e => e.ticker === symbol.toUpperCase()) || null;
    }

    async getWeeklyEarnings(): Promise<EarningsEventItem[]> {
        const now = new Date();
        const monday = this.getMondayOfWeek(now);
        const friday = new Date(monday.getTime() + 4 * 24 * 3600 * 1000);
        return this.getUpcomingEarnings(
            monday.toISOString().substring(0, 10),
            friday.toISOString().substring(0, 10)
        );
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
}
