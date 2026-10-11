const assert=require('node:assert/strict');const{chromium}=require('playwright');const{writeFileSync}=require('node:fs');const{setup,capture,widths,BASE,OUT}=require('./auditoria-ux-vscode.browser.cjs');
(async()=>{const phase=process.argv[2]||'antes',results=[];const browser=await chromium.launch({headless:true});try{
 for(const theme of ['light','dark'])for(const width of phase==='antes'?[390]:widths){
  const{page}=await setup(browser,{width,theme,guest:false});await page.goto(BASE+'/explore');const open=page.getByRole('button',{name:'Crear publicación',exact:true}).filter({visible:true}).first();await open.click();
  const modal=page.getByRole('dialog');await modal.waitFor();const textarea=modal.locator('textarea');await textarea.waitFor();
  const initialInside=await modal.evaluate(el=>el.contains(document.activeElement));
  await page.evaluate(()=>{const dialog=document.querySelector('[role="dialog"]');[...document.querySelectorAll('button')].find(el=>!dialog.contains(el)&&el.getBoundingClientRect().width)?.focus();});
  const backgroundIsolated=await modal.evaluate(el=>el.contains(document.activeElement));
  if(phase!=='antes'){
   assert.ok(initialInside&&backgroundIsolated);
   await textarea.fill('Texto de prueba local; no se publicará.');
   let held,resolve;const intercepted=new Promise(r=>resolve=r);
   await page.route('**/api/posts',route=>{if(route.request().method()==='POST'){held=route;resolve();}else return route.fallback();});
   await modal.getByRole('button',{name:'Crear en feed',exact:true}).click();await intercepted;await page.keyboard.press('Escape');assert.ok(await modal.isVisible());
   await held.fulfill({status:503,json:{message:'Error de prueba interceptado'}});await modal.getByRole('button',{name:'Crear en feed',exact:true}).waitFor();
   assert.equal(await textarea.inputValue(),'Texto de prueba local; no se publicará.');
  }
  await capture(page,`integracion-${phase}-publicacion-${width}-${theme}`);
  await page.keyboard.press('Escape');await modal.waitFor({state:'hidden'});await page.waitForTimeout(250);
  const returned=await open.evaluate(el=>el===document.activeElement);if(phase!=='antes')assert.ok(returned);
  results.push({width,theme,initialInside,backgroundIsolated,returned,realWrites:0});writeFileSync(`${OUT}/publicacion-${phase}-criterios.json`,JSON.stringify(results,null,2));console.log(phase,width,theme);await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
