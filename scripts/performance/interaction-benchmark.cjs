// Real Chromium interactions with web-vitals4; synthetic API, not field INP.
// argv: fixture URL, web-vitals.iife.js path, JSON output.
const fs = require('node:fs'), assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async()=>{
 const [url, library, output] = process.argv.slice(2);
 assert.ok(new URL(url).hostname==='127.0.0.1','Use the local fixture server');
 const browser = await chromium.launch({headless:true});
 const results=[];
 try {for(let i=0;i<Number(process.env.PERFORMANCE_RUNS||3);i++){
  const page=await browser.newPage({viewport:{width:1365,height:900}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript({content:fs.readFileSync(library,'utf8')+`;window.inpResults=[];window.pointerEvents=[];document.addEventListener("pointerdown",e=>window.pointerEvents.push({at:performance.now(),title:e.target.closest?.("[title]")?.getAttribute("title")||e.target.textContent?.slice(0,40)}),true);webVitals.onINP(m=>window.inpResults.push({value:m.value,entries:m.entries.map(e=>({name:e.name,startTime:e.startTime,duration:e.duration,interactionId:e.interactionId,target:e.target?.getAttribute?.("title")||e.target?.textContent?.slice(0,60),inputDelay:e.processingStart-e.startTime,processingMs:e.processingEnd-e.processingStart}))}),{reportAllChanges:true,durationThreshold:0});`});
  const session=await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.goto(url+'/dashboard');
  await page.getByText('Seguimiento del mercado:',{exact:false}).first().waitFor();
  await page.waitForTimeout(1000);
  const initialScripts=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.js')).map(r=>r.name));
  for(let j=0;j<4;j++) {
   await page.locator('[title="Cambiar a modo oscuro"], [title="Cambiar a modo claro"]').first().click();
   await page.waitForTimeout(120);
   await page.locator('[title="Colapsar sidebar"], [title="Expandir sidebar"]').first().click();
   await page.waitForTimeout(120);
   await page.locator('[title="Expandir sidebar"]').first().click();
   await page.waitForTimeout(120);
  }
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder('Buscar en Finix o pedir a la IA...').waitFor();
  await page.getByPlaceholder('Buscar en Finix o pedir a la IA...').fill('Apple');
  await page.waitForTimeout(800);
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  const metrics=await page.evaluate(()=>({inp:window.inpResults,interactionCount:performance.interactionCount,pointerEvents:window.pointerEvents}));
  assert.deepEqual(errors,[]);
  assert.ok(metrics.inp.length>0,'INP observer must report actual interactions');
  results.push({run:i+1,...metrics,initialScripts});await page.close();
 }
 fs.writeFileSync(output,JSON.stringify({conditions:'3 independent desktop Chromium sessions, CPU x4, 12 theme/sidebar clicks plus global search typing, web-vitals4.2.4; laboratory INP, not field/RUM.',results},null,2));
 console.log(JSON.stringify(results.map(r=>({run:r.run,inp:r.inp.at(-1).value,interactionCount:r.interactionCount}))));
 }finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
