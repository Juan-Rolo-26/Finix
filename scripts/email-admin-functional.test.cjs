const {test}=require('node:test');const assert=require('node:assert/strict');require('reflect-metadata');
const {isCurrentDailyCampaign}=require('../apps/api/dist/admin/newsletter-day');
const {EmailMarketingService}=require('../apps/api/dist/admin/email-marketing.service');
const {AlertsController}=require('../apps/api/dist/alerts/alerts.controller');
const {AlertsService}=require('../apps/api/dist/alerts/alerts.service');
test('daily keys produced by scheduler survive the worker date check, including ART midnight',()=>{
 const now=new Date('2026-10-23T02:59:59Z');
 for(const key of ['22 de octubre de 2026','2026-10-22'])assert.equal(isCurrentDailyCampaign('finix-approved:daily:'+key,now),true);
 assert.equal(isCurrentDailyCampaign('finix-approved:daily:21 de octubre de 2026',now),false);
 assert.equal(isCurrentDailyCampaign('finix-approved:daily:22 de octubre de 2026',new Date('2026-10-23T03:00:00Z')),false);
 assert.equal(isCurrentDailyCampaign('finix-approved:weekly:2026-10-22',now),false);
});
test('manual audience follows current email consent rather than obsolete premium notification flag',()=>{
 const service=new EmailMarketingService({},{}),all=service.recipientWhere('ALL'),pro=service.recipientWhere('PRO');
 assert.equal(all.investmentEmailNotifications,undefined);assert.equal(all.emailVerified,true);assert.equal(all.status,'ACTIVE');assert.match(JSON.stringify(all),/marketing.*analysis/);assert.equal(pro.plan,'PRO');
});
test('an admin-approved manual campaign can run without releasing the old global backlog',()=>{
 const old={global:process.env.EMAIL_SEND_ENABLED,approved:process.env.FINIX_APPROVED_EMAILS_ENABLED};
 try{process.env.EMAIL_SEND_ENABLED='false';process.env.FINIX_APPROVED_EMAILS_ENABLED='true';const service=new EmailMarketingService({},{});
 assert.equal(service.canSendCampaign({sourceKey:'finix-approved:manual:uuid'}),true);assert.equal(service.canSendCampaign({sourceKey:null}),false);
 }finally{for(const [key,val]of [['EMAIL_SEND_ENABLED',old.global],['FINIX_APPROVED_EMAILS_ENABLED',old.approved]])val===undefined?delete process.env[key]:process.env[key]=val;}
});
test('public check requires authentication and scopes evaluations to the authenticated user',async()=>{
 const seen=[];const controller=new AlertsController({checkActiveAlerts:async id=>{seen.push(id);return{checked:1};}},{user:{findUnique:async()=>({id:'owner'})}});
 await assert.rejects(controller.triggerCheck({}),/Iniciá sesión/);assert.equal((await controller.triggerCheck({user:{id:'owner'}})).checked,1);assert.deepEqual(seen,['owner']);
});
test('invalid alert targets, destinations and mismatched percentage conditions never reach storage',async()=>{
 const service=new AlertsService({}, {}, {});
 for(const extra of [{targetValue:-1},{notificationChannel:'FAKE'},{destinationEmail:'bad'},{alertType:'PRICE_TARGET',condition:'CHANGE_PCT_UP'}])await assert.rejects(service.createAlert('owner',{ticker:'AAPL',targetValue:100,condition:'GREATER_THAN',...extra}));
});
test('retry excludes uncertain attempts outside provider idempotency window',async()=>{
 let where;const service=new EmailMarketingService({emailCampaignRecipient:{updateMany:async args=>{where=args.where;return{count:0};}}},{});
 assert.deepEqual(await service.retryFailedRecipients('campaign'),{retried:0});assert.equal(where.status,'FAILED');assert.ok(where.OR[1].firstAttemptAt.gte instanceof Date);assert.equal(where.campaignId,'campaign');
});

test('both automatic jobs start at 17 ART and Friday has daily plus weekly dispatch',()=>{
 const {NewsletterScheduler}=require('../apps/api/dist/admin/newsletter.scheduler');const {SCHEDULE_CRON_OPTIONS}=require('@nestjs/schedule/dist/schedule.constants');const {CronTime}=require('cron');
 for(const [method,days]of [['daily','1-5'],['friday','5']]){const options=Reflect.getMetadata(SCHEDULE_CRON_OPTIONS,NewsletterScheduler.prototype[method]);assert.equal(options.timeZone,'America/Argentina/Buenos_Aires');assert.equal(options.cronTime,'*/10 17-21 * * '+days);const next=new CronTime(options.cronTime,options.timeZone).getNextDateFrom(new Date('2026-10-23T19:59:59Z'),'America/Argentina/Buenos_Aires');assert.equal(next.toUTC().toISO(),'2026-10-23T20:00:00.000Z');}
});
