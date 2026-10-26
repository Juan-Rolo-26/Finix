const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const pm2=path.join(root,'.local/finix/ops-tools/node_modules/.bin/pm2');
test('isolated PM2 cold restart ignores obsolete saved credentials and persists the corrected release',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'finix-reboot-'));
 const env={...process.env,PM2_HOME:path.join(temp,'pm2'),FINIX_ROOT:path.join(temp,'release'),FINIX_LOG_DIR:path.join(temp,'logs'),FINIX_COMMIT:'restart-fixture'};
 const api=path.join(env.FINIX_ROOT,'apps/api'),state=path.join(temp,'runtime.json');
 const cli=args=>{const result=spawnSync(pm2,args,{env,encoding:'utf8',timeout:30000});assert.equal(result.status,0,result.stderr);return result.stdout;};
 const probe=async expected=>{for(let i=0;i<80;i++){try{const value=JSON.parse(fs.readFileSync(state));if(value.token===expected)return value;}catch{}await new Promise(r=>setTimeout(r,100));}throw new Error('Expected release config was not loaded after restart');};
 try{
  fs.mkdirSync(path.join(api,'dist/config'),{recursive:true});fs.mkdirSync(path.join(env.FINIX_ROOT,'ops'));fs.mkdirSync(env.FINIX_LOG_DIR);
  fs.symlinkSync(path.join(root,'node_modules'),path.join(temp,'node_modules'),'dir');
  fs.copyFileSync(path.join(root,'apps/api/dist/config/runtime-environment.js'),path.join(api,'dist/config/runtime-environment.js'));
  fs.copyFileSync(path.join(root,'ops/ecosystem.config.cjs'),path.join(env.FINIX_ROOT,'ops/ecosystem.config.cjs'));
  fs.writeFileSync(path.join(api,'dist/main.js'),`require('./config/runtime-environment');require('fs').writeFileSync(${JSON.stringify(state)},JSON.stringify({token:process.env.MP_ACCESS_TOKEN,email:process.env.FINIX_APPROVED_EMAILS_ENABLED,stripe:process.env.STRIPE_CHECKOUT_ENABLED}));setInterval(()=>{},10000);`);
  const config=token=>`MP_ACCESS_TOKEN=${token}\nFINIX_APPROVED_EMAILS_ENABLED=true\nSTRIPE_CHECKOUT_ENABLED=false\n`;
  fs.writeFileSync(path.join(api,'.env'),config('obsolete-test-fixture'),{mode:0o600});
  const idle=path.join(temp,'unrelated.js');fs.writeFileSync(idle,'setInterval(()=>{},10000);');
  cli(['start',idle,'--name','unrelated-fixture']);
  cli(['startOrReload',path.join(env.FINIX_ROOT,'ops/ecosystem.config.cjs'),'--only','finix-api','--env','production','--update-env']);
  await probe('obsolete-test-fixture');cli(['save']);cli(['kill']);
  fs.writeFileSync(path.join(api,'.env'),config('current-real-fixture'),{mode:0o600});fs.unlinkSync(state);
  cli(['resurrect']);
  assert.deepEqual(await probe('current-real-fixture'),{token:'current-real-fixture',email:'true',stripe:'false'});
  const savedBefore=JSON.parse(fs.readFileSync(path.join(env.PM2_HOME,'dump.pm2'))).find(p=>p.name==='finix-api');
  assert.equal(savedBefore.MP_ACCESS_TOKEN,'obsolete-test-fixture');
  const otherPid=JSON.parse(cli(['jlist'])).find(p=>p.name==='unrelated-fixture').pid;
  cli(['startOrReload',path.join(env.FINIX_ROOT,'ops/ecosystem.config.cjs'),'--only','finix-api','--env','production','--update-env']);
  await probe('current-real-fixture');cli(['save']);
  assert.equal(JSON.parse(cli(['jlist'])).find(p=>p.name==='unrelated-fixture').pid,otherPid);
  const saved=JSON.parse(fs.readFileSync(path.join(env.PM2_HOME,'dump.pm2'))).find(p=>p.name==='finix-api');assert.equal(saved.MP_ACCESS_TOKEN,'current-real-fixture');
  cli(['kill']);fs.unlinkSync(state);cli(['resurrect']);
  assert.deepEqual(await probe('current-real-fixture'),{token:'current-real-fixture',email:'true',stripe:'false'});
 }finally{
  // This PM2 daemon belongs only to this disposable fixture.
  spawnSync(pm2,['kill'],{env,encoding:'utf8',timeout:30000});fs.rmSync(temp,{recursive:true,force:true});
 }
});
