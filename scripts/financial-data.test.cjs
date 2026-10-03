// Run after building @finix/shared: node --test scripts/financial-data.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { financialNumber, isVisibleEarnings, normalizeEarnings, formatFinancialAmount } = require('../packages/shared/dist');

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
