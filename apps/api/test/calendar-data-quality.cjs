// Run from apps/api: node -r ts-node/register/transpile-only test/calendar-data-quality.cjs
const assert = require('node:assert/strict');
const { CalendarProviderService } = require('../src/calendar/services/calendar-provider.service');
const { CalendarService } = require('../src/calendar/calendar.service');
const { MarketImpactScoringService } = require('../src/calendar/services/market-impact-scoring.service');
const { isLegacyEconomicTemplate, isLegacyEarningsTemplate } = require('../src/calendar/calendar-legacy-data');

async function main() {
    const macroTemplate = {
        id: 'template', country: 'US', title: 'Índice de Precios al Consumidor (IPC de EE.UU.)',
        date: '2026-10-02', time: '08:30', source: 'U.S. Bureau of Labor Statistics (BLS)',
        sourceType: 'AUTOMATIC', previousValue: '2.9%', consensusValue: '2.8%',
    };
    const earningsTemplate = {
        id: 'template-earnings', ticker: 'NVDA', companyName: 'NVIDIA',
        date: '2026-10-02', time: '18:00', epsEstimate: 0.74, revenueEstimate: 32.5,
        source: 'SEC EDGAR / Consensus', sourceType: 'AUTOMATIC', earningsImpactScore: 98,
    };
    assert.equal(isLegacyEconomicTemplate(macroTemplate), true);
    assert.equal(isLegacyEarningsTemplate(earningsTemplate), true);
    for (const change of [{ sourceType: 'MANUAL' }, { isManual: true }, { externalId: 'real' }, { sourceId: 'real' }, { actualValue: '0' }, { consensusValue: '2.7%' }]) {
        assert.equal(isLegacyEconomicTemplate({ ...macroTemplate, ...change }), false);
    }
    assert.equal(isLegacyEarningsTemplate({ ...earningsTemplate, actualEps: 0 }), false);
    assert.equal(isLegacyEarningsTemplate({ ...earningsTemplate, actualRevenue: 0 }), false);
    assert.equal(isLegacyEarningsTemplate({ ...earningsTemplate, sourceType: 'MANUAL' }), false);

    const originalFetch = global.fetch;
    const originalTimezone = process.env.TZ;
    process.env.TZ = 'America/Argentina/Buenos_Aires';
    try {
        const provider = new CalendarProviderService(new MarketImpactScoringService(), {}, {});
        provider.fmpApiKey = 'test-secret';
        let requests = 0;
        global.fetch = async url => {
            requests++;
            assert.equal(url.pathname, '/stable/economic-calendar');
            return { ok: true, json: async () => [
                { id: 'real-cpi', date: '2026-10-02 12:30:00', country: 'US', event: 'Consumer Price Index', previous: 0, estimate: 1, actual: 2, unit: '%' },
                { date: '2026-10-03', country: 'AR', event: 'Informe con horario pendiente' },
                { date: '2026-10-08 12:30:00', country: 'US', event: 'Outside range' },
                { country: 'US', event: 'Missing date' },
                null,
                { date: '2026-10-02 12:30:00', country: 'BR', event: 'Other country' },
            ] };
        };
        const live = await provider.getUpcomingEconomicEvents('2026-09-28', '2026-10-04');
        assert.equal(live.length, 2);
        assert.equal(live[0].timestampUtc.toISOString(), '2026-10-02T12:30:00.000Z');
        assert.equal(live[0].time, '12:30');
        assert.equal(live[0].previousValue, '0');
        assert.equal(live[0].actualValue, '2');
        assert.equal(live[0].unit, '%');
        assert.equal(live[0].surprise, 1);
        assert.equal(live[1].timestampUtc, undefined);
        assert.equal(live[1].time, undefined);
        assert.equal(provider.getEconomicFeedStatus('2026-09-28', '2026-10-04').status, 'READY');
        await provider.getUpcomingEconomicEvents('2026-09-28', '2026-10-04');
        assert.equal(requests, 1, 'Cached source responses must not hammer the provider');

        const manualMacro = { ...live[0], id: 'manual-macro', sourceType: 'MANUAL', actualValue: '9' };
        const manualEarnings = { ...earningsTemplate, id: 'manual-earnings', sourceType: 'MANUAL', epsEstimate: 1 };
        const source = {
            getUpcomingEconomicEvents: async () => live,
            getEconomicFeedStatus: () => ({ status: 'READY' }),
            fetchTradingViewSP500Earnings: async () => [],
            fetchTradingViewSP500Dividends: async () => [],
        };
        const service = new CalendarService({
            marketCalendarEvent: { findMany: async () => [macroTemplate, manualMacro] },
            marketEarningsEvent: { findMany: async () => [earningsTemplate, manualEarnings] },
        }, source, {}, { getTradingViewLogoUrl: () => '' });
        const week = await service.getWeekEvents({ weekStart: '2026-09-28', category: 'ALL', user: { plan: 'PRO', subscriptionStatus: 'ACTIVE' } });
        const macro = week.days.flatMap(day => day.economicEvents);
        const earnings = week.days.flatMap(day => day.earningsEvents);
        assert.equal(macro.length, 2);
        assert.equal(macro.find(event => event.id === 'manual-macro').actualValue, '9');
        assert.ok(macro.every(event => event.id !== 'template' && event.id));
        assert.equal(week.economicData.excludedLegacyEvents, 1);
        assert.equal(earnings.length, 1);
        assert.equal(earnings[0].id, 'manual-earnings');
        assert.equal(week.categories.all, 3);
        assert.equal(week.categories.us, 1);
        assert.equal(week.categories.ar, 1);
        const home = await service.getHomeEvents();
        assert.ok(home.events.every(event => !['template', 'template-earnings'].includes(event.id)));

        global.fetch = async () => ({ ok: false, status: 402 });
        assert.deepEqual(await provider.getUpcomingEconomicEvents('2026-10-05', '2026-10-11'), []);
        assert.deepEqual(provider.getEconomicFeedStatus('2026-10-05', '2026-10-11'), { status: 'UNAVAILABLE', httpStatus: 402 });
        source.getUpcomingEconomicEvents = async () => [];
        source.getEconomicFeedStatus = () => ({ status: 'UNAVAILABLE', httpStatus: 402 });
        const unavailable = await service.getWeekEvents({ weekStart: '2026-09-28', category: 'ALL', user: { plan: 'PRO' } });
        assert.equal(unavailable.economicData.status, 'UNAVAILABLE');
        assert.equal(unavailable.days.flatMap(day => day.economicEvents).length, 1, 'Keep verified manual records during provider outages');
        service.ensureSourcesInitialized = async () => {};
        let syncLog;
        service.prisma.calendarSyncLog = { create: async record => { syncLog = record.data; } };
        const sync = await service.syncMacroData('2026-09-28', '2026-10-04');
        assert.equal(sync.success, false, 'Source failures must not be reported as successful synchronization');
        assert.equal(syncLog.status, 'FAILED');
        console.log('Calendar data quality checks passed: legacy protection, real source merge, UTC times, zero values, cache and 402 status.');
    } finally {
        global.fetch = originalFetch;
        if (originalTimezone === undefined) delete process.env.TZ;
        else process.env.TZ = originalTimezone;
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
