const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {writeFileSync}=require('node:fs');
const {setup,capture,widths,OUT,BASE}=require('./auditoria-ux-vscode.browser.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--disable-gpu']});
 const phase=process.argv[2]||'antes'; const results=[];
 try {
  for(const theme of ['light','dark']) for(const width of phase==='antes'?[320,390,430,1440]:widths){
   const {page,errors}=await setup(browser,{guest:false,theme,width,timezoneId:'America/Argentina/Buenos_Aires'});
   await page.route('**/api/notifications?*',route=>route.fulfill({json:{items:[{id:'boundary',type:'SYSTEM_ALERT',category:'SYSTEM',priority:'NORMAL',title:'Prueba local de fecha cerca de medianoche UTC',message:'Fixture aislado; no es una notificación enviada.',isRead:true,timeLabel:'25-sept',createdAt:'2026-09-25T00:30:00Z'},{id:'second',type:'SYSTEM_ALERT',category:'SYSTEM',priority:'NORMAL',title:'Otra fecha de prueba',isRead:true,timeLabel:'24-sept',createdAt:'2026-09-24T00:30:00Z'}],nextCursor:null}}));
   await page.goto(`${BASE}/notifications`,{waitUntil:'domcontentloaded'});
   await page.getByText('Prueba local de fecha cerca de medianoche UTC',{exact:true}).waitFor();
   const result=await capture(page,`vs04-${phase}-notifications-${width}-${theme}`);
   if(phase!=='antes'){
    const time=page.locator('time[datetime="2026-09-25T00:30:00Z"]');
    assert.ok((await time.innerText()).includes('24'));
    assert.ok((await time.innerText()).includes('21:30'));
   }
   results.push({...result,errors:[...errors]});
   writeFileSync(`${OUT}/vs04-${phase}-matriz.json`,JSON.stringify(results,null,2));
   console.log(phase,width,theme); await page.close();
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
