const assert = require('node:assert/strict');
const { test } = require('node:test');
require('reflect-metadata');
const { PortfolioPerformanceService } = require('../src/portfolio/portfolio-performance.service.ts');
const { buildPerformanceCashLedger } = require('../src/portfolio/performance-cash-ledger.ts');
const RealDate = Date;
const now = RealDate.parse('2026-10-03T18:00:00Z');
global.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } };
const asset = { ticker: 'NASDAQ:MSFT', type: 'STOCK', currency: 'USD' };
const day = number => new Date(now - number * 86400000);
const tx = (type, daysAgo, total, quantity = 0, extra = {}) => ({ type, date: day(daysAgo), total, quantity, pricePerUnit: quantity ? total / quantity : 0, fee: 0, currency: 'USD', asset: ['BUY', 'SELL'].includes(type) ? asset : null, ...extra });
const candle = (daysAgo, close) => ({ time: (day(daysAgo).getTime() - 4.5 * 3600000) / 1000, close });
function service(transactions, options = {}) {
    const quantity = transactions.reduce((qty, tx) => qty + (tx.type === 'BUY' ? tx.quantity : tx.type === 'SELL' ? -tx.quantity : 0), 0);
    const grouped = new Map();
    for (const tx of transactions) { if (!tx.asset || !['BUY', 'SELL'].includes(tx.type)) continue; const key = tx.asset.ticker + tx.asset.type; const holding = grouped.get(key) || { quantity: 0, averageCost: 100, asset: tx.asset }; holding.quantity += tx.type === 'BUY' ? tx.quantity : -tx.quantity; grouped.set(key, holding); }
    const holdings = [...grouped.values()].filter(holding => holding.quantity > 0);
    const history = options.history ?? Array.from({ length: 41 }, (_, i) => candle(40 - i, 100));
    const spy = options.spy ?? Array.from({ length: 41 }, (_, i) => candle(40 - i, 120));
    const calls = [];
    const market = {
        getQuotes: async symbols => options.noQuotes ? [] : options.quotes ?? symbols.map(inputSymbol => ({ inputSymbol, price: options.price ?? 100 })),
        getDolarCcl: async () => options.noCcl ? null : { venta: 1000 },
        getCandles: async (symbol, interval, range) => { calls.push({ symbol, interval, range }); return { candles: symbol === 'SPY' ? spy : history }; },
    };
    const prisma = { portfolio: { findFirst: async () => ({ id: 'p' }), findUnique: async () => ({ holdings: options.holdings ?? holdings, transactions }) } };
    return { engine: new PortfolioPerformanceService(prisma, market), calls };
}
const flat = data => { assert.equal(data.performance.insufficientData, false); assert.ok(data.series.length >= 2); assert.ok(data.series.every(point => point.portfolio === 100), JSON.stringify(data.series)); };

test('second externally funded purchase adds 276% capital and 0% return', async () => {
    const { engine } = service([tx('BUY', 10, 1000, 10), tx('BUY', 3, 2760, 27.6)]);
    const data = await engine.getBenchmarks('p', 'u', 'ALL');
    flat(data);
    assert.equal(data.performance.series.at(-1).value, 3760);
    assert.equal(data.returns.portfolio, 0);
});

test('deposits, partial funding, sale proceeds and withdrawals do not inflate returns', async () => {
    for (const transactions of [
        [tx('DEPOSIT', 10, 1000), tx('BUY', 9, 1000, 10), tx('DEPOSIT', 5, 1000), tx('BUY', 4, 2000, 20)],
        [tx('BUY', 10, 1000, 10), tx('SELL', 6, 500, 5), tx('BUY', 4, 500, 5), tx('SELL', 2, 1000, 10), tx('WITHDRAW', 1, 1000)],
    ]) flat(await service(transactions).engine.getBenchmarks('p', 'u', 'ALL'));
});

test('cash-only portfolio remains measurable after selling all positions', async () => {
    const data = await service([tx('BUY', 10, 1000, 10), tx('SELL', 2, 1000, 10)]).engine.getBenchmarks('p', 'u', 'ALL');
    flat(data);
    assert.equal(data.performance.series.at(-1).value, 1000);
});

test('real price increase over the last two days is 10%, SPY is 1% on matching timestamps', async () => {
    const { engine } = service([tx('BUY', 2, 1000, 10)], { price: 110, spy: [candle(3, 120), candle(2, 120), candle(1, 120), candle(0, 121.2)] });
    const data = await engine.getBenchmarks('p', 'u', 'ALL');
    assert.equal(data.series[0].portfolio, 100);
    assert.equal(data.series[0].sp500, 100);
    assert.equal(data.series.at(-1).portfolio, 110);
    assert.equal(data.series.at(-1).sp500, 101);
    assert.equal(data.performance.series[0].value, 1000, 'past valuations must not use the current quote');
    assert.ok(data.series.every((point, i) => point.date === data.performance.series[i].date));
});

