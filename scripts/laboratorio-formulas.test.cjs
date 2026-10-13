const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const compiled = ts.transpileModule(fs.readFileSync(path.join(root, 'apps/web/src/lib/laboratory.ts'), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const mod={exports:{}};new Function('module','exports','require',compiled)(mod,mod.exports,require);
const {TOOLS,calculate}=mod.exports;
const tool=id=>TOOLS.find(t=>t.id===id);
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<=Math.max(1e-7,Math.abs(expected)*1e-9),`${actual} != ${expected}`);
let checks=0;
for(const annual of [-50,0,7,100]) for(const years of [1,5,50]) for(const beginning of [0,1]) {
 const v={capital:12345,contribution:123,years,annual,inflation:3,beginning};
 const result=calculate(tool('compuesto'),v);const r=(1+annual/100)**(1/12)-1;const n=years*12;
 const expected=v.capital*(1+annual/100)**years+v.contribution*(r===0?n:((1+r)**n-1)/r)*(beginning?1+r:1);
 near(result.rows[n].balance,expected);near(result.rows[n].real,expected/(1.03**years));checks++;
 const goal=calculate(tool('objetivos'),{...v,target:100000});
 if(goal.metrics[0].value>0) near(goal.rows[n].balance,100000*1.03**years);else assert.ok(goal.rows[n].balance>=100000*1.03**years-1e-7);checks++;
}
for(const kind of [0,1,2]) for(const periods of [1,12,365]) for(const rate of [0,0.000001,30,500]) {
 const result=calculate(tool('tasas'),{kind,periods,rate});
 const [tea,tna,tem]=result.metrics.map(m=>m.value/100);
 near((1+tna/periods)**periods-1,tea);near((1+tem)**12-1,tea);near(result.metrics[kind===0?1:kind===1?0:2].value,rate);checks++;
}
for(const principal of [1000,1e12]) for(const tna of [0,0.000001,40,500]) for(const months of [1,24,600]) {
 const result=calculate(tool('prestamos'),{principal,tna,months,upfront:100});const payment=result.metrics[0].value;
 near(result.rows.reduce((s,r)=>s+r.principal,0),principal);assert.equal(result.rows[months-1].balance,0);
 for(const row of result.rows) {near(row.payment,payment);assert.ok(row.balance>=0);assert.ok(row.principal>=0);}checks++;
}
const op=calculate(tool('operacion'),{buy:100,sell:110,quantity:100,buyFee:0.5,sellFee:0.5,fixed:100});
near(op.metrics[0].value,(100*100*1.005+100)/(100*0.995));near(op.rows[10].profit,0);checks++;
console.log(`${checks} verificaciones de fórmulas y límites aprobadas.`);
