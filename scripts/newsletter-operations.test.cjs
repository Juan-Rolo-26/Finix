const {test}=require('node:test');
const assert=require('node:assert/strict');
require('reflect-metadata');
const {NewsletterNewsService}=require('../apps/api/dist/admin/newsletter-news.service');
const {ResendQuotaService}=require('../apps/api/dist/mail/resend-quota.service');
const {EmailMarketingService}=require('../apps/api/dist/admin/email-marketing.service');
const Parser=require('rss-parser');
const now=new Date('2026-10-20T19:00:00Z');
function newsFixture({missing=false,failTranslation=false,duplicate=false}={}){
 const arTitles=['ES: El dólar argentino cierra en alza','ES: La inflación argentina se desacelera','ES: YPF anuncia una inversión en Argentina','ES: El BCRA aumenta las reservas argentinas','ES: El empleo argentino crece','ES: El PBI de Argentina se expande'];
 const usTitles=['Tesla and SpaceX discuss a merger','Meta earnings grow this quarter','Nvidia announces a new chip','Federal Reserve reviews interest rates','Amazon opens a warehouse','Apple presents a new device'];
 const usSpanish=['ES: Tesla y SpaceX estudian una fusión','ES: Meta mejora sus ganancias trimestrales','ES: Nvidia anuncia un nuevo procesador','ES: La Reserva Federal revisa las tasas de interés','ES: Amazon abre un centro logístico','ES: Apple presenta un dispositivo'];
 const article=(country,i)=>({id:country+i,title:country==='AR'?arTitles[i]:usTitles[i],titleEs:country==='US'?'The shares and earnings rise':null,description:country==='AR'?'ES: La economía argentina muestra cambios en los mercados.':'The company reports new revenue.',sourceName:country==='AR'?'Ámbito Financiero':'CNBC',url:`https://example.com/${duplicate?'same':country+i}`,publishedAt:now});
 const ar=Array.from({length:missing?2:6},(_,i)=>article('AR',i)),us=Array.from({length:6},(_,i)=>article('US',i)),updates=[];
 const prisma={newsArticle:{findMany:async args=>JSON.stringify(args.where.OR).includes('Ámbito')?ar:us,update:async args=>{updates.push(args);}}};
 const translator={isSpanish:text=>String(text).startsWith('ES:'),translateToSpanish:async text=>failTranslation?'':usTitles.includes(text)?usSpanish[usTitles.indexOf(text)]:'ES: La compañía informa nuevas ventas.'};
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

test('US block excludes foreign-only headlines even when syndicated descriptions mention US markets',async()=>{
 const now=new Date('2026-10-20T19:00:00Z');
 const story=(title,i,description='ES: La noticia explica el movimiento de mercado.')=>({id:String(i),title,titleEs:title,description,descriptionEs:description,sourceName:'Bloomberg',url:'https://example.com/region-'+i,publishedAt:now});
 const ar=['ES: El dólar argentino sube','ES: La inflación argentina se desacelera','ES: YPF anuncia una inversión en Argentina','ES: El BCRA aumenta las reservas argentinas'].map((title,i)=>({...story(title,'ar'+i),sourceName:'Ámbito Financiero'}));
 const foreign=[story('ES: Las acciones de CATL en Hong Kong baten un récord','cn','ES: Wall Street: Bloomberg es su fuente definitiva de noticias.'),story('ES: FTSE 100: los futuros del Reino Unido se mantienen estables','uk')];
 const us=[story('ES: Tesla sube tras sus resultados',1),story('ES: Wall Street: la bolsa avanza',2),story('ES: NVIDIA presenta nuevos productos',3),story('ES: La Reserva Federal analiza la inflación',4)];
 const prisma={newsArticle:{findMany:async args=>JSON.stringify(args.where.OR).includes('Ámbito')?ar:[...foreign,...us],update:async()=>{}}};
 const translator={isSpanish:text=>String(text).startsWith('ES:'),translateToSpanish:async()=>''};
 const result=await new NewsletterNewsService(prisma,translator).getHighlights(now);
 assert.deepEqual(result.unitedStates.map(s=>s.url),us.map(s=>s.url));
 assert.equal(result.unitedStates[0].title,us[0].title);
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

const {NewsletterTopicTracker,newsletterTopicSignature}=require('../apps/api/dist/admin/newsletter-news-topics');
function topicSequence(titles,region='US') {const tracker=new NewsletterTopicTracker();return titles.map(title=>{const signature=newsletterTopicSignature({title},region),duplicate=tracker.isDuplicate(signature);if(!duplicate)tracker.add(signature);return duplicate;});}
test('different sources, languages and wording cannot repeat Tesla/SpaceX or the same corporate theme',()=>{
 assert.deepEqual(topicSequence(['Musk explora una megafusión entre Tesla y SpaceX','Elon Musk backs a Tesla-SpaceX merger','Tesla sube después de publicar sus resultados','Salesforce announces an acquisition','Meta anuncia sus ganancias trimestrales','Netflix earnings disappoint investors']),[false,true,true,true,false,true]);
});
test('Argentine dollar coverage does not crowd out inflation, investment and monetary policy',()=>{
 assert.deepEqual(topicSequence(['El dólar oficial sube mientras cambia el escenario argentino','Dólar e inflación: nuevas proyecciones para Argentina','La inflación argentina registra una nueva baja','YPF inaugura un proyecto de inversión','El BCRA publica su decisión de tasas'],'AR'),[false,true,false,false,false]);
});
test('syndicated event fingerprints deduplicate across the two regions; generic descriptions do not create themes',()=>{
 const tracker=new NewsletterTopicTracker(),first=newsletterTopicSignature({title:'YPF anuncia una inversión',eventFingerprint:'same-event'},'AR');tracker.add(first);
 assert.ok(tracker.isDuplicate(newsletterTopicSignature({title:'A completely different translated headline',eventFingerprint:'same-event'},'US')));
 assert.deepEqual(topicSequence(['Nvidia anuncia un nuevo chip','Microsoft amplía su nube','La Reserva Federal mantiene las tasas']),[false,false,false]);
 assert.ok(!newsletterTopicSignature({title:'La meta de inflación cambia en Argentina'},'AR').keys.includes('company:meta'));
});
test('unclassified near-copy headlines are recognized without sharing a known company name',()=>{
 assert.deepEqual(topicSequence(['Omega insurance wins a major court ruling over hurricane losses','Omega insurance wins major court ruling over hurricane losses again']),[false,true]);
});
test('a lack of four distinct topics never relaxes the requirement to repeat stories',async()=>{
 const original=Parser.prototype.parseURL;Parser.prototype.parseURL=async()=>({items:[]});
 try{const {service}=newsFixture();const get=service.prisma.newsArticle.findMany;service.prisma.newsArticle.findMany=async args=>JSON.stringify(args.where.OR).includes('Ámbito')?get(args):Array.from({length:8},(_,i)=>({title:'Tesla and SpaceX discuss a merger '+i,titleEs:'ES: Tesla y SpaceX estudian una fusión '+i,descriptionEs:'ES: La operación combina negocios.',sourceName:i%2?'Bloomberg':'CNBC',url:'https://example.com/repeat-'+i,publishedAt:now}));await assert.rejects(service.getHighlights(now),/temáticas distintas/);}finally{Parser.prototype.parseURL=original;}
});
