const {chromium}=require('playwright');
const {writeFileSync}=require('node:fs');
const {setup,capture,widths,BASE,OUT}=require('./auditoria-ux-vscode.browser.cjs');
const {integrationFixtures}=require('./auditoria-integracion-fixtures.cjs');
async function measures(page){return page.evaluate(()=>{
 const visible=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden';};
 const controls=[...document.querySelectorAll('button,[role="tab"],[role="switch"],a')].filter(visible).map(el=>{
  const r=el.getBoundingClientRect();return {tag:el.tagName,name:el.getAttribute('aria-label')||el.innerText?.trim()||el.title||el.querySelector('img')?.alt||'',role:el.getAttribute('role'),width:r.width,height:r.height,x:r.x,y:r.y,clipped:el.scrollWidth>el.clientWidth+1};
 });
 const clipped=[...document.querySelectorAll('h1,h2,h3,p')].filter(visible).filter(el=>{
  const s=getComputedStyle(el);return (s.textOverflow==='ellipsis'&&el.scrollWidth>el.clientWidth+1)||(s.webkitLineClamp!=='none'&&Number(s.webkitLineClamp)>0&&el.scrollHeight>el.clientHeight+1);
 }).map(el=>el.innerText);
 return {controls,clipped,path:location.pathname+location.search+location.hash};
});}
(async()=>{
 const phase=process.argv[2]||'despues',results=[];
 const browser=await chromium.launch({headless:true});
 try{
  for(const theme of ['light','dark'])for(const width of phase==='antes'?[320,390,430,1440]:widths)for(const guest of phase==='antes'?[true,false]:[true,false]){
   const {page,errors,writes}=await setup(browser,{theme,width,guest});await integrationFixtures(page);
   const routes=phase==='antes'?[['inicio','/dashboard'],['ranking','/market/top-gainers']]:[['inicio','/dashboard'],['ranking','/market/top-gainers'],['mercado','/market'],['contacto','/info/contact'],['ayuda','/help'],...(guest?[]:[['ajustes','/settings'],['comunidad','/comunidades/crear'],['mensajes','/messages'],['portafolio','/portfolio']])];
   for(const [name,path]of routes){
    await page.goto(BASE+path,{waitUntil:'domcontentloaded'});await page.waitForTimeout(600);
    if(phase!=='antes'&&name==='mercado'&&!guest){
      const tab=page.getByRole('tab',{name:/Pre-Market|Pre Market|Premercado/i}); if(await tab.count())await tab.click();
    }
    const result=await capture(page,`integracion-${phase}-${name}-${guest?'visitante':'creador'}-${width}-${theme}`);
    const measured=await measures(page);results.push({name,guest,theme,...result,...measured,errors:[...errors],writes:[...writes]});
    writeFileSync(`${OUT}/integracion-${phase}-matriz.json`,JSON.stringify(results,null,2));
    console.log(phase,name,guest?'visitante':'creador',width,theme);
   }await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={measures};
