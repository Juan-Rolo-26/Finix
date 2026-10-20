const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');const ts=require('typescript');

const chartsSourcePath=root+'/apps/web/src/lib/educationCharts.ts';
const chartsModule={exports:{}};
new Function('exports','module',ts.transpileModule(fs.readFileSync(chartsSourcePath,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(chartsModule.exports,chartsModule);
const filter=chartsModule.exports.removeIllustratedLessonCharts;
const lesson='### Tendencia\n\nTexto antes.\n\n![Diagrama](/images/education/tendencia-alcista.jpg)\n*Diagrama didáctico. Autor: ejemplo [Fuente](https://example.com).*\n\nTexto después.\n\n![Precios históricos](/images/education/rsi.png)\n*Gráfico histórico con datos reales y créditos.*';
const realOnly=filter(lesson);assert(!realOnly.includes('tendencia-alcista'));assert(!realOnly.includes('Autor: ejemplo'));assert(realOnly.includes('Texto antes.')&&realOnly.includes('Texto después.'));assert(realOnly.includes('/images/education/rsi.png')&&realOnly.includes('créditos'));
for(const filename of ['tendencia-bajista.png','tendencia-lateral.jpg','soporte-resistencia.png'])assert(!filter('![x](/images/education/'+filename+')').includes(filename));
console.log('PASS: teaching diagrams and attached credits removed; lesson text and real historical charts preserved');
