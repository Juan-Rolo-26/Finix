const assert = require('node:assert/strict');
const { test } = require('node:test');
require('reflect-metadata');
const { MarketService } = require('../src/market/market.service.ts');

const updatedAt = '2026-10-02T18:55:00.000Z';
const houses = ['oficial', 'blue', 'bolsa', 'contadoconliqui', 'mayorista', 'tarjeta'];
const quote = (casa, extra = {}) => ({ casa, moneda: 'USD', compra: 1500, venta: 1540, fechaActualizacion: updatedAt, ...extra });
const mockResponse = (context, data) => context.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => data }));

test('six real dollar references preserve prices, names and provider timestamps', async context => {
    mockResponse(context, [...houses.map(house => quote(house)), quote('cripto')]);
    const rates = await new MarketService({}).getDollarRates();
    assert.deepEqual(rates.map(rate => rate.id), ['oficial', 'blue', 'mep', 'ccl', 'mayorista', 'tarjeta']);
    assert.deepEqual(rates.map(rate => rate.label), ['Oficial', 'Blue', 'MEP', 'CCL', 'Mayorista', 'Tarjeta']);
    for (const rate of rates) {
        assert.equal(rate.buy, 1500);
        assert.equal(rate.sell, 1540);
        assert.equal(rate.updatedAt, updatedAt);
        assert.equal(rate.spreadPct, (40 / 1500) * 100);
    }
});

test('missing houses are omitted without placeholder prices', async context => {
    mockResponse(context, [quote('oficial'), quote('tarjeta', { compra: '1937', venta: '2002' })]);
    const rates = await new MarketService({}).getDollarRates();
    assert.deepEqual(rates.map(rate => rate.id), ['oficial', 'tarjeta']);
    assert.equal(rates[1].buy, 1937);
    assert.equal(rates[1].sell, 2002);
});

test('invalid prices, currency and timestamps never become displayed rates', async context => {
    for (const extra of [
        { compra: null }, { compra: '' }, { compra: ' ' }, { compra: false },
        { compra: 0 }, { venta: -1 }, { venta: 'NaN' }, { venta: Infinity },
        { fechaActualizacion: null }, { fechaActualizacion: '' },
        { fechaActualizacion: 'invalid date' }, { moneda: 'EUR' },
    ]) {
        mockResponse(context, [quote('oficial'), quote('tarjeta', extra)]);
        const rates = await new MarketService({}).getDollarRates();
        assert.deepEqual(rates.map(rate => rate.id), ['oficial']);
    }
});

test('empty provider data stays empty', async context => {
    mockResponse(context, []);
    assert.deepEqual(await new MarketService({}).getDollarRates(), []);
});

test('cold network failures return no fabricated rates', async context => {
    context.mock.method(console, 'error', () => {});
    for (const response of [
        async () => { throw new Error('offline'); },
        async () => ({ ok: false, status: 503 }),
        async () => ({ ok: true, json: async () => ({ error: 'unexpected payload' }) }),
    ]) {
        context.mock.method(global, 'fetch', response);
        assert.deepEqual(await new MarketService({}).getDollarRates(), []);
    }
});

test('cached genuine prices survive outages with their original update time', async context => {
    const fetchMock = mockResponse(context, houses.map(house => quote(house)));
    const service = new MarketService({});
    const original = await service.getDollarRates();
    assert.deepEqual(await service.getDollarRates(), original);
    assert.equal(fetchMock.mock.callCount(), 1);
    service.dollarRatesCache.timestamp = Date.now() - 61000;
    context.mock.method(global, 'fetch', async () => { throw new Error('offline'); });
    context.mock.method(console, 'error', () => {});
    const cached = await service.getDollarRates();
    assert.deepEqual(cached, original);
    assert.ok(cached.every(rate => rate.updatedAt === updatedAt));
});

test('expired cache refreshes prices and does not retain omitted houses', async context => {
    mockResponse(context, houses.map(house => quote(house)));
    const service = new MarketService({});
    await service.getDollarRates();
    service.dollarRatesCache.timestamp = Date.now() - 61000;
    const nextUpdate = '2026-10-03T14:51:00.000Z';
    mockResponse(context, [quote('oficial', { venta: 1550, fechaActualizacion: nextUpdate })]);
    const rates = await service.getDollarRates();
    assert.equal(rates.length, 1);
    assert.equal(rates[0].sell, 1550);
    assert.equal(rates[0].updatedAt, nextUpdate);
});
