const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const {SEED_ARTICLES,SEED_CATEGORIES,SEED_LEARNING_PATHS}=require('../apps/api/dist/education/education-seed.data');
const {LESSON_DEPTH}=require('../apps/api/dist/education/lesson-depth.data');
const {deepenLesson,lessonReadTime}=require('../apps/api/dist/education/lesson-depth');
const {EDUCATION_BASELINE_ARTICLES}=require('../apps/api/dist/education/education-baseline.data');
test('all existing 63 lessons deepen without adding curriculum sections or classes',()=>{
 assert.equal(SEED_ARTICLES.length,63);assert.equal(SEED_CATEGORIES.length,6);assert.equal(SEED_LEARNING_PATHS.length,5);
 assert.deepEqual(new Set(LESSON_DEPTH.map(l=>l.slug)),new Set(SEED_ARTICLES.map(l=>l.slug)));
 for(const a of SEED_ARTICLES){const d=LESSON_DEPTH.find(d=>d.slug===a.slug);assert.ok([d.explanation,d.worked,d.review,d.exercise,d.answer].join(' ').split(/\s+/).length>=100,a.slug);assert.match(a.content,/Comprobá lo que aprendiste/);assert.ok(a.content.includes(d.worked));assert.equal(a.readTimeMinutes,lessonReadTime(a.content));const base=EDUCATION_BASELINE_ARTICLES.find(b=>b.slug===a.slug);if(base)assert.ok(a.content.length>base.content.length+500,a.slug);}
});
test('each lesson has its own accessible illustration and readable mobile variant, no invented price paths',()=>{
 for(const a of LESSON_DEPTH){for(const suffix of ['', '-mobile']){const file=path.join(__dirname,'../apps/web/public/images/education/worked',a.slug+suffix+'.svg');assert.ok(fs.existsSync(file));const svg=fs.readFileSync(file,'utf8');assert.match(svg,/<title id="title">/);assert.match(svg,/Supuestos hipotéticos|supuestos hipotéticos/);assert.doesNotMatch(svg,/<script|<foreignObject|<path|<polyline|href="https?:/);assert.ok(svg.includes(a.metrics[0][1]));}}
});
test('enrichment preserves editor text, retires only obsolete illustrations and is idempotent',()=>{
 const original='Texto propio del editor con una aclaración importante.\n\n![Foto propia](/images/education/assets/bank.jpg)';
 const once=deepenLesson('que-es-el-per',original);assert.ok(once.startsWith(original));assert.equal(deepenLesson('que-es-el-per',once),once);assert.equal(deepenLesson('editor-custom',original),original);
 const old='![Viejo](/images/education/tendencia-alcista.jpg)\n\nTexto conservado';assert.doesNotMatch(deepenLesson('tendencias-alcista-bajista-lateral',old),/tendencia-alcista.jpg/);assert.match(deepenLesson('tendencias-alcista-bajista-lateral',old),/Texto conservado/);
});
test('worked calculations have independently checked results and explicit time conventions',()=>{
 assert.equal(120/800,0.15);assert.equal(100/5,20);assert.equal((100-80)/80,.25);assert.equal((.6*.14+.4*.08*(1-.375)).toFixed(3),'0.104');
 const term=(.365*30/365)*100000;assert.equal(term,3000);
 for(const [slug,expected]of [['wacc-sensibilidad-deuda-patrimonio','10,4%'],['plazo-fijo-tna-tea-uva','3.000'],['diversificacion-y-drawdown','25%'],['dollar-cost-averaging-dca','6,67']])assert.ok(JSON.stringify(LESSON_DEPTH.find(l=>l.slug===slug)).includes(expected));
});
test('Spanish repeated headings produce unique anchors that survive accent normalization',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../apps/web/src/lib/educationReading.ts'),'utf8');const module={exports:{}};
 new Function('module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(module,module.exports);
 const id=module.exports.educationHeadingId;assert.equal(id('Qué revisar',1),'sec-1-que-revisar');assert.notEqual(id('Qué revisar',1),id('Qué revisar',2));
});

test('ROIC examples distinguish after-tax operating profit from cash and financing requirements',()=>{
 const roic=SEED_ARTICLES.find(a=>a.slug==='que-es-el-roic');assert.doesNotMatch(roic.content,/libre de impuestos|debe endeudarse fuertemente|reinv[eie]rtido se multiplica/);
 assert.match(roic.content,/después de impuestos/);assert.match(roic.content,/hacen falta reinversión/);assert.match(roic.formula,/Caja Excedente/);assert.doesNotMatch(roic.formula,/Caja Neta/);
 const {refineRoicText}=require('../apps/api/dist/education/lesson-depth');assert.equal(refineRoicText(refineRoicText(roic.content)),roic.content);assert.equal(refineRoicText('Texto propio del editor'),'Texto propio del editor');
});
