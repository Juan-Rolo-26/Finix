// Compare the same local production fixture; argv: output JSON, fixture URL.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[],routes=['/market','/portfolio','/news','/analysis','/calendario','/comunidades','/market/seguimiento'];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/analysis?*',r=>r.fulfill({json:[]}));
 await page.route('**/api/market/dashboard*',r=>r.fulfill({status:503,json:{message:'Fixture provider unavailable'}}));
 try{
  const fixture=process.argv[3]||'http://127.0.0.1:4189';assert.equal(new URL(fixture).hostname,'127.0.0.1');await page.goto(fixture+'/dashboard');await page.getByText('Seguimiento del mercado:',{exact:false}).first().waitFor();
  const results=[];
  for(const phase of ['coldCode','warmCode'])for(const path of routes){
   await page.evaluate(()=>{window.hiddenFrames=0;window.sampleNavigation=true;function sample(){if(!window.sampleNavigation)return;const aside=document.querySelector('aside');if(aside&&!aside.getClientRects().length)window.hiddenFrames++;requestAnimationFrame(sample)}requestAnimationFrame(sample)});const t=performance.now();await page.evaluate(path=>{history.pushState({},'',path);dispatchEvent(new PopStateEvent('popstate'));},path);
   await page.waitForFunction(()=>{const m=document.querySelector('main');return m&&m.innerText.trim().length>10&&!m.querySelector('[aria-label="Cargando sección"]');});
   await page.waitForTimeout(200);assert.ok(!(await page.locator('main').innerText()).includes('Error al cargar la página'),'Unexpected route error: '+path);const hiddenFrames=await page.evaluate(()=>{window.sampleNavigation=false;return window.hiddenFrames});results.push({phase,path,hiddenFrames,shellMs:performance.now()-t,heading:await page.locator('main').innerText().then(s=>s.slice(0,160))});
  }
  if (process.env.FINIX_TEST_RECOVERY === 'true') {
   // The fixture's default {} is deliberately malformed. Market should recover
   // locally; a catalog render failure must not strand every following route.
   await page.unroute('**/api/market/dashboard*');
   await page.evaluate(()=>{history.pushState({},'','/market');dispatchEvent(new PopStateEvent('popstate'));});
   await page.getByText('No pudimos cargar las cotizaciones.',{exact:true}).waitFor();
   assert.equal(await page.getByText('Error al cargar la página',{exact:true}).count(),0);
   await page.unroute('**/api/analysis?*');
   await page.evaluate(()=>{history.pushState({},'','/analysis');dispatchEvent(new PopStateEvent('popstate'));});
   await page.getByText('Error al cargar la página',{exact:true}).waitFor();
   await page.evaluate(()=>{history.pushState({},'','/portfolio');dispatchEvent(new PopStateEvent('popstate'));});
   await page.getByRole('heading',{name:'Mi Portfolio',exact:true}).waitFor();
   assert.equal(await page.getByText('Error al cargar la página',{exact:true}).count(),0);
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(process.argv[2]||'/tmp/finix-navigation.json',JSON.stringify({conditions:'Production SPA, same local synthetic API and desktop viewport. shellMs includes a deliberate 200ms stabilization wait; measures shell/error/empty state, not complete financial data.',results,errors,recoveryVerified:process.env.FINIX_TEST_RECOVERY==='true'},null,2));console.log(JSON.stringify(results));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
