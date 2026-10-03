// Run from apps/api: node -r ts-node/register/transpile-only test/calendar-corporate.cjs
const assert = require('node:assert/strict');
const { CalendarProviderService } = require('../src/calendar/services/calendar-provider.service');
const { CalendarService } = require('../src/calendar/calendar.service');

async function main() {
    const provider = new CalendarProviderService({}, {
        calculateEarningsImpactScore: () => 90, getTradingViewLogoUrl: () => '',
    }, {});
    provider.constituentsCache = { tickers: new Set(['AAPL']), fetchedAt: Date.now() };
    const epoch = date => Date.parse(date + 'T12:00:00Z') / 1000;
    const values = {
        name: 'AAPL', description: 'Apple', market_cap_basic: 1000, logoid: 'apple',
        earnings_release_next_date: epoch('2026-10-29'), earnings_release_next_time: 1,
        earnings_release_date: epoch('2026-07-30'),
        earnings_per_share_forecast_next_fq: 1.98, revenue_forecast_next_fq: 113e9,
        earnings_per_share_fq: 2, earnings_per_share_forecast_fq: 1.6,
        revenue_fq: 100e9, revenue_forecast_fq: 80e9,
        dividend_amount_recent: 0.25, dividend_ex_date_recent: epoch('2026-08-10'),
        dividend_payment_date_recent: epoch('2026-08-13'),
        dividend_amount_upcoming: 0.27, dividend_ex_date_upcoming: epoch('2026-11-10'),
        dividend_payment_date_upcoming: epoch('2026-11-13'),
    };
    const originalFetch = global.fetch;
    let calls = 0;
    global.fetch = async (_url, init) => {
        calls++;
        const { columns } = JSON.parse(init.body);
        return { ok: true, json: async () => ({ data: [{ d: columns.map(c => values[c] ?? null) }] }) };
    };
    try {
        const events = await provider.fetchTradingViewSP500Earnings({ forceRefresh: true });
        const upcoming = events.find(e => e.date === '2026-10-29');
        const reported = events.find(e => e.date === '2026-07-30');
        assert.equal(upcoming.epsEstimate, 1.98);
        assert.equal(upcoming.actualEps, undefined);
        assert.equal(upcoming.dateStatus, 'ESTIMATED');
        assert.equal(reported.actualEps, 2);
        assert(Math.abs(reported.epsSurprise - 25) < 1e-9);
        assert.equal(reported.revenueSurprise, 25);
        await provider.fetchTradingViewSP500Earnings({ forceRefresh: true });
        assert.equal(calls, 2, 'Reload must bypass the provider cache');
        const dividends = await provider.fetchTradingViewSP500Dividends({ forceRefresh: true });
        assert.deepEqual(dividends.map(d => [d.exDate, d.paymentDate, d.amount]), [
            ['2026-08-10', '2026-08-13', 0.25], ['2026-11-10', '2026-11-13', 0.27],
        ]);
        const service = new CalendarService({
            marketEarningsEvent: {
                findMany: async () => [{ ...reported, id: 'stored-report', actualEps: null, epsEstimate: 99 }],
            },
        }, provider, {}, { getTradingViewLogoUrl: () => '' });
        service.syncTradingViewEarnings = async () => { throw new Error('Page load must not wait for DB synchronization'); };
        const week = await service.getWeekEvents({ weekStart: '2026-07-27', category: 'EARNINGS' });
        const visibleReport = week.days.flatMap(day => day.earningsEvents)[0];
        assert.equal(visibleReport.id, 'stored-report');
        assert.equal(visibleReport.actualEps, 2, 'Live results must replace stale database values');
        assert.equal(visibleReport.epsEstimate, 1.6);
        const upcomingWeek = await service.getWeekEvents({ weekStart: '2026-10-26', category: 'EARNINGS' });
        const liveUpcoming = upcomingWeek.days.flatMap(day => day.earningsEvents).find(event => event.date === '2026-10-29');
        assert.equal(liveUpcoming.id, 'earnings-AAPL-2026-10-29');
        assert.equal(liveUpcoming.time, undefined, 'A timing category is not an exact release time');

        const distributions = [
            { ticker: 'AAPL', companyName: 'Apple', exDate: '2026-10-06', paymentDate: '2026-10-07', amount: 0 },
            { ticker: 'AAPL', companyName: 'Apple', exDate: '2026-10-08', paymentDate: '2026-10-09', amount: 0.3 },
        ];
        const completeProvider = {
            getUpcomingEconomicEvents: async () => [],
            getEconomicFeedStatus: () => ({ status: 'READY' }),
            fetchTradingViewSP500Earnings: async () => [{ ...reported, ticker: 'aapl', date: '2026-10-06', time: undefined }],
            fetchTradingViewSP500Dividends: async () => distributions,
        };
        const completeService = new CalendarService({
            marketCalendarEvent: { findMany: async () => [{ id: 'macro', country: 'AR', title: 'IPC', date: '2026-10-06', unit: '%', previousValue: '0', forecastValue: '1', source: 'Manual', sourceUrl: 'https://example.test' }] },
            marketEarningsEvent: { findMany: async () => [{ ...reported, ticker: 'AAPL', id: 'existing', date: '2026-10-06', time: '18:00', actualEps: 0 }] },
            marketDividendEvent: { findMany: async () => [{ ...distributions[0], id: 'existing-dividend' }, { ...distributions[0], ticker: 'aapl', id: 'duplicate' }] },
        }, completeProvider, {}, { getTradingViewLogoUrl: () => '' });
        const fullWeek = await completeService.getWeekEvents({ weekStart: '2026-10-05', category: 'ALL', user: { plan: 'PRO', subscriptionStatus: 'ACTIVE' } });
        const fullEarnings = fullWeek.days.flatMap(day => day.earningsEvents);
        const fullDividends = fullWeek.days.flatMap(day => day.dividendEvents);
        assert.equal(fullEarnings.length, 1, 'Normalized tickers must merge live and stored results');
        assert.equal(fullEarnings[0].id, 'existing');
        assert.equal(fullEarnings[0].actualEps, 2);
        assert.equal(fullEarnings[0].time, undefined, 'Scanner records must not expose previously assumed release times');
        assert.equal(fullDividends.length, 2, 'Distinct distributions of one company must not disappear');
        assert.equal(fullWeek.categories.dividends, 2);
        assert.equal(fullDividends[0].amount, 0);
        assert.equal(fullDividends[0].id, 'existing-dividend');
        assert.equal(fullDividends[1].id, 'dividend-AAPL-2026-10-08-2026-10-09-0.3');
        assert.equal(new Set(fullDividends.map(event => event.id)).size, 2);
        const macro = fullWeek.days.flatMap(day => day.economicEvents)[0];
        assert.equal(macro.unit, '%');
        assert.equal(macro.forecastValue, '1');
        assert.equal(macro.previousValue, '0');
        assert.equal(macro.sourceUrl, 'https://example.test');

        const qualityRows = [
            { ...values, name: 'EMPTY', earnings_per_share_forecast_next_fq: null, revenue_forecast_next_fq: null, earnings_per_share_fq: null, earnings_per_share_forecast_fq: null, revenue_fq: null, revenue_forecast_fq: null },
            { ...values, name: 'BAD', earnings_per_share_forecast_next_fq: '', revenue_forecast_next_fq: 'unknown', earnings_per_share_fq: '', earnings_per_share_forecast_fq: null, revenue_fq: 'Infinity', revenue_forecast_fq: null },
            { ...values, name: 'ZERO', earnings_per_share_forecast_next_fq: 0, revenue_forecast_next_fq: null, earnings_release_date: null },
            { ...values, name: 'LOSS', earnings_release_next_date: null, earnings_per_share_fq: -1, earnings_per_share_forecast_fq: -2, revenue_fq: null, revenue_forecast_fq: null },
            { ...values, name: 'PARTIAL', earnings_per_share_forecast_next_fq: null, revenue_forecast_next_fq: 10e6, earnings_release_date: null, earnings_release_next_time: '' },
            { ...values, name: 'BADDATE', earnings_release_next_date: 1e300, earnings_release_date: 'invalid' },
        ];
        global.fetch = async (_url, init) => {
            const { columns } = JSON.parse(init.body);
            return { ok: true, json: async () => ({ data: qualityRows.map(row => ({ d: columns.map(column => row[column] ?? null) })) }) };
        };
        const qualityEvents = await provider.fetchTradingViewSP500Earnings({ forceRefresh: true });
        assert.deepEqual(qualityEvents.map(event => event.ticker).sort(), ['LOSS', 'PARTIAL', 'ZERO']);
        assert.equal(qualityEvents.find(event => event.ticker === 'ZERO').epsEstimate, 0);
        assert.equal(qualityEvents.find(event => event.ticker === 'LOSS').epsSurprise, 50);
        assert.equal(qualityEvents.find(event => event.ticker === 'PARTIAL').reportTiming, undefined);

        const storedRows = [
            { ...reported, id: 'empty', ticker: 'EMPTY', actualEps: null, actualRevenue: null, epsEstimate: null, revenueEstimate: null },
            { ...reported, id: 'zero', ticker: 'ZERO', actualEps: 0, actualRevenue: null, epsEstimate: null, revenueEstimate: null, epsSurprise: 99 },
            { ...reported, id: 'partial', ticker: 'PARTIAL', actualEps: null, actualRevenue: null, epsEstimate: null, revenueEstimate: 10e6 },
        ];
        const qualityService = new CalendarService({ marketCalendarEvent: { findUnique: async () => null }, marketEarningsEvent: {
            count: async () => 100,
            findMany: async () => storedRows,
            findUnique: async () => storedRows[0],
        } }, {
            fetchTradingViewSP500Earnings: async () => [],
            fetchTradingViewSP500Dividends: async () => [],
        }, {}, { getTradingViewLogoUrl: () => '' });
        const qualityWeek = await qualityService.getWeekEvents({ weekStart: '2026-07-27', category: 'EARNINGS' });
        assert.equal(qualityWeek.categories.earnings, 2, 'Counts exclude balances without financial information');
        assert.equal(qualityWeek.days.flatMap(day => day.earningsEvents).find(event => event.id === 'zero').epsSurprise, undefined);
        qualityService.providerService.getUpcomingEconomicEvents = async () => [];
        qualityService.prisma.marketCalendarEvent.findMany = async () => [];
        const qualityHome = await qualityService.getHomeEvents();
        assert.ok(qualityHome.events.every(event => event.id !== 'empty'));
        assert.equal(qualityHome.events[0].actualEps, 0, 'Home uses the same available financial information');
        assert.equal(qualityHome.events[0].timingLabel, 'Horario pendiente');

        const adminPage1 = await qualityService.getAdminEvents({ type: 'EARNINGS', page: 1, limit: 1 });
        const adminPage2 = await qualityService.getAdminEvents({ type: 'EARNINGS', page: 2, limit: 1 });
        assert.equal(adminPage1.total, 2);
        assert.equal(adminPage1.totalPages, 2);
        assert.equal(adminPage1.items[0].id, 'zero');
        assert.equal(adminPage2.items[0].id, 'partial', 'Pagination must apply after suppressing unavailable balances');
        await assert.rejects(qualityService.getEventById('empty'), error => error.getStatus() === 404);

        let manualData;
        const manualService = new CalendarService({ marketEarningsEvent: { create: async ({ data }) => { manualData = data; return data; } } },
            { isSP500Constituent: () => false }, {}, { calculateEarningsImpactScore: () => 50, getTradingViewLogoUrl: () => '' });
        await assert.rejects(manualService.createAdminManualEvent({ type: 'EARNINGS', ticker: 'ABC', date: '2026-10-02', epsEstimate: '' }));
        await manualService.createAdminManualEvent({ type: 'EARNINGS', ticker: 'ABC', date: '2026-10-02', epsEstimate: 0 });
        assert.equal(manualData.epsEstimate, 0);
        assert.equal(manualData.time, null);
        assert.equal(manualData.reportTiming, null);

        global.fetch = async () => ({ ok: true, json: async () => ({ data: [] }) });
        await provider.fetchTradingViewSP500Earnings({ forceRefresh: true });
        assert.deepEqual(await provider.getUpcomingEarnings('2026-10-05', '2026-10-11'), [], 'An empty provider response must not produce invented earnings');
        assert.deepEqual(await provider.fetchTradingViewSP500Dividends({ forceRefresh: true }), []);
        assert.deepEqual(await provider.fetchTradingViewSP500Dividends(), [], 'Successful empty results must clear old dividend cache');
        provider.fmpApiKey = '';
        assert.deepEqual(await provider.getUpcomingEconomicEvents('2026-10-05', '2026-10-11'), [], 'No configured macro feed must not produce assumed events');
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const oldDate = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
        const updates = [];
        const resultService = new CalendarService({ marketEarningsEvent: {
            findMany: async () => [
                { id: 'latest', ticker: 'AAPL', date: yesterday, sourceType: 'AUTOMATIC', epsEstimate: 99 },
                { id: 'old', ticker: 'AAPL', date: oldDate, sourceType: 'AUTOMATIC' },
                { id: 'mismatched', ticker: 'BAD', date: yesterday, sourceType: 'AUTOMATIC' },
                { id: 'manual', ticker: 'MANUAL', date: yesterday, sourceType: 'MANUAL' },
            ],
            update: async record => { updates.push(record); return record; },
        } }, {}, {}, {});
        global.fetch = async (_url, init) => {
            const { columns } = JSON.parse(init.body);
            const rows = [
                { name: 'AAPL', earnings_release_date: epoch(yesterday), earnings_per_share_fq: 0, earnings_per_share_forecast_fq: 1, revenue_fq: 0, revenue_forecast_fq: 10, change: 99 },
                { name: 'BAD', earnings_release_date: epoch(oldDate), earnings_per_share_fq: 2 },
                { name: 'MANUAL', earnings_release_date: epoch(yesterday), earnings_per_share_fq: 5 },
            ];
            return { ok: true, json: async () => ({ data: rows.map(row => ({ d: columns.map(column => row[column] ?? null) })) }) };
        };
        const resultSync = await resultService.syncReportedEarningsResults();
        assert.equal(resultSync.updated, 1, 'Only the matching latest automatic report is updated');
        assert.equal(updates[0].where.id, 'latest');
        assert.equal(updates[0].data.actualEps, 0);
        assert.equal(updates[0].data.epsEstimate, 1);
        assert.equal(updates[0].data.epsSurprise, -100);
        assert.equal(updates[0].data.revenueSurprise, -100);
        assert.equal(updates[0].data.marketReaction, undefined, 'A daily quote is not a measured earnings reaction');

        let syncs = 0;
        provider.fetchTradingViewSP500Earnings = async () => { syncs++; await new Promise(resolve => setImmediate(resolve)); return []; };
        await Promise.all([service.refreshCorporateEvents('EARNINGS'), service.refreshCorporateEvents('EARNINGS')]);
        assert.equal(syncs, 1);
        await service.refreshCorporateEvents('EARNINGS');
        assert.equal(syncs, 2);
        console.log('Corporate calendar regression checks passed');
    } finally {
        global.fetch = originalFetch;
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
