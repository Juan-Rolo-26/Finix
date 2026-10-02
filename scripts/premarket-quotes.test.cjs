const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const filename = path.join(__dirname, '../apps/web/src/components/markets/premarket-quote.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('module', 'exports', compiled)(loaded, loaded.exports);
const { resolvePremarketQuote } = loaded.exports;
const asset = { id: 'aapl', symbol: 'NASDAQ:AAPL', label: 'Apple', description: '', format: 'currency', currency: 'USD', price: 240, change: -4, updatedAt: '2026-10-02T13:25:00Z', unavailable: false };

test('explicit pre-market price and percentage take priority over the regular quote', () => {
    const resolved = resolvePremarketQuote({ ...asset, premarketPrice: 225, premarketChange: 1.25, regularPrice: 240, regularChange: -4, isPremarketQuote: false });
    assert.equal(resolved.price, 225);
    assert.equal(resolved.change, 1.25);
    assert.equal(resolved.isPremarketQuote, true);
    assert.equal(resolved.regularPrice, 240);
    assert.equal(resolved.regularChange, -4);
});

test('missing pre-market prices do not substitute the regular stock or ETF price', () => {
    for (const symbol of ['NASDAQ:AAPL', 'NYSE:YPF', 'AMEX:SPY']) {
        const resolved = resolvePremarketQuote({ ...asset, symbol, premarketPrice: null, premarketChange: null });
        assert.equal(resolved.price, null);
        assert.equal(resolved.change, null);
        assert.equal(resolved.unavailable, true);
        assert.equal(resolved.regularPrice, 240);
    }
});

test('a missing pre-market percentage does not borrow the regular percentage', () => {
    const resolved = resolvePremarketQuote({ ...asset, premarketPrice: 225, premarketChange: null, isPremarketQuote: true });
    assert.equal(resolved.price, 225);
    assert.equal(resolved.change, null);
});

test('zero changes remain valid and invalid pre-market prices are unavailable', () => {
    assert.equal(resolvePremarketQuote({ ...asset, premarketPrice: 225, premarketChange: 0 }).change, 0);
    for (const premarketPrice of [0, -1, NaN, Infinity]) {
        assert.equal(resolvePremarketQuote({ ...asset, premarketPrice }).price, null);
    }
});

test('older frozen snapshots preserve explicitly identified pre-market quotes', () => {
    const resolved = resolvePremarketQuote({ ...asset, isPremarketQuote: true, regularPrice: 250, regularChange: 8 });
    assert.equal(resolved.price, 240);
    assert.equal(resolved.change, -4);
    assert.equal(resolved.regularPrice, 250);
    assert.equal(resolved.regularChange, 8);
});

test('reference instruments remain labeled as references, with no fabricated pre-market quote', () => {
    for (const symbol of ['BINANCE:BTCUSDT', 'OANDA:XAUUSD', 'TVC:US10Y']) {
        const resolved = resolvePremarketQuote({ ...asset, symbol, premarketPrice: null, premarketChange: null });
        assert.equal(resolved.price, 240);
        assert.equal(resolved.change, -4);
        assert.equal(resolved.isPremarketQuote, false);
        assert.equal(resolved.requiresPremarket, false);
    }
});

test('a stale unavailable flag does not hide a valid explicit pre-market quote', () => {
    const resolved = resolvePremarketQuote({ ...asset, unavailable: true, premarketPrice: 225, premarketChange: .5 });
    assert.equal(resolved.price, 225);
    assert.equal(resolved.unavailable, false);
});
