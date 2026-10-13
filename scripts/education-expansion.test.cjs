const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('/home/juampi26/Finix/node_modules/typescript');
const { EDUCATION_EXPANSION } = require('/home/juampi26/Finix/apps/api/dist/education/education-expansion.data');
const { SEED_ARTICLES } = require('/home/juampi26/Finix/apps/api/dist/education/education-seed.data');
const { PrismaClient } = require('/home/juampi26/Finix/node_modules/@prisma/client');
const dotenv = require('/home/juampi26/Finix/node_modules/dotenv');
const root = '/home/juampi26/Finix';
dotenv.config({ path: root+'/apps/api/.env', quiet:true });
assert(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));
const base = `http://127.0.0.1:${process.env.PORT || 3010}/api/education`;
const searchModule={exports:{}};
const searchSource=fs.readFileSync(root+'/apps/web/src/lib/educationSearch.ts','utf8');
new Function('exports','module',ts.transpileModule(searchSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(searchModule.exports,searchModule);
async function read(url) { await new Promise(resolve=>setTimeout(resolve,1100)); const res=await fetch(url,{signal:AbortSignal.timeout(15000)});assert.equal(res.status,200,url);return res.json(); }
async function main() {
 assert.equal(EDUCATION_EXPANSION.length,20);
 assert.equal(new Set(SEED_ARTICLES.map(a=>a.slug)).size,SEED_ARTICLES.length);
 assert.equal(EDUCATION_EXPANSION.filter(a=>a.categorySlug==='tipos-de-activos').length,9);
 const pages=await read(base+'/articles?limit=50');
 const second=await read(base+'/articles?limit=50&page=2');
 const items=[...pages.items,...second.items];
 assert(items.length>=63,'All published entries must be reachable across pages');
 assert.equal(items.filter(a=>EDUCATION_EXPANSION.some(n=>n.slug===a.slug)).length,20);
 for(const seed of EDUCATION_EXPANSION) {
   const item=items.find(a=>a.slug===seed.slug);
   assert(item.coverImage?.src && !('content' in item), 'Lists contain cover metadata, not full article text');
   const detail=await read(base+'/articles/'+seed.slug);
   assert.equal(detail.content,seed.content,seed.slug);
   assert(detail.sources.length>=2);
   const image=detail.content.match(/!\[[^\]]+\]\(([^)]+)\)/)[1];
   const imagePath=root+'/apps/web/public'+image;
   assert(fs.existsSync(imagePath),image);
   const response=await fetch('http://127.0.0.1:5173'+image);
   assert.equal(response.status,200,image);
   assert(response.headers.get('content-type')?.startsWith('image/'));
   assert(detail.content.includes('Licencia:') && detail.content.includes('Wikimedia Commons'));
 }
 const category=await read(base+'/categories/tipos-de-activos');
 assert.equal(category.articles.length,9);
 assert(category.articles.every(a=>a.coverImage));
 const checks={'revenue':'revenue-ingresos-reconocimiento','pe':'pe-trailing-forward-beneficios-normalizados','roic':'roic-incremental-reinversion-crecimiento','wacc':'wacc-sensibilidad-deuda-patrimonio','ons':'obligaciones-negociables-on-credito','call':'opciones-call-put-prima-strike','pull':'opciones-call-put-prima-strike','bitcoin':'bitcoin-red-custodia-exposicion','plazos fijos':'plazo-fijo-tna-tea-uva','letras':'letras-tesoro-descuento-capitalizacion'};
 for(const [query,slug] of Object.entries(checks)) assert(searchModule.exports.searchEducationArticles(items,query).some(a=>a.slug===slug),query);
 assert.equal(searchModule.exports.searchEducationArticles(items,'RSI inexistente').length,0);
 const prisma=new PrismaClient();
 try {
   const fields={slug:true,title:true,summary:true,content:true,status:true,interactiveWidget:true,formula:true};
   const before=await prisma.educationArticle.findMany({select:fields,orderBy:{slug:'asc'}});
   const { EducationService }=require(root+'/apps/api/dist/education/education.service');
   await new EducationService(prisma).seedDefaultsIfEmpty();
   const after=await prisma.educationArticle.findMany({select:fields,orderBy:{slug:'asc'}});
   assert.deepEqual(after,before,'Repeat synchronization preserves current content, status and optional widgets, including intentionally empty fields');
 }
 finally { await prisma.$disconnect(); }
 console.log('PASS: 20 new published entries, unique slugs, 9 asset entries, pagination, 20 detail routes and images, credits, aliases and preserved existing content/status/widgets');
}
main().catch(error=>{console.error(error);process.exitCode=1});
