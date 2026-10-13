// Isolated fixtures: no live account, payment, email, or identity document.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ transpileOnly: true, skipProject: true, compilerOptions: { module: 'CommonJS', target: 'ES2022', experimentalDecorators: true, emitDecoratorMetadata: true } });
const { SettingsService } = require('../apps/api/src/settings/settings.service');
const { isOwnedVerificationDocument, validVerificationSignature } = require('../apps/api/src/settings/verification-storage');
test('settings preserves stored email opt-out and handles legacy JSON', async () => {
 for (const stored of ['{"email":false,"push":true}', {email:false,push:false}, 'bad json']) {
  let select;
  const service = new SettingsService({user:{findUnique:async options => {select=options.select; return {id:'fixture',notificationPrefs:stored};}}});
  const data=await service.getSettings('fixture');
  assert.equal(select.notificationPrefs,true);
  assert.equal(data.notificationPrefs.email, stored==='bad json');
 }
});
test('preferences use explicit column updates, retaining false and partial patches', async () => {
 const writes=[];
 const service=new SettingsService({user:{update:async options=>writes.push(options)}});
 await service.updatePreferences('fixture',{language:'en-US',currency:'ARS',theme:'light',autoRefreshMarket:false});
 await service.updatePreferences('fixture',{currency:'USD'});
 assert.deepEqual(writes[0].data,{language:'en-US',currency:'ARS',theme:'light',autoRefreshMarket:false});
 assert.deepEqual(writes[1].data,{currency:'USD'});
 await assert.rejects(()=>service.updatePreferences('fixture',{language:'fr-FR'}));
 assert.equal(writes.length,2);
});
test('private verification paths require an existing owned file and reject traversal/symlinks', () => {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'finix-verification-test-'));
 const prior=process.env.FINIX_PRIVATE_STORAGE_DIR;
 process.env.FINIX_PRIVATE_STORAGE_DIR=root;
 try {
  fs.mkdirSync(path.join(root,'financial-verifications'));
  fs.writeFileSync(path.join(root,'financial-verifications/fixture-123.pdf'),'%PDF-1.7 synthetic');
  assert.equal(isOwnedVerificationDocument('financial-verifications/fixture-123.pdf','fixture'),true);
  for(const input of ['financial-verifications/other-123.pdf','financial-verifications/fixture-missing.pdf','financial-verifications/../fixture-123.pdf','/uploads/public.pdf']) assert.equal(isOwnedVerificationDocument(input,'fixture'),false);
  const outside=path.join(os.tmpdir(),'finix-synthetic-outside.pdf');
  fs.writeFileSync(outside,'%PDF-fixture');
  fs.symlinkSync(outside,path.join(root,'financial-verifications/fixture-link.pdf'));
  assert.equal(isOwnedVerificationDocument('financial-verifications/fixture-link.pdf','fixture'),false);
  fs.unlinkSync(outside);
 } finally { fs.rmSync(root,{recursive:true,force:true}); if(prior===undefined) delete process.env.FINIX_PRIVATE_STORAGE_DIR; else process.env.FINIX_PRIVATE_STORAGE_DIR=prior; }
});
test('verification files reject HTML disguised as a document', () => {
 assert.equal(validVerificationSignature(Buffer.from('%PDF-1.7'), 'application/pdf'),true);
 assert.equal(validVerificationSignature(Buffer.from('<html>fake</html>'), 'application/pdf'),false);
 assert.equal(validVerificationSignature(Buffer.from([137,80,78,71,13,10,26,10]), 'image/png'),true);
 assert.equal(validVerificationSignature(Buffer.from('RIFF0000WEBP'), 'image/webp'),true);
 assert.equal(validVerificationSignature(Buffer.from('<svg>'), 'image/svg+xml'),false);
});
test('verification rejects blank required data before database writes', async () => {
 const service=new SettingsService({});
 await assert.rejects(()=>service.submitVerification('fixture',{fullName:'   ',documentNumber:'123',registrationNumber:'456'}));
});

const { NotificationsService } = require('../apps/api/src/notifications/notifications.service');
test('market notification preference suppresses actual alerts without disabling security', async () => {
 let inserted=0;
 const service=new NotificationsService({user:{findUnique:async()=>({marketNotifications:false,notificationPrefs:'{"markets":true}'})}, notification:{create:async()=>{inserted++; return {};}}},{});
 assert.equal(await service.checkPreferences('fixture','MARKET'),false);
 assert.equal(await service.checkPreferences('fixture','SECURITY'),true);
 assert.equal(await service.createNotification({userId:'fixture',type:'MARKET_PRICE_ALERT',title:'Synthetic market alert'}),null);
 assert.equal(inserted,0);
});
test('enabling market alerts still respects category-specific opt-outs', async () => {
 for (const [prefs,want] of [['{"markets":false}',false],['{"markets":true}',true],['{}',true]]) {
  const service=new NotificationsService({user:{findUnique:async()=>({marketNotifications:true,notificationPrefs:prefs})}},{});
  assert.equal(await service.checkPreferences('fixture','MARKET'),want);
 }
});
test('invalid timezone fails before persistence', async()=>{
 let writes=0;
 const service=new SettingsService({user:{update:async()=>writes++}});
 await assert.rejects(()=>service.updatePreferences('fixture',{timezone:'Mars/Phobos'}));
 assert.equal(writes,0);
 await service.updatePreferences('fixture',{timezone:'America/New_York'});
 assert.equal(writes,1);
});
