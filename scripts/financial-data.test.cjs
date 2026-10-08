// Run after building @finix/shared: node --test scripts/financial-data.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { financialNumber, isVisibleEarnings, normalizeEarnings, formatFinancialAmount } = require('../packages/shared/dist');

test('FMP stable endpoints preserve fiscal years and zero ratios without confusing P/E with PEG', async () => {
    const nativeFetch = global.fetch;
    const { AdapterFMPService } = require('../apps/api/dist/fundamental/adapters/adapter-fmp.service');
    const adapter = new AdapterFMPService();
    adapter.apiKey = 'isolated-test-key';
    adapter.baseUrl = 'https://financialmodelingprep.com/stable';
    const calls = [];
    global.fetch = async input => {
        const url = new URL(input); calls.push(url);
        const data = {
            '/stable/profile': [{ companyName: 'Example', marketCap: 1000 }],
            '/stable/ratios': [{ priceToEarningsRatio: 0, priceToEarningsGrowthRatio: 99, debtToEquityRatio: 0 }],
            '/stable/key-metrics': [{ returnOnEquity: 0, returnOnInvestedCapital: 0 }],
            '/stable/income-statement': [{ date: '2025-12-31', fiscalYear: 2025, revenue: 100, netIncome: 5 }],
            '/stable/balance-sheet-statement': [{ date: '2025-12-31', fiscalYear: 2025, totalDebt: 50, totalStockholdersEquity: 100 }],
            '/stable/cash-flow-statement': [{ date: '2025-12-31', fiscalYear: 2025, freeCashFlow: 10 }],
            '/stable/earnings': [{ date: '2025-12-31', epsActual: 0, epsEstimated: 1 }],
        };
        assert.ok(url.pathname in data, 'Uses documented stable endpoint');
        assert.equal(url.searchParams.get('symbol'), 'AAPL');
        if (url.pathname !== '/stable/profile') assert.equal(url.searchParams.get('limit'), '5', 'Current provider subscription permits five periods');
        return new Response(JSON.stringify(data[url.pathname]), { headers: { 'content-type': 'application/json' } });
    };
    try {
        const result = await adapter.fetchFundamentals({ normalizedTicker: 'AAPL', assetType: 'stock' });
        assert.equal(calls.length, 7);
        assert.equal(result.metrics.peRatio, 0);
        assert.equal(result.metrics.roe, 0);
        assert.equal(result.metrics.roic, 0);
        assert.equal(result.metrics.debtToEquity, 0);
        assert.equal(result.statements.incomeStatement[0].fiscalYear, 2025);
        assert.equal(result.statements.earnings[0].actualEps, 0);
        global.fetch = async () => new Response('[]', { headers: { 'content-type': 'application/json' } });
        await assert.rejects(adapter.fetchFundamentals({ normalizedTicker: 'EMPTY' }), /sin datos/);
    } finally { global.fetch = nativeFetch; }
});

test('missing and malformed financial values are not coerced into zero', () => {
    for (const value of [null, undefined, '', ' ', NaN, Infinity, -Infinity, true, false, [], {}, 'unknown', '1e999']) {
        assert.equal(financialNumber(value), undefined);
        assert.equal(isVisibleEarnings({ ticker: 'ABC', date: '2026-10-02', epsEstimate: value }), false);
    }
    for (const value of [0, '0', -2, '-2', 100e9]) assert.equal(financialNumber(value), Number(value));
    assert.equal(isVisibleEarnings({ ticker: 'ABC', date: '2026-10-02', actualEps: 0 }), true);
    assert.equal(isVisibleEarnings({ ticker: 'ABC', date: '2026-02-30', actualEps: 2 }), false);
    assert.equal(isVisibleEarnings({ ticker: '', date: '2026-10-02', actualEps: 2 }), false);
});

test('comparisons use the displayed numbers and require a nonzero estimate', () => {
    const result = normalizeEarnings({ actualEps: -1, epsEstimate: -2, actualRevenue: 100e9, revenueEstimate: 80e9, epsSurprise: -99, revenueSurprise: -99 });
    assert.equal(result.epsSurprise, 50);
    assert.equal(result.revenueSurprise, 25);
    assert.equal(normalizeEarnings({ actualEps: 2, epsEstimate: 0, epsSurprise: 99 }).epsSurprise, undefined);
    assert.equal(normalizeEarnings({ actualEps: null, epsSurprise: 99 }).epsSurprise, undefined);
    assert.equal(normalizeEarnings({ sourceType: 'AUTOMATIC', marketReaction: 5 }).marketReaction, undefined);
    assert.equal(normalizeEarnings({ sourceType: 'MANUAL', marketReaction: 0 }).marketReaction, 0);
});

test('amounts retain their scale, losses and real zeros', () => {
    assert.equal(formatFinancialAmount(113e9), '$113.00B');
    assert.equal(formatFinancialAmount(-2.5e6), '$-2.50M');
    assert.equal(formatFinancialAmount(0), '$0.00');
    assert.equal(formatFinancialAmount(null), '');
});

test('financial statements omit empty periods and keep zero results and reported currencies', () => {
    const { buildNormalizedResponse } = require('../apps/api/dist/fundamental/normalizers/fundamental.normalizer');
    const response = buildNormalizedResponse({
        inputTicker: 'ABC', resolved: { normalizedTicker: 'ABC' },
        payload: { instrument: {}, metrics: { peRatio: 0, roe: NaN, marketCap: '' }, statements: {
            incomeStatement: [
                { date: '2026-09-30', currency: 'USD', revenue: null },
                { date: '2026-06-30', currency: 'EUR', revenue: 0, netIncome: -10 },
                { date: '2026-02-30', currency: 'USD', revenue: 100 },
            ],
            balanceSheet: [{ date: '2026-06-30', totalAssets: 'unknown' }],
            earnings: [
                { date: '2026-09-30', actualEps: null, estimatedEps: null, surprisePct: 90 },
                { date: '2026-06-30', actualEps: 0, estimatedEps: 1, surprisePct: 90 },
            ],
        } }, providerRequested: 'fmp', providerUsed: 'fmp', providersTried: ['fmp'], errors: [], requestId: 'test',
        cacheHit: false, stale: false, staleFromCache: false, warnings: [],
    });
    assert.equal(response.metrics.peRatio, 0);
    assert.equal(response.metrics.roe, null);
    assert.equal(response.metrics.marketCap, null);
    assert.equal(response.statements.incomeStatement.length, 1);
    assert.equal(response.statements.incomeStatement[0].revenue, 0);
    assert.equal(response.statements.incomeStatement[0].currency, 'EUR');
    assert.deepEqual(response.statements.balanceSheet, []);
    assert.equal(response.statements.earnings.length, 1);
    assert.equal(response.statements.earnings[0].surprisePct, -100);
});
