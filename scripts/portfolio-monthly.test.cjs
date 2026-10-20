const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { PortfolioPerformanceService } = require('../apps/api/dist/portfolio/portfolio-performance.service');
const RealDate = Date;
const now = RealDate.parse('2026-10-20T18:00:00Z');
global.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
};
const asset = { ticker: 'NASDAQ:MSFT', type: 'STOCK', currency: 'USD' };
const transaction = (type, date, total, quantity = 0, extra = {}) => ({
    type, date: new Date(date), total, quantity, pricePerUnit: quantity ? total / quantity : 0,
    fee: 0, currency: 'USD', asset: ['BUY', 'SELL'].includes(type) ? asset : null, ...extra,
});
const candles = (from, to, price = () => 100) => {
    const result = [];
    for (let time = RealDate.parse(from); time <= RealDate.parse(to); time += 86400000) {
        result.push({ time: time / 1000, close: price(new RealDate(time).toISOString().slice(0, 10)) });
    }
    return result;
};
function service(transactions, { history = candles('2026-08-01T13:30:00Z', '2026-10-20T13:30:00Z'), price = 110 } = {}) {
    const quantity = transactions.reduce((sum, tx) => sum + (tx.type === 'BUY' ? tx.quantity : tx.type === 'SELL' ? -tx.quantity : 0), 0);
    const prisma = { portfolio: {
        findFirst: async () => ({ id: 'p' }),
        findUnique: async () => ({ transactions, holdings: quantity > 0 ? [{ asset, quantity, averageCost: 100 }] : [] }),
    } };
    const calls = [];
    const market = {
        getQuotes: async symbols => symbols.map(inputSymbol => ({ inputSymbol, price })),
        getDolarCcl: async () => ({ venta: 1000 }),
        getCandles: async (symbol, interval, range) => { calls.push({ symbol, interval, range }); return { candles: history }; },
    };
    return { engine: new PortfolioPerformanceService(prisma, market), calls };
}
const october = months => months.find(month => month.monthKey === '2026-10');

test('missing older history does not suppress October to date or replace it with zero', async () => {
    const { engine, calls } = service([transaction('BUY', '2026-08-15T18:00:00Z', 1000, 10)], {
        history: candles('2026-09-20T13:30:00Z', '2026-10-20T13:30:00Z'),
    });
    assert.deepEqual((await engine.getPerformance('p', 'u', 'ALL')).series, [], 'the full benchmark still requires complete coverage');
    const months = await engine.getReturns('p', 'u');
    assert.equal(october(months).value, 10);
    assert.equal(october(months).isPartial, true);
    assert.equal(october(months).periodStart, '2026-10-01T02:59:59.999Z');
    assert.equal(october(months).periodEnd, new Date().toISOString());
    assert.equal(months.some(month => month.monthKey === '2026-09'), false, 'an incomplete month cannot masquerade as a measured return');
    assert.ok(calls.some(call => call.range === '2y'), 'daily history covers the trailing calendar months');
    assert.ok(calls.every(call => call.symbol), 'cash movements never request candles for an empty symbol');
});

test('October uses September closing value rather than lifetime cost or a rolling 30-day return', async () => {
    const { engine } = service([transaction('BUY', '2026-09-01T18:00:00Z', 1000, 10)], {
        history: candles('2026-08-01T13:30:00Z', '2026-10-20T13:30:00Z', date => date >= '2026-09-30' ? 120 : 100), price: 132,
    });
    assert.equal(october(await engine.getReturns('p', 'u')).value, 10, '32% lifetime gain is not the monthly return');
});

test('large deposits and funded purchases are excluded from monthly gains', async () => {
    const { engine } = service([
        transaction('BUY', '2026-09-15T18:00:00Z', 1000, 10),
        transaction('DEPOSIT', '2026-10-05T18:00:00Z', 9000),
        transaction('BUY', '2026-10-05T18:00:00Z', 9000, 90),
    ]);
    assert.equal(october(await engine.getReturns('p', 'u')).value, 10);
});

test('withdrawals are not losses and dividends remain investment returns', async () => {
    const { engine } = service([
        transaction('BUY', '2026-09-15T18:00:00Z', 1000, 10),
        transaction('SELL', '2026-10-05T18:00:00Z', 500, 5),
        transaction('WITHDRAW', '2026-10-06T18:00:00Z', 500),
        transaction('DIVIDEND', '2026-10-07T18:00:00Z', 50),
    ], { price: 100 });
    assert.equal(october(await engine.getReturns('p', 'u')).value, 10);
});

test('a gap within October invalidates October rather than summing only observed changes', async () => {
    const { engine } = service([transaction('BUY', '2026-09-01T18:00:00Z', 1000, 10)], {
        history: [...candles('2026-08-01T13:30:00Z', '2026-10-02T13:30:00Z'), ...candles('2026-10-15T13:30:00Z', '2026-10-20T13:30:00Z')],
    });
    const months = await engine.getReturns('p', 'u');
    assert.equal(october(months), undefined);
    assert.ok(months.some(month => month.monthKey === '2026-09'));
});

test('a single unmeasured valuation never becomes a zero-percent monthly return', async () => {
    const { engine } = service([transaction('BUY', new Date().toISOString(), 1000, 10)], { history: [], price: 100 });
    assert.deepEqual(await engine.getReturns('p', 'u'), []);
});

test('the current month can compare a same-day purchase with the latest market quote', async () => {
    const { engine } = service([transaction('BUY', '2026-10-20T16:00:00Z', 1000, 10)], { history: [], price: 110 });
    assert.equal(october(await engine.getReturns('p', 'u')).value, 10);
});

test('genuine zero and negative measured returns remain visible', async () => {
    for (const price of [100, 90]) {
        const { engine } = service([transaction('BUY', '2026-10-01T18:00:00Z', 1000, 10)], { price });
        assert.equal(october(await engine.getReturns('p', 'u')).value, price - 100);
    }
});

test('the month boundary follows Buenos Aires rather than UTC', async () => {
    const { engine } = service([]);
    engine.getPerformance = async () => ({ series: [
        { date: '2026-09-30T18:00:00Z', value: 100, returnPct: 0 },
        { date: '2026-10-01T01:00:00Z', value: 110, returnPct: 10, dailyReturn: 10 },
        { date: '2026-10-01T02:59:59.999Z', value: 110, returnPct: 10, dailyReturn: 0 },
        { date: '2026-10-01T04:00:00Z', value: 121, returnPct: 21, dailyReturn: 10 },
    ] });
    const months = await engine.getReturns('p', 'u');
    assert.deepEqual(months.map(month => [month.monthKey, month.value]), [['2026-09', 10], ['2026-10', 10]]);
});

test('authorization still runs before monthly portfolio reads', async () => {
    const { engine } = service([]);
    engine.prisma.portfolio.findFirst = async () => null;
    engine.prisma.portfolio.findUnique = async () => { throw Error('must not read an unauthorized portfolio'); };
    await assert.rejects(engine.getReturns('p', 'other'), error => error.getStatus() === 404);
});
