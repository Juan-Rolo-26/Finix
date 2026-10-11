const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {writeFileSync}=require('node:fs');
const {setup,capture,widths,BASE,OUT}=require('./auditoria-ux-vscode.browser.cjs');
(async()=>{
 const phase=process.argv[2]||'antes', results=[];
 const browser=await chromium.launch({headless:true});
 try {
  for(const theme of ['light','dark']) for(const width of phase==='antes'?[320,390,430,1440]:widths){
   const {page,errors}=await setup(browser,{width,theme});
   for(const route of ['terms','privacy','cookies']){
    await page.goto(`${BASE}/${route}`,{waitUntil:'domcontentloaded'});
    await page.getByRole('heading',{level:1}).waitFor();
    const body=await page.locator('body').innerText();
    const notes=body.match(/\[[^\]]*(?:pendiente|Nota para|Completar)[^\]]*\]/g)||[];
    const result=await capture(page,`vs05-${phase}-${route}-${width}-${theme}`);
    if(phase!=='antes') {assert.equal(notes.length,0,'no public editorial placeholders');assert.equal(result.width,result.scrollWidth,'no overflow');assert.ok(body.includes('finiixarg@gmail.com'),'existing actual contact retained');}
    results.push({route,notes,...result,errors:[...errors]});
    writeFileSync(`${OUT}/vs05-${phase}-legales.json`,JSON.stringify(results,null,2));
    console.log(phase,route,width,theme);
   }
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