test('range starts at its first valuation and intraday timestamps are retained', async () => {
    const { engine, calls } = service([tx('BUY', 35, 1000, 10)]);
    const month = await engine.getBenchmarks('p', 'u', '1M');
    assert.equal(month.startDate, day(30).toISOString());
    assert.equal(month.series[0].portfolio, 100);
    const intraday = await engine.getBenchmarks('p', 'u', '1D');
    assert.equal(intraday.series.length, 25);
    assert.equal(new Set(intraday.series.map(point => point.date)).size, 25);
    assert.ok(calls.some(call => call.symbol === 'SPY' && call.interval === '1h'));
});

test('future candles cannot create a historical portfolio or benchmark', async () => {
    const missing = await service([tx('BUY', 10, 1000, 10)], { history: [candle(1, 100)] }).engine.getBenchmarks('p', 'u', 'ALL');
    assert.equal(missing.performance.insufficientData, true);
    assert.deepEqual(missing.series, []);
    const noSpy = await service([tx('BUY', 10, 1000, 10)], { spy: [candle(1, 120)] }).engine.getBenchmarks('p', 'u', 'ALL');
    assert.equal(noSpy.benchmarkAvailable, false);
    assert.ok(noSpy.series.every(point => point.sp500 === undefined));
});

test('missing live quote retains the latest real close, never the cost price', async () => {
    const data = await service([tx('BUY', 10, 1000, 10)], { noQuotes: true, history: [...Array.from({ length: 10 }, (_, i) => candle(10 - i, i === 9 ? 110 : 100))] }).engine.getBenchmarks('p', 'u', 'ALL');
    assert.equal(data.series.at(-1).portfolio, 110);
});

test('fees reduce return and dividends increase it', async () => {
    const fee = await service([tx('BUY', 10, 1000, 10), tx('BUY', 3, 1000, 10, { fee: 10 })]).engine.getBenchmarks('p', 'u', 'ALL');
    assert.equal(fee.returns.portfolio, -0.4975);
    const dividend = await service([tx('BUY', 10, 1000, 10), tx('DIVIDEND', 3, 100)]).engine.getBenchmarks('p', 'u', 'ALL');
    assert.equal(dividend.returns.portfolio, 10);
});

test('USD cash cannot fund an ARS purchase and purchases use each currency balance', () => {
    const events = buildPerformanceCashLedger([tx('DEPOSIT', 10, 1000), tx('BUY', 9, 1000, 10, { currency: 'ARS' }), tx('BUY', 8, 1500, 15)]);
    assert.equal(events[1].externalFlow, 1000);
    assert.equal(events[2].externalFlow, 500);
});

test('CEDEAR ratio applies only to certificates; US shares with the same ticker stay whole', async () => {
    const us = await service([tx('BUY', 10, 1000, 10)]).engine.getBenchmarks('p', 'u', 'ALL');
    assert.equal(us.performance.series[0].value, 1000);
    const cedear = { ticker: 'MSFT', type: 'CEDEAR', currency: 'ARS' };
    const data = await service([tx('BUY', 10, 33333.3333333333, 10, { asset: cedear, currency: 'ARS' })]).engine.getBenchmarks('p', 'u', 'ALL');
    assert.equal(data.performance.insufficientData, false);
    assert.ok(data.performance.series[0].value < 1000, 'a certificate represents a fraction of the US share');
    assert.ok(data.performance.valuationMessage.includes('CCL actual'));
});

test('missing CCL and incomplete imported holdings produce an honest empty comparison', async () => {
    const noCcl = await service([tx('BUY', 10, 1000, 10, { currency: 'ARS' })], { noCcl: true }).engine.getBenchmarks('p', 'u', 'ALL');
    assert.equal(noCcl.performance.insufficientData, true);
    assert.deepEqual(noCcl.series, []);
    const imported = await service([tx('BUY', 10, 1000, 10)], { holdings: [{ asset, quantity: 20, averageCost: 100 }] }).engine.getBenchmarks('p', 'u', 'ALL');
    assert.equal(imported.performance.insufficientData, true);
    assert.deepEqual(imported.series, []);
});


test('deposits at the same timestamp fund purchases before inferring capital', () => {
    const events = buildPerformanceCashLedger([tx('BUY', 10, 1000, 10), tx('DEPOSIT', 10, 1000)]);
    assert.equal(events.reduce((total, event) => total + event.externalFlow, 0), 1000);
    assert.equal(events.reduce((total, event) => total + event.cashDelta, 0), 0);
});

test('stale market history is unavailable rather than a flat fabricated benchmark', async () => {
    const data = await service([tx('BUY', 10, 1000, 10)], { spy: [candle(10, 120)] }).engine.getBenchmarks('p', 'u', 'ALL');
    assert.equal(data.benchmarkAvailable, false);
    assert.ok(data.series.every(point => point.sp500 === undefined));
});

test('local CEDEAR quotes cannot be mistaken for underlying quotes', async () => {
    const cedear = { ticker: 'MSFT', type: 'CEDEAR', currency: 'ARS' };
    const data = await service([tx('BUY', 10, 100000, 30, { asset: cedear, currency: 'ARS' })], {
        quotes: [{ inputSymbol: 'BCBA:MSFT', price: 12000 }],
    }).engine.getBenchmarks('p', 'u', 'ALL');
    assert.equal(data.performance.series.at(-1).value, 100, 'without a US quote use the real last underlying close');
    assert.equal(data.returns.portfolio, 0);
});


