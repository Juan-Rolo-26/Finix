const assert=require('node:assert/strict');const{chromium}=require('playwright');const{writeFileSync,readFileSync}=require('node:fs');
const{setup,capture,BASE,OUT}=require('./auditoria-ux-vscode.browser.cjs');const{integrationFixtures}=require('./auditoria-integracion-fixtures.cjs');
const results=[];const save=row=>{results.push(row);writeFileSync(`${OUT}/imagenes-zoom-criterios.json`,JSON.stringify(results,null,2));console.log(row.kind,row.width,row.theme,row.case||'');};
(async()=>{const browser=await chromium.launch({headless:true});try{
for(const theme of ['light','dark'])for(const width of [320,390,430,1440]){
 const{page,errors}=await setup(browser,{theme,width,guest:false});await integrationFixtures(page);
 await page.route('**/auditoria-imagen-*.png',route=>{const kind=new URL(route.request().url()).pathname.match(/imagen-(\w+)\.png/)[1];return kind==='error'?route.fulfill({status:404}):route.fulfill({contentType:'image/png',body:readFileSync(`/tmp/finix-imagen-${kind}.png`)});});
 for(const kind of ['horizontal','vertical','cuadrada','extrema','error']){
  await page.route('**/api/posts/feed?*',route=>route.fulfill({json:{posts:[{id:'image-fixture',author:{id:'another',username:'imagen_fixture'},content:'Prueba local de imagen '+kind,type:'image',media:[{id:'media-local',url:`/auditoria-imagen-${kind}.png`,mediaType:'image'}],createdAt:'2026-10-09T18:00:00Z',likesCount:0,commentsCount:0,repostsCount:0,savesCount:0}],hasMore:false,nextCursor:null}}));
  await page.goto(BASE+'/explore');
  if(kind==='error') await page.getByText('Este archivo no está disponible.',{exact:true}).waitFor();
  else{
   const expand=page.getByRole('button',{name:'Ampliar imagen',exact:true}).first();await expand.waitFor();await expand.focus();await page.keyboard.press('Enter');
   const dialog=page.getByRole('dialog',{name:'Vista ampliada de la imagen',exact:true});await dialog.waitFor();
   const image=dialog.locator('img');const dimensions=await image.evaluate(el=>({fit:getComputedStyle(el).objectFit,naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,alt:el.alt}));
   assert.equal(dimensions.fit,'contain');assert.ok(dimensions.naturalWidth>0&&dimensions.alt);
   assert.ok(await dialog.evaluate(el=>el.contains(document.activeElement)));
   for(let i=0;i<6;i++){await page.keyboard.press('Tab');assert.ok(await dialog.evaluate(el=>el.contains(document.activeElement)));}
   await capture(page,`imagenes-integracion-${kind}-${width}-${theme}`);await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});await page.waitForTimeout(200);await page.waitForFunction(el=>el===document.activeElement,await expand.elementHandle());
   save({kind:'imagen',case:kind,width,theme,dimensions,result:'passed'});
  }
  if(kind==='error'){await capture(page,`imagenes-integracion-error-${width}-${theme}`);save({kind:'fallback',width,theme,result:'passed'});}
 }
 for(const path of ['/market/top-gainers','/info/contact','/pro']){
  await page.goto(BASE+path);await page.waitForTimeout(600);
  await page.evaluate(()=>{const nodes=[...document.querySelectorAll('body *')];const sizes=nodes.map(el=>parseFloat(getComputedStyle(el).fontSize));nodes.forEach((el,i)=>{el.style.fontSize=`${sizes[i]*2}px`;});});
  await page.screenshot({path:`${OUT}/zoom-viewport-${path.replaceAll('/','-')}-${width}-${theme}.png`,animations:'disabled'});
  const result=await capture(page,`zoom-texto-200-${path.replaceAll('/','-')}-${width}-${theme}`);
  const controls=await page.locator('nav, [class*=fixed]').evaluateAll(es=>es.flatMap(parent=>[...parent.querySelectorAll('button,a')].filter(el=>el.getBoundingClientRect().width).map(el=>{const r=el.getBoundingClientRect();return {name:el.getAttribute('aria-label')||el.innerText,x:r.x,y:r.y,width:r.width,height:r.height};})));
  assert.ok(controls.every(c=>c.x>=-1&&c.x+c.width<=width+1),'fixed controls contained in viewport');
  const back=controls.find(c=>c.name==='Volver arriba'),bottom=controls.filter(c=>c.y>700&&c.name!=='Volver arriba');
  if(back)assert.ok(bottom.every(c=>back.y+back.height<=c.y||back.x+back.width<=c.x||back.x>=c.x+c.width),'return button does not cover bottom navigation');
  const clipped=await page.locator('h1,h2,h3,button').evaluateAll(els=>els.filter(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return r.width&&r.height&&(el.scrollWidth>el.clientWidth+1||(s.overflow==='hidden'&&el.scrollHeight>el.clientHeight+1));}).map(el=>({text:el.innerText||el.getAttribute('aria-label'),width:el.clientWidth,scrollWidth:el.scrollWidth})));
  save({kind:'zoom200',case:path,width,theme,...result,clipped,controls,result:result.scrollWidth===result.width&&clipped.length===0?'passed':'requires-review'});
 }
 assert.deepEqual(errors,[]);await page.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
