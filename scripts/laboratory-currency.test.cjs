const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const source = fs.readFileSync(path.join(root, 'apps/web/src/lib/laboratory.ts'), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
const { TOOLS, calculate, convertCurrency, parseLaboratoryNumber } = mod.exports;
const near = (a, b) => assert.ok(Math.abs(a-b) <= Math.max(1e-7, Math.abs(b)*1e-9), `${a} != ${b}`);
let checks=0;
for (const tool of TOOLS) {
 for (const rate of [0.01, 1000, 1500.75]) {
  const converted = convertCurrency(tool, tool.defaults, 'ARS', 'USD', rate);
  const restored = convertCurrency(tool, converted, 'USD', 'ARS', rate);
  for (const field of tool.fields) { near(restored[field.key], tool.defaults[field.key]); if (!field.monetary) assert.equal(converted[field.key], tool.defaults[field.key]); }
  const originalResult = calculate(tool, tool.defaults);
  const convertedResult = calculate(tool, converted);
  originalResult.metrics.forEach((metric, index) => near(convertedResult.metrics[index].value, metric.percent || tool.id === 'tasas' ? metric.value : metric.value / rate));
  originalResult.rows.forEach((row,index) => {
   for (const column of originalResult.columns) near(convertedResult.rows[index][column.key], column.plain || column.percent || tool.id==='tasas' ? row[column.key] : row[column.key]/rate);
  });
  checks++;
 }
}
const compound=TOOLS[0];
for (const rate of [0,-1,NaN,Infinity]) assert.throws(()=>convertCurrency(compound,compound.defaults,'ARS','USD',rate));
assert.throws(()=>convertCurrency(compound,{...compound.defaults,capital:NaN},'ARS','USD',1000));
assert.throws(()=>convertCurrency(compound,{...compound.defaults,capital:1e12},'USD','ARS',1000));
assert.equal(parseLaboratoryNumber('0,5'),0.5);
assert.equal(parseLaboratoryNumber('.5'),0.5);
assert.equal(parseLaboratoryNumber('1e-7'),1e-7);
for(const raw of ['', '1.000,5','Infinity','abc','1 000']) assert.ok(Number.isNaN(parseLaboratoryNumber(raw)));
console.log(`${checks} round trips and output denomination checks passed for all 8 calculators; invalid values and decimal parsing passed.`);
