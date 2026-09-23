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
