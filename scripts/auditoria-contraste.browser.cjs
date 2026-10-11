// Effective backgrounds are sampled from a real raster with only text hidden.
// Computed foreground alpha and ancestor opacity are composited over those pixels.
const {chromium}=require('playwright');const{writeFileSync}=require('node:fs');
const{setup,BASE,OUT}=require('./auditoria-ux-vscode.browser.cjs');const{integrationFixtures}=require('./auditoria-integracion-fixtures.cjs');
(async()=>{const browser=await chromium.launch({headless:true});const records=[];try{
 for(const theme of ['light','dark'])for(const [name,path]of [['inicio','/dashboard'],['ranking','/market/top-gainers'],['planes','/pro'],['contacto','/info/contact']]){
  const{page}=await setup(browser,{theme,width:390,guest:true});await integrationFixtures(page);await page.goto(BASE+path);await page.waitForTimeout(900);
  const samples=await page.evaluate(()=>{
   const candidates=[...document.querySelectorAll('p,span,label,h1,h2,h3,button,a')].filter(el=>{
    const box=el.getBoundingClientRect();return box.width>3&&box.height>3&&el.textContent.trim()&&![...el.children].some(child=>child.tagName!=='svg'&&child.tagName!=='SVG')&&!el.closest('[aria-hidden="true"],[inert],button:disabled');
   }).slice(0,100);
   window.contrastOriginals=candidates.map(el=>({el,style:el.getAttribute('style')}));
   const records=candidates.map(el=>{const range=document.createRange();const textNode=[...el.childNodes].find(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());if(textNode)range.selectNodeContents(textNode);else range.selectNodeContents(el);const box=range.getClientRects()[0]||el.getBoundingClientRect(),style=getComputedStyle(el);let opacity=1;for(let ancestor=el;ancestor;ancestor=ancestor.parentElement)opacity*=Number(getComputedStyle(ancestor).opacity);return{text:el.textContent.trim(),color:style.color,fontSize:parseFloat(style.fontSize),weight:parseInt(style.fontWeight)||400,opacity,x:box.x+scrollX,y:box.y+scrollY,width:box.width,height:box.height};});
   for(const el of candidates){el.style.setProperty('color','transparent','important');el.style.setProperty('text-shadow','none','important');for(const svg of el.querySelectorAll('svg'))svg.style.visibility='hidden';}
   return records;
  });
  const raster=`${OUT}/contraste-fondo-efectivo-${name}-${theme}.png`;await page.screenshot({path:raster,fullPage:true,animations:'disabled'});
  await page.evaluate(()=>{for(const{el,style}of window.contrastOriginals){if(style===null)el.removeAttribute('style');else el.setAttribute('style',style);for(const svg of el.querySelectorAll('svg'))svg.style.visibility='';}});
  records.push({name,theme,raster,samples});console.log('contraste',name,theme);await page.close();
 }writeFileSync(`${OUT}/contraste-dom.json`,JSON.stringify(records,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
