const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../apps/web/src/lib/tradingViewSymbols.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {} }; vm.runInNewContext(compiled, context);
const resolve = context.exports.resolveTradingViewSymbol;
test('Old SPY attachments use the valid TradingView ETF market', () => {
    assert.equal(resolve('NYSE:SPY'), 'AMEX:SPY');
    assert.equal(resolve('SPY'), 'AMEX:SPY');
    assert.equal(resolve('AMEX:SPY'), 'AMEX:SPY');
});
test('A deliberate market selection is retained for different listings', () => {
    assert.equal(resolve('BCBA:JPM'), 'BCBA:JPM');
    assert.equal(resolve('TSX:JPM'), 'TSX:JPM');
    assert.equal(resolve('NYSE:JPM'), 'NYSE:JPM');
    assert.equal(resolve('BCBA:SPY'), 'BCBA:SPY');
});
test('Bare US and crypto tickers keep their canonical market', () => {
    assert.equal(resolve(' jpm '), 'NYSE:JPM');
    assert.equal(resolve('MSFT'), 'NASDAQ:MSFT');
    assert.equal(resolve('BTC'), 'BINANCE:BTCUSDT');
    assert.equal(resolve('AVAX'), 'BINANCE:AVAXUSDT');
});
