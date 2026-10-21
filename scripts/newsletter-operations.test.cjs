const {test}=require('node:test');
const assert=require('node:assert/strict');
require('reflect-metadata');
const {NewsletterNewsService}=require('../apps/api/dist/admin/newsletter-news.service');
const {ResendQuotaService}=require('../apps/api/dist/mail/resend-quota.service');
const {EmailMarketingService}=require('../apps/api/dist/admin/email-marketing.service');
const Parser=require('rss-parser');
const now=new Date('2026-10-20T19:00:00Z');
function newsFixture({missing=false,failTranslation=false,duplicate=false}={}){
 const article=(country,i)=>({id:country+i,title:country==='AR'?`ES: Acciones argentinas en la economía ${i}`:`US stocks and earnings number ${i}`,titleEs:country==='US'?'The shares and earnings rise':null,description:country==='AR'?'ES: La economía argentina muestra cambios en los mercados.':'The company reports new earnings and revenue.',sourceName:country==='AR'?'Ámbito Financiero':'CNBC',url:`https://example.com/${duplicate?'same':country+i}`,publishedAt:now});
 const ar=Array.from({length:missing?2:6},(_,i)=>article('AR',i)),us=Array.from({length:6},(_,i)=>article('US',i)),updates=[];
 const prisma={newsArticle:{findMany:async args=>JSON.stringify(args.where.OR).includes('Ámbito')?ar:us,update:async args=>{updates.push(args);}}};
 const translator={isSpanish:text=>String(text).startsWith('ES:'),translateToSpanish:async text=>failTranslation?'':'ES: Acciones y resultados de empresas en Estados Unidos '+text.replace(/[a-zA-Z ]/g,'')};
 return{service:new NewsletterNewsService(prisma,translator),updates};
}
test('both highlight blocks have four distinct Spanish stories; false Spanish cache never leaks',async()=>{
 const {service,updates}=newsFixture();const data=await service.getHighlights(now);
 assert.equal(data.argentina.length,4);assert.equal(data.unitedStates.length,4);
 assert.equal(new Set([...data.argentina,...data.unitedStates].map(item=>item.url)).size,8);
 assert.ok([...data.argentina,...data.unitedStates].every(item=>item.title.startsWith('ES:')&&item.description.startsWith('ES:')));
 assert.ok(updates.length>=4);
 assert.ok(!JSON.stringify(data).includes('The shares and earnings'));
});
test('a shortfall or failed translation cannot produce an incomplete or English bulletin',async()=>{
 const original=Parser.prototype.parseURL;Parser.prototype.parseURL=async()=>({items:[]});
 try{for(const options of [{missing:true},{failTranslation:true},{duplicate:true}])await assert.rejects(newsFixture(options).service.getHighlights(now),/boletín se reintentará/);}
 finally{Parser.prototype.parseURL=original;}
});
test('daily and weekly audiences include free and Pro users and preserve opt-out and verified address checks',()=>{
 const service=new EmailMarketingService({},{});
 for(const audience of ['DAILY','WEEKLY']){const where=service.recipientWhere(audience);assert.equal(where.plan,undefined);assert.equal(where.subscriptionStatus,undefined);assert.equal(where.investmentEmailNotifications,undefined);assert.equal(where.emailVerified,true);assert.equal(where.status,'ACTIVE');assert.match(JSON.stringify(where),/marketing/);assert.match(JSON.stringify(where),new RegExp(audience.toLowerCase()));}
});
async function quotaFixture(usage,run){
 const savedFetch=global.fetch,keys=['MAIL_PROVIDER','RESEND_API_KEY','EMAIL_FROM','FINIX_LOCAL_MODE'],env=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 const records=new Map(),sent=[];
 const prisma={platformSetting:{findUnique:async({where})=>records.get(where.key)||null,create:async({data})=>{if(records.has(data.key)){const error=Error();error.code='P2002';throw error;}const row={...data,createdAt:new Date(),updatedAt:new Date()};records.set(data.key,row);return row;},update:async({where,data})=>{const row={...records.get(where.key),...data,updatedAt:new Date()};records.set(where.key,row);return row;},upsert:async({where,create,update})=>{records.set(where.key,{...(records.get(where.key)||create),...update,createdAt:new Date(),updatedAt:new Date()});}}};
 try{Object.assign(process.env,{MAIL_PROVIDER:'resend',RESEND_API_KEY:'isolated-test',EMAIL_FROM:'Finix <news@finixarg.com>'});delete process.env.FINIX_LOCAL_MODE;
 global.fetch=async(url,options)=>url.endsWith('/usage')?{ok:true,json:async()=>structuredClone({emails:usage})}:{ok:true,json:async()=>{const data=JSON.parse(options.body);sent.push(data);return{id:'test-'+sent.length};}};
 await run(new ResendQuotaService(prisma),sent,records);
 }finally{global.fetch=savedFetch;for(const key of keys)env[key]===undefined?delete process.env[key]:process.env[key]=env[key];}
}
const usage=(daily,monthly=0)=>({daily:{used:daily,limit:100,resets_at:'2026-10-20T23:59:59.999Z'},monthly:{used:monthly,limit:3000,resets_at:'2026-11-05T00:00:00Z'}});
test('quota warnings use actual account usage and are deduplicated across monitor restarts',()=>quotaFixture(usage(80,2400),async(service,sent,records)=>{
 await service.check();assert.equal(sent.length,2);assert.ok(sent.every(mail=>mail.from.startsWith('Finix <')));for(const mail of sent){assert.deepEqual(mail.to,['juanpablorolo2007@gmail.com']);assert.equal(mail.cc,undefined);assert.equal(mail.bcc,undefined);}
 await service.check();assert.equal(sent.length,2,'no repeated warning at the same threshold');
 assert.ok([...records.values()].filter(row=>row.key.startsWith('resend.quota.alert')).every(row=>JSON.parse(row.value).status==='SENT'));
}));
test('bulk sends wait before exhaustion while preserving room for owner warnings and access emails',()=>quotaFixture(usage(98),async(service,sent)=>{
 const result=await service.bulkAllowance(5);assert.equal(result.count,0);assert.ok(result.retryAt instanceof Date);assert.equal(sent.length,1);
}));
test('unlimited quotas do not create false warnings',()=>quotaFixture({daily:{used:900,limit:null,resets_at:'2026-10-21T00:00:00Z'},monthly:{used:900,limit:null,resets_at:'2026-11-01T00:00:00Z'}},async(service,sent)=>{assert.equal((await service.bulkAllowance(5)).count,5);assert.equal(sent.length,0);}));
test('quota sample is visibly a test rather than a false low-balance alarm',()=>quotaFixture(usage(40),async(service,sent)=>{await service.sendTestAlert();assert.match(sent[0].subject,/PRUEBA/);assert.match(sent[0].text,/No significa que la cuota esté por agotarse/);}));

