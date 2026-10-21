const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { renderPublicationEmail, isOfficialPublisher } = require('../apps/api/dist/posts/publication-email');
const { EmailMarketingService } = require('../apps/api/dist/admin/email-marketing.service');
const { MarketService } = require('../apps/api/dist/market/market.service');
const author = { id:'official', username:'finixarg', role:'ADMIN', isVerified:true, status:'ACTIVE' };
test('only the active, verified official admin account can announce publications',()=>{
 process.env.FINIX_OFFICIAL_USER_ID='official';
 assert.equal(isOfficialPublisher(author),true);
 for(const patch of [{id:'other'},{isVerified:false},{role:'USER'},{status:'SUSPENDED'}]) assert.equal(isOfficialPublisher({...author,...patch}),false);
 delete process.env.FINIX_OFFICIAL_USER_ID;
 assert.equal(isOfficialPublisher({...author,username:'finix_oficial'}),false);
 assert.equal(isOfficialPublisher(author),true);
});
test('publication email foregrounds escaped content and a working canonical link',()=>{
 const html=renderPublicationEmail({message:'<script>bad</script>\nSegundo párrafo',ctaUrl:'https://finixarg.com/posts/abc',ticker:'NASDAQ:META'});
 assert.match(html,/max-width:768px/);assert.match(html,/Cuenta oficial/);assert.match(html,/\/posts\/abc/);
 assert.match(html,/Cancelar suscripción/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|Control Center|ID Publicación/);
 assert.doesNotMatch(renderPublicationEmail({admin:true,message:'Finix',ctaUrl:'https://finixarg.com/posts/abc'}),/unsubscribe_url/);
 assert.throws(()=>renderPublicationEmail({message:'x',ctaUrl:'javascript:alert(1)'}));
});
test('fresh prices bypass cache and retain provider delay and session, not a fake last-trade timestamp',async()=>{
 const market=new MarketService({}),oldFetch=global.fetch;let calls=0;
 global.fetch=async()=>({ok:true,status:200,json:async()=>{calls++;return {data:[{s:'NASDAQ:AAPL',d:[100+calls,1,1,1,1,null,null,1000,'delayed_streaming_900',1792589400]}]};}});
 try{
  const a=(await market.getQuotes(['NASDAQ:AAPL']))[0],b=(await market.getQuotes(['NASDAQ:AAPL']))[0];
  assert.equal(calls,1);assert.equal(a.price,b.price);
  const c=(await market.getQuotes(['NASDAQ:AAPL'],{fresh:true}))[0];assert.equal(calls,2);assert.notEqual(a.price,c.price);
  assert.equal(c.dataDelaySeconds,900);assert.equal(c.referenceSessionAt,'2026-10-21T13:30:00.000Z');assert.ok(c.queriedAt);
  global.fetch=async()=>{throw Error('offline');};
  assert.equal((await market.getQuotes(['NASDAQ:AAPL'],{fresh:true}))[0].unavailable,true);
  market.dollarRatesCache={data:[{id:'oficial',sell:100}],timestamp:Date.now()};
  assert.deepEqual(await market.getDollarRates(true),[]);
 }finally{global.fetch=oldFetch;}
});
function workerFixture(sourceKey){
 const row={id:'recipient',campaignId:'campaign',userId:'user',email:'recipient@example.org',status:'QUEUED',attempts:0,queuedAt:new Date(),firstAttemptAt:null,renderedContent:null};
 const campaign={id:'campaign',status:'SENDING',sourceKey,audience:'DAILY',audienceReady:true,subject:'Daily',message:'OLD',contentHtml:'OLD',createdAt:new Date()};
 const sent=[];let fail=true;
 const prisma={proEmailCampaign:{findUnique:async()=>({...campaign}),update:async()=>({})},user:{findFirst:async()=>({id:'user'})},emailCampaignRecipient:{findMany:async()=>[{...row}],updateMany:async({data})=>{Object.assign(row,data);return {count:1};},update:async({data})=>{Object.assign(row,data);return {};},count:async()=>0},emailEvent:{create:async()=>({})},$transaction:async arr=>Promise.all(arr)};
 const service=new EmailMarketingService(prisma,{sendEmail:async input=>{sent.push(input);if(fail)throw Error('uncertain');return {id:'provider'};}});
 return {row,sent,service,recover:()=>fail=false};
}
test('first delivery refreshes prices, uncertain retry reuses the identical immutable payload',async()=>{
 process.env.EMAIL_SEND_ENABLED='true';process.env.JWT_SECRET='test-only-secret';
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const f=workerFixture('finix-approved:daily:'+day);let renders=0;
 f.service.setDailyBriefRenderer(async()=>{renders++;return {html:'FRESH {{unsubscribe_url}}',message:'Fresh data',day};});
 await f.service.processBatch('campaign');assert.equal(renders,1);assert.ok(f.row.renderedContent);assert.ok(f.row.firstAttemptAt);
 f.recover();f.row.nextAttemptAt=new Date(0);await f.service.processBatch('campaign');
 assert.equal(renders,1);assert.deepEqual(f.sent[0],f.sent[1]);assert.equal(f.row.status,'SENT');
});
test('an expired daily campaign cannot acquire prices for another day',async()=>{
 const f=workerFixture('finix-approved:daily:2000-01-01');f.service.setDailyBriefRenderer(async()=>{throw Error('must not render');});
 await f.service.processBatch('campaign');assert.equal(f.row.status,'SKIPPED');assert.equal(f.sent.length,0);
});
