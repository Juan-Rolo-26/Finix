const assert = require('node:assert/strict');
const { CalendarService } = require('/home/juampi26/Finix/apps/api/src/calendar/calendar.service');
const { CalendarProviderService } = require('/home/juampi26/Finix/apps/api/src/calendar/services/calendar-provider.service');
const earnings = { ticker: 'AAPL', companyName: 'Apple', eventType: 'EARNINGS', date: '2026-10-06', source: 'TradingView', earningsImpactScore: 90, epsEstimate: 2, revenueEstimate: 100, actualEps: 3 };
const distribution = { ticker: 'AAPL', companyName: 'Apple', exDate: '2026-10-06', paymentDate: '2026-10-09', amount: .3, source: 'TradingView' };
async function main() {
    let liveEarnings = [earnings, { ...earnings, ticker: 'aapl' }];
    let liveDividends = [distribution, { ...distribution, ticker: 'aapl', amount: .3 },
        { ...distribution, ticker: 'NOEX', exDate: '', paymentDate: '2026-10-06' },
        { ...distribution, ticker: 'PAYONLY', exDate: '2026-09-30', paymentDate: '2026-10-06' },
        { ...distribution, ticker: 'ZERO', amount: 0 }];
    const stored = [{ ...earnings, id: 'manual', source: 'Other source', sourceType: 'MANUAL', actualEps: 99, actualRevenue: 999, marketReaction: 8 },
        { ...earnings, id: 'orphan', ticker: 'OLD', date: '2026-10-07' }];
    const service = new CalendarService({
        marketCalendarEvent: { findMany: async () => [], findUnique: async () => null },
        marketEarningsEvent: { findMany: async () => stored, findUnique: async () => stored[0] },
        marketDividendEvent: { findMany: async () => [{ ...distribution, amount: .2, source: 'Manual', id: 'div' }] },
    }, {
        isSP500Constituent: () => true,
        fetchTradingViewSP500Earnings: async () => liveEarnings,
        fetchTradingViewSP500Dividends: async () => liveDividends,
        getUpcomingEconomicEvents: async () => [], getEconomicFeedStatus: () => ({ status: 'READY' }),
    }, {}, { getTradingViewLogoUrl: () => '' });
    const week = await service.getWeekEvents({ weekStart: '2026-10-05' });
    const reports = week.days.flatMap(day => day.earningsEvents);
    const divs = week.days.flatMap(day => day.dividendEvents);
    assert.equal(reports.length, 1);
    assert.equal(reports[0].actualEps, 3);
    assert.equal(reports[0].actualRevenue, undefined);
    assert.equal(reports[0].marketReaction, undefined);
    assert.equal(reports[0].source, 'TradingView');
    assert.equal(divs.length, 1);
    assert.equal(divs[0].amount, .3);
    assert.equal(week.days.find(day => day.date === '2026-10-06').dividendEvents.length, 1);
    assert.equal(week.days.find(day => day.date === '2026-10-09').dividendEvents.length, 0);
    assert.equal(week.categories.dividends, 1);
    assert.equal((await service.getEventById('manual')).actualRevenue, undefined);
    liveEarnings = [earnings, { ...earnings, date: '2027-01-06', actualEps: undefined }];
    assert.equal((await service.getWeekEvents({ weekStart: 'ALL', category: 'EARNINGS' })).categories.earnings, 2);
    liveEarnings = []; liveDividends = [];
    const empty = await service.getWeekEvents({ weekStart: '2026-10-05' });
    assert.equal(empty.categories.earnings, 0);
    assert.equal(empty.categories.dividends, 0);
    await assert.rejects(service.getEventById('manual'), error => error.getStatus() === 404);
    const originalFetch = global.fetch;
    const provider = new CalendarProviderService({}, { getTradingViewLogoUrl: () => '' }, {});
    provider.constituentsCache = { tickers: new Set(['AAPL', 'NOEX', 'BAD', 'ZERO']), fetchedAt: Date.now() };
    const epoch = date => Date.parse(date + 'T00:00:00Z') / 1000;
    try {
        global.fetch = async (_, init) => {
            const { columns } = JSON.parse(init.body);
            const rows = [{ name: 'AAPL', dividend_amount_recent: .2, dividend_ex_date_recent: epoch('2026-10-06'), dividend_payment_date_recent: epoch('2026-10-09'), dividend_amount_upcoming: .3, dividend_ex_date_upcoming: epoch('2026-10-06'), dividend_payment_date_upcoming: epoch('2026-10-10') },
                { name: 'NOEX', dividend_amount_recent: .3, dividend_payment_date_recent: epoch('2026-10-06') },
                { name: 'BAD', dividend_amount_recent: .3, dividend_ex_date_recent: 1e300 },
                { name: 'ZERO', dividend_amount_recent: 0, dividend_ex_date_recent: epoch('2026-10-06') }];
            return { ok: true, json: async () => ({ data: rows.map(row => ({ d: columns.map(c => row[c] ?? null) })) }) };
        };
        const dividends = await provider.fetchTradingViewSP500Dividends({ forceRefresh: true });
        assert.equal(dividends.length, 1);
        assert.equal(dividends[0].amount, .3);
        assert.equal(dividends[0].paymentDate, '2026-10-10');
        assert.equal((await provider.fetchTradingViewSP500Dividends({ from: '2026-10-09', to: '2026-10-11' })).length, 0);
    } finally { global.fetch = originalFetch; }
    console.log('PASS: strict TradingView source, same-release data, no duplicates, ex-date only, corrections, invalid dates, zero/no-ex exclusion, distinct quarters and empty feed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
