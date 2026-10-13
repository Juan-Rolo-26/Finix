const { chromium } = require('playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
const path=require('node:path');
const out=path.resolve(__dirname,'../docs/laboratorio-financiero');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 const checks=[];
 const ids=['compuesto','objetivos','inflacion','comisiones','escenarios','tasas','prestamos','operacion'];
 for(const width of (process.argv.includes('--interactions') ? [] : [320,390,768,1440])) for(const theme of ['light','dark']) {
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme});
  await context.addInitScript(theme=>{localStorage.setItem('finix_app_preferences_v4',JSON.stringify({state:{theme},version:0}));localStorage.setItem('finix_cookie_consent','accepted');},theme);
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const id of ids) {
   await page.goto(`http://localhost:5173/laboratorio?herramienta=${id}`);
   await page.locator('.lab-metrics strong').first().waitFor();
   await page.locator('.lab-chart svg').first().waitFor();
   if(id==='compuesto') { const consent=page.getByRole('button',{name:'Solo necesarias',exact:true}); await consent.waitFor({timeout:3000}).catch(()=>{}); if(await consent.isVisible()) await consent.click(); }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`Overflow ${width} ${theme} ${id}`);
   assert.equal(await page.locator('.lab-metrics strong').count(),3);
   assert.equal(await page.locator('.lab-error').count(),0);
   assert.equal(await page.locator('html').evaluate((el,theme)=>el.classList.contains(theme),theme),true);
   await page.locator('summary').click();assert.ok(await page.locator('tbody tr').count()>0);
   await page.screenshot({path:`${out}/${id}-${width}-${theme}.png`,fullPage:true});
   checks.push({width,theme,id,passed:true});
  }
  assert.deepEqual(errors,[]);
  await context.close();console.log('Vistas verificadas',width,theme);
 }
 const page=await browser.newPage({viewport:{width:390,height:900},acceptDownloads:true});
 await page.goto('http://localhost:5173/laboratorio'); await page.locator('.lab-metrics').waitFor();
 await page.getByRole('button',{name:'Solo necesarias',exact:true}).click();
 await page.getByLabel('Buscar herramientas').fill('inflación');assert.ok(await page.locator('.lab-tools>button').count()>0);
 await page.getByLabel('Buscar herramientas').fill('zzzz');assert.equal(await page.locator('.lab-tools>button').count(),0);
 await page.getByRole('button',{name:'Restablecer búsqueda'}).click();assert.equal(await page.locator('.lab-tools>button').count(),8);
 await page.locator('#lab-capital').fill('');assert.equal(await page.locator('.lab-metrics').count(),0);assert.equal(await page.locator('#lab-capital').getAttribute('aria-invalid'),'true');
 await page.locator('#lab-capital').fill('1000');await page.locator('#lab-contribution').fill('100');await page.locator('#lab-years').fill('1');await page.locator('#lab-annual').fill('0');await page.locator('#lab-inflation').fill('0');
 assert.ok((await page.locator('.lab-metrics').innerText()).includes('2.200'));
 await page.getByLabel('Nombre de la simulación').fill('Prueba ahorro');await page.getByRole('button',{name:'Guardar simulación',exact:true}).click();assert.equal(await page.locator('.lab-saved li').count(),1);
 await page.reload();await page.locator('.lab-metrics').waitFor();await page.getByRole('button',{name:'Cargar',exact:true}).click();assert.equal(await page.locator('#lab-capital').inputValue(),'1000');assert.equal(await page.locator('#lab-annual').inputValue(),'0');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar detalle CSV'}).click();const download=await downloadPromise;await download.saveAs(`${out}/ejemplo-exportacion.csv`);assert.ok(fs.readFileSync(`${out}/ejemplo-exportacion.csv`,'utf8').includes('2200'));
 await page.getByRole('button',{name:'Eliminar Prueba ahorro'}).click();assert.equal(await page.locator('.lab-saved li').count(),0);
 await page.getByRole('button',{name:'Más herramientas y opciones',exact:true}).click();await page.getByRole('button',{name:'Laboratorio Financiero',exact:true}).click();await page.getByRole('dialog').waitFor({state:'detached'});await page.locator('.lab-metrics').waitFor();
 await page.locator('#lab-capital').fill('1000000000000');await page.locator('#lab-annual').fill('500');await page.locator('#lab-years').fill('50');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 await page.locator('#lab-annual').fill('abc');await page.locator('.lab-metrics').waitFor({state:'detached'});assert.equal(await page.locator('.lab-metrics').count(),0);
 fs.writeFileSync(`${out}/ui-checks.json`,JSON.stringify({checks,interactions:'search, empty, validation, zero rate, save, reload, load, delete, CSV, mobile navigation passed'},null,2));
 await browser.close();console.log(JSON.stringify({views:checks.length,interactions:'passed'}));
})().catch(e=>{console.error(e);process.exit(1)});
