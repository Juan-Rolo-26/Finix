const assert=require('node:assert/strict');const{chromium}=require('playwright');const{writeFileSync}=require('node:fs');
const{setup,capture,widths,BASE,OUT}=require('./auditoria-ux-vscode.browser.cjs');const{integrationFixtures}=require('./auditoria-integracion-fixtures.cjs');
const results=[];const record=(id,detail)=>{results.push({id,result:'passed',...detail});writeFileSync(`${OUT}/integracion-adicional.json`,JSON.stringify(results,null,2));console.log(id,detail.width,detail.theme);};
(async()=>{const browser=await chromium.launch({headless:true});try{
for(const theme of ['light','dark'])for(const width of widths){
 const{page,errors,writes}=await setup(browser,{theme,width,guest:false});await integrationFixtures(page);
 await page.goto(BASE+'/market');await page.getByRole('tab',{name:'Pre-Market',exact:true}).waitFor();
 const tabs=page.locator('.market-tabs [role="tab"]');const names=await tabs.allTextContents();
 for(let i=0;i<names.length;i++){
  const tab=tabs.nth(i);await tab.scrollIntoViewIfNeeded();await tab.click();assert.equal(await tab.getAttribute('aria-selected'),'true');
  const controlled=await tab.getAttribute('aria-controls');await page.locator(`[id="${controlled}"]`).waitFor();
  const box=await tab.boundingBox();assert.ok(box.height>=43.9&&box.width>=43.9,JSON.stringify({name:names[i],box}));
 }
 const rects=await tabs.evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return{x:r.x,right:r.right};}));assert.ok(rects.every((r,i)=>!i||r.x>=rects[i-1].right));
 await page.getByRole('tab',{name:'Pre-Market',exact:true}).click();await page.getByText('Sin corte bursátil guardado',{exact:true}).waitFor();
 assert.ok(!(await page.locator('body').innerText()).includes('1970'));
 assert.ok(await page.getByText('09:30',{exact:false}).first().isVisible());
 assert.equal(await page.getByRole('meter',{name:'Clima de mercado'}).count(),0,'no fabricated sentiment with no quotes');
 await capture(page,`integracion-mercado-tabs-${width}-${theme}`);record('FINIX-02/23',{width,theme,names,realWrites:0});
 await page.goto(BASE+'/dashboard');const expand=page.getByRole('button',{name:'Leer más',exact:true}).first();const quoteId=await expand.getAttribute('aria-controls');await expand.focus();await page.keyboard.press('Enter');
 await page.waitForFunction(id=>document.querySelector('button[aria-controls="'+id+'"]').getAttribute('aria-expanded')==='true',quoteId);const content=page.locator(`[id="${quoteId}"]`);assert.ok((await content.innerText()).endsWith('FINAL DE LA CITA'));assert.equal(await content.evaluate(el=>getComputedStyle(el).webkitLineClamp),'none');
 await capture(page,`integracion-cita-expandida-${width}-${theme}`);record('FINIX-14',{width,theme});
 await page.goto(BASE+'/settings');await page.getByRole('tab',{name:/Privacidad/}).click();
 const switches=page.getByRole('switch');assert.ok(await switches.count());
 const named=await switches.evaluateAll(els=>els.map(el=>({name:el.getAttribute('aria-label')||document.querySelector(`label[for="${el.id}"]`)?.textContent,state:el.getAttribute('aria-checked'),height:el.getBoundingClientRect().height})));
 assert.ok(named.every(s=>s.name&&s.state&&s.height>=43.9));record('FINIX-15',{width,theme,switches:named});
 await page.goto(BASE+'/comunidades/crear');await page.getByRole('heading',{name:/Crear.*comunidad/i}).first().waitFor();
 const cards=page.locator('button[aria-pressed]');const cardData=await cards.evaluateAll(els=>els.map(el=>({text:el.innerText,height:el.getBoundingClientRect().height,clipped:el.scrollHeight>el.clientHeight+1})));
 assert.ok(cardData.length>=4&&cardData.every(c=>!c.clipped&&c.height>=44));record('FINIX-25',{width,theme,cards:cardData});
 assert.deepEqual(errors,[]);assert.ok(!writes.some(path=>path.includes('communities')||path.includes('contact')));await page.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
