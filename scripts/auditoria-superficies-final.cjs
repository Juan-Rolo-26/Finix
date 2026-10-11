const assert=require('node:assert/strict');const{chromium}=require('playwright');const{writeFileSync}=require('node:fs');const{setup,capture,widths,BASE,OUT}=require('./auditoria-ux-vscode.browser.cjs');const{integrationFixtures}=require('./auditoria-integracion-fixtures.cjs');
(async()=>{const results=[],browser=await chromium.launch({headless:true});try{
for(const theme of ['light','dark'])for(const width of widths){
 const{page,errors,writes}=await setup(browser,{width,theme,guest:false});await integrationFixtures(page);
 for(const[name,path]of [['ayuda','/help'],['ajustes','/settings'],['comunidad','/comunidades/crear'],['portafolio','/portfolio'],['noticias','/news'],['creador','/creator']]){
  await page.goto(BASE+path);await page.waitForTimeout(700);
  if(name==='ayuda')await page.getByRole('button',{name:'¿Cuántas listas y activos permite Seguimiento?',exact:true}).click();
  if(name==='ajustes')await page.getByRole('tab',{name:'Planes PRO',exact:true}).click();
  if(name==='ayuda'||name==='ajustes'){const summary=page.getByRole('region',{name:'Límites de Seguimiento'});const text=await summary.innerText();assert.ok(text.includes('25 listas · 100 activos')&&text.includes('50 listas · 200 activos'));}
  const result=await capture(page,`integracion-final-actualizada-${name}-${width}-${theme}`);
  const controls=await page.locator('button').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().width).map(el=>({name:el.getAttribute('aria-label')||el.innerText||el.title,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
  const images=await page.locator('img').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().width).map(el=>({src:el.getAttribute('src'),alt:el.alt,fit:getComputedStyle(el).objectFit,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight})));
  assert.equal(result.width,result.scrollWidth);assert.ok(controls.every(c=>c.name),'all buttons named in '+name);assert.ok(controls.every(c=>c.width>=43.9&&c.height>=43.9),JSON.stringify(controls.filter(c=>c.height<43.9||c.width<43.9)));
  if(name==='noticias')assert.ok(images.filter(img=>img.src.includes('news-fallback')).every(img=>img.fit==='contain'&&img.naturalWidth>0));
  assert.deepEqual(errors,[]);assert.ok(!writes.some(path=>/checkout|contact|communities|visibility/.test(path)));
  results.push({name,theme,...result,controls,images,errors:[...errors],realWrites:0});writeFileSync(`${OUT}/integracion-superficies-final.json`,JSON.stringify(results,null,2));console.log(name,width,theme);
 }await page.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
