const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../apps/web/src/components/markets/opportunity-indicators.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {} }; vm.runInNewContext(compiled, context);
const indicator = context.exports.getOpportunityIndicator;

test('Discount is measured against fair value, rather than upside against price', () => {
    const result = indicator('UNDERVALUED', { price: 40, fairValue: 100 });
    assert.equal(result.value, 60);
    assert.equal(result.display, '60,0%');
    assert.equal(result.tone, 'positive');
    assert.match(result.detail, /Debajo/);
});
test('An expensive price is identified as a premium, not a discount', () => {
    const result = indicator('UNDERVALUED', { price: 125, fairValue: 100 });
    assert.equal(result.value, -25);
    assert.equal(result.display, '25,0%');
    assert.equal(result.tone, 'negative');
    assert.match(result.detail, /Sobre/);
    assert.equal(indicator('UNDERVALUED', { price: 100, fairValue: 100 }).value, 0);
});
test('Missing or invalid valuations do not produce fabricated percentages', () => {
    for (const item of [{}, { price: 40 }, { price: 0, fairValue: 100 }, { price: 40, fairValue: 0 }, { price: 40, fairValue: -10 }, { price: Infinity, fairValue: 100 }, { price: 40, fairValue: NaN }]) {
        assert.equal(indicator('UNDERVALUED', item).value, null);
        assert.equal(indicator('UNDERVALUED', item).display, '—');
    }
});
test('Health is the existing balance score out of 100, not a probability', () => {
    const result = indicator('HEALTH', { opportunityScore: 90, scoreBreakdown: { balance: 56 } });
    assert.equal(result.display, '56/100');
    assert.equal(result.progress, 56);
    assert.match(result.description, /no una probabilidad/);
});
test('Growth keeps its score separate from actual growth rates', () => {
    const result = indicator('GROWTH', { scoreBreakdown: { growth: 73.6 } });
    assert.equal(result.display, '74/100');
    assert.equal(indicator('GROWTH', {}).value, null);
});
test('Dividend yield is a real percentage, with no artificial score meter', () => {
    const result = indicator('DIVIDEND', { dividendYield: 3.5 });
    assert.equal(result.display, '3,5%');
    assert.equal(result.progress, null);
    assert.equal(indicator('DIVIDEND', { dividendYield: 0 }).display, '0,0%');
    assert.equal(indicator('DIVIDEND', { dividendYield: NaN }).value, null);
});
test('Zero scores are retained while out-of-range scores are unavailable', () => {
    assert.equal(indicator('ALL', { opportunityScore: 0 }).display, '0/100');
    assert.equal(indicator('ALL', { opportunityScore: 100 }).display, '100/100');
    for (const score of [undefined, NaN, Infinity, -1, 101]) assert.equal(indicator('ALL', { opportunityScore: score }).value, null);
});