test('large contribution preserves earlier gains without amplifying execution gains', async () => {
    const history = Array.from({ length: 41 }, (_, i) => candle(40 - i, 40 - i >= 6 ? 100 : 110));
    const data = await service([tx('BUY', 10, 1000, 10), tx('BUY', 4, 10000, 100, { asset: { ...asset, ticker: 'NASDAQ:NVDA' } })], { price: 110, history }).engine.getBenchmarks('p', 'u', 'ALL');
    // Existing assets earn 10%; the new trade buys below the observed close.
    // Its $1,000 execution gain is divided by the $11,100 funded value.
    assert.equal(data.returns.portfolio, 19.9099);
});


test('a daily close is unavailable before that session finishes', async () => {
    const history = Array.from({ length: 41 }, (_, i) => candle(40 - i, i === 36 ? 200 : 100));
    const data = await service([tx('BUY', 10, 1000, 10)], { history }).engine.getBenchmarks('p', 'u', 'ALL');
    const beforeClose = data.performance.series.find(point => point.date === day(4).toISOString());
    const followingDay = data.performance.series.find(point => point.date === day(3).toISOString());
    assert.equal(beforeClose.value, 1000, '14:00 ET cannot use the future 16:00 close');
    assert.equal(followingDay.value, 2000, 'the next valuation may use the completed close');
});

test('the first recorded purchase uses its real execution price instead of an older close', async () => {
    const data = await service([tx('BUY', 10, 1100, 10)], { price: 110, history: Array.from({ length: 41 }, (_, i) => candle(40 - i, i < 30 ? 100 : 110)) }).engine.getBenchmarks('p', 'u', 'ALL');
    assert.equal(data.performance.series[0].value, 1100);
    assert.equal(data.returns.portfolio, 0);
});

test('monthly chart uses historical flow-adjusted measurements, not capital growth or current quotes for the past', async () => {
    const deposits = service([tx('BUY', 10, 1000, 10), tx('BUY', 3, 2760, 27.6)]);
    assert.ok((await deposits.engine.getReturns('p', 'u', 'USD')).every(month => month.value === 0));
    const rising = service([tx('BUY', 35, 1000, 10)], { price: 110 });
    const months = await rising.engine.getReturns('p', 'u', 'USD');
    assert.deepEqual(months.map(month => month.monthKey), ['2026-08', '2026-09', '2026-10']);
    assert.equal(months.find(month => month.monthKey === '2026-09').value, 0, 'past flat prices stay flat');
    assert.equal(months.at(-1).value, 10, 'current gain belongs to the current month');
});

test('monthly returns compound measured changes inside each month and omit unobserved/empty months', async () => {
    const { engine } = service([]);
    engine.getPerformance = async () => ({ insufficientData: false, markers: [], series: [
        { date: '2026-08-31T18:00:00Z', value: 100, returnPct: 0 },
        { date: '2026-09-29T18:00:00Z', value: 110, returnPct: 10, dailyReturn: 10 },
        { date: '2026-09-30T18:00:00Z', value: 121, returnPct: 21, dailyReturn: 10 },
        { date: '2026-10-01T18:00:00Z', value: 0, returnPct: -100, dailyReturn: -100 },
        { date: '2026-11-01T18:00:00Z', value: 0, returnPct: -100, dailyReturn: 0 },
    ] });
    assert.deepEqual((await engine.getReturns('p', 'u')).map(month => [month.monthKey, month.value]), [['2026-09', 21], ['2026-10', -100]]);
});

test('monthly graph never fabricates returns when there is no usable history', async () => {
    const { engine } = service([tx('BUY', 10, 1000, 10)], { history: [] });
    assert.deepEqual(await engine.getReturns('p', 'u'), []);
    assert.deepEqual(await service([]).engine.getReturns('p', 'u'), []);
});

test('profile and private metrics delegate monthly returns to the same engine in the portfolio currency', async () => {
    const { PortfolioService } = require('../src/portfolio/portfolio.service.ts');
    const record = { id: 'p', userId: 'u', monedaBase: 'ARS', holdings: [], transactions: [], cashAccounts: [] };
    const calls = [];
    const monthly = Array.from({ length: 14 }, (_, i) => ({ monthKey: String(i), value: 0, label: 'mes' }));
    const engine = { getReturns: async (...args) => { calls.push(args); return monthly; } };
    const portfolios = new PortfolioService({ portfolio: { findFirst: async () => record } }, { getQuotes: async () => [] }, {}, engine);
    portfolios.getPublicPortfolioRecord = async () => record;
    for (const result of [await portfolios.getPortfolioMetrics('p', 'u'), await portfolios.getPublicPortfolioMetrics('p')]) {
        assert.deepEqual(result.retornosMensuales, monthly.slice(-12));
    }
    assert.deepEqual(calls, [['p', 'u', 'ARS'], ['p', 'u', 'ARS']]);
});
