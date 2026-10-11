const assert=require('node:assert/strict');
const {chromium}=require('playwright');const {writeFileSync}=require('node:fs');
const {setup,capture,widths,BASE,OUT}=require('./auditoria-ux-vscode.browser.cjs');
const {integrationFixtures}=require('./auditoria-integracion-fixtures.cjs');
const results=[];
function record(id,criterion,detail){console.log(id,criterion,detail.width,detail.theme);results.push({id,criterion,result:'passed',detail});writeFileSync(`${OUT}/integracion-criterios.json`,JSON.stringify(results,null,2));}
async function trap(page,dialog){
 assert.ok(await dialog.evaluate(el=>el.contains(document.activeElement)),'initial focus inside modal');
 const outside=page.locator('.desktop-header button,nav button,button').filter({hasText:'Más'}).first();
 await page.evaluate(()=>{const dialog=document.querySelector('[role="dialog"]');const outside=[...document.querySelectorAll('button,a')].find(el=>!dialog.contains(el)&&el.getBoundingClientRect().width);outside?.focus();});
 assert.ok(await dialog.evaluate(el=>el.contains(document.activeElement)),'background cannot take focus');
 for(let i=0;i<18;i++){await page.keyboard.press('Tab');assert.ok(await dialog.evaluate(el=>el.contains(document.activeElement)),'Tab remains inside modal');}
}
(async()=>{
 const browser=await chromium.launch({headless:true});try{
 for(const theme of ['light','dark'])for(const width of widths){
  const {page,errors,writes}=await setup(browser,{theme,width,guest:true});await integrationFixtures(page);
  await page.goto(BASE+'/dashboard');
  if(width<1024){
   const more=page.getByRole('button',{name:'Más herramientas y opciones',exact:true});await more.click();
   const dialog=page.getByRole('dialog');await dialog.waitFor();await trap(page,dialog);
   const text=await dialog.innerText();assert.ok(text.includes('Comunidades')&&text.includes('Calendario')&&text.includes('Portafolio'));
   assert.ok(!text.includes('Cerrar sesión')&&!text.includes('Ver perfil'));
   const sizes=await dialog.locator('button,a').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().width>0).map(el=>({name:el.innerText||el.getAttribute('aria-label'),w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
   assert.ok(sizes.every(s=>s.w>=43.9&&s.h>=43.9),JSON.stringify(sizes.filter(s=>s.w<43.9||s.h<43.9)));
   await capture(page,`integracion-menu-${width}-${theme}`);await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});await page.waitForTimeout(250);assert.ok(await more.evaluate(el=>el===document.activeElement));
   record('FINIX-16/17/18/20','Menú visitante, destinos, aislamiento, teclado y retorno',{width,theme,sizes});
  }else await page.getByRole('link',{name:'Iniciar sesión',exact:true}).filter({visible:true}).first().waitFor();
  record('FINIX-05','Acceso directo en navegación',{width,theme});
  await page.goto(BASE+'/market/top-gainers');await page.locator('span:visible').filter({hasText:/^PRUEBA0$/}).first().waitFor();
  if(width<768){const button=page.getByRole('button',{name:'Ver volumen y cierre ▼'}).first();await button.focus();await page.keyboard.press('Enter');assert.ok(await page.getByText('Cierre previo',{exact:true}).filter({visible:true}).first().isVisible());}
  record('FINIX-03/13','Datos y expansión del ranking',{width,theme});
  await page.goto(BASE+'/pricing?plan=creator#planes');await page.waitForURL(url=>url.pathname==='/pro');assert.ok(page.url().includes('?plan=creator#planes'));
  record('FINIX-28','Alias de planes conserva query/hash',{width,theme});
  await page.goto(BASE+'/login');const contact=page.getByRole('link',{name:'Contacto',exact:true});await contact.click();await page.getByRole('heading',{name:/Contact/}).last().waitFor();
  await page.waitForTimeout(200);assert.ok(await page.locator('[id="contacto-heading"]').evaluate(el=>el===document.activeElement));
  assert.ok(await page.locator('#contacto form').count());
  await page.goto(BASE+'/help');await page.getByRole('link',{name:'Enviar consulta',exact:true}).click();await page.waitForTimeout(350);assert.ok(await page.locator('#contacto-heading').evaluate(el=>el===document.activeElement));
  record('FINIX-06','Contacto de acceso y ayuda enfoca formulario',{width,theme});
  assert.deepEqual(errors,[]);assert.ok(!writes.some(path=>path.includes('contact')||path.includes('checkout')));await page.close();
 }
 for(const theme of ['light','dark'])for(const width of [320,390,430,768,1440]){
  const {page,errors}=await setup(browser,{theme,width,guest:false});await integrationFixtures(page);
  await page.route('**/api/messages/search-users?*',route=>route.fulfill({json:[{id:'another',username:'usuario_fixture'}]}));
  let held,requestResolve;const intercepted=new Promise(resolve=>requestResolve=resolve);
  await page.route('**/api/messages/conversations',route=>{if(route.request().method()==='POST'){held=route;requestResolve();}else return route.fulfill({json:[]});});
  await page.goto(BASE+'/messages');const open=page.getByRole('button',{name:'Nuevo mensaje',exact:true});await open.click();
  const modal=page.getByRole('dialog',{name:'Nuevo mensaje o grupo'});await modal.waitFor();
  const search=modal.getByRole('textbox',{name:'Buscar por nombre de usuario'});assert.ok(await search.evaluate(el=>el===document.activeElement));await trap(page,modal);
  await search.fill('usuario');await modal.getByRole('button',{name:/usuario_fixture/}).first().click();
  await modal.getByRole('button',{name:'Abrir chat',exact:true}).click();await intercepted;
  await page.keyboard.press('Escape');assert.ok(await modal.isVisible(),'Escape cannot interrupt submission');
  await page.mouse.click(2,2);assert.ok(await modal.isVisible(),'overlay cannot interrupt submission');
  await held.fulfill({status:503,json:{message:'Falla simulada de prueba'}});await modal.getByRole('button',{name:'Abrir chat',exact:true}).waitFor();
  await capture(page,`integracion-mensaje-error-${width}-${theme}`);await page.keyboard.press('Escape');await modal.waitFor({state:'hidden'});await page.waitForTimeout(250);assert.ok(await open.evaluate(el=>el===document.activeElement));
  assert.deepEqual(errors,[]);record('FINIX-20','Mensaje: foco, fondo aislado, envío pendiente, Escape y retorno',{width,theme,realWrites:0});await page.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