const {leadingSectorEtf,NEWSLETTER_SECTOR_ETFS}=require('../apps/api/dist/admin/newsletter-sector');
const sectorQuotes=()=>Object.keys(NEWSLETTER_SECTOR_ETFS).map((ticker,i)=>({inputSymbol:'AMEX:'+ticker,symbol:'AMEX:'+ticker,price:100,change:i/10,updatedAt:now.toISOString(),unavailable:false}));
test('sector fallback compares all eleven real ETF quotes and labels the fund reference',()=>{
 const quotes=sectorQuotes(),leader=leadingSectorEtf(quotes);
 assert.equal(leader.proxySymbol,'XLU');assert.equal(leader.name,'Servicios públicos');assert.equal(leader.perf,1);
 assert.equal(leadingSectorEtf(quotes.slice(1)),null);
 for(const patch of [{price:null},{price:0},{change:NaN},{unavailable:true},{symbol:'NASDAQ:FAKE'}])assert.equal(leadingSectorEtf(quotes.map((q,i)=>i===0?{...q,...patch}:q)),null);
});
test('sector fallback preserves negative and zero changes instead of inventing a rising sector',()=>{
 const quotes=sectorQuotes().map(q=>({...q,change:-2}));quotes[0].change=-0.2;
 assert.equal(leadingSectorEtf(quotes).perf,-0.2);quotes[0].change=0;assert.equal(leadingSectorEtf(quotes).perf,0);
});
