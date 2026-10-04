// Focused admin smoke test: lazy routes and real session guard; never sends email.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  for(const status of [200,403,401]){
   const page=await browser.newPage(),errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname.replace('/api','');requests.push(path);
    if(path==='/admin/auth/me')return route.fulfill({status,json:status===200?{id:'admin-test',role:'ADMIN'}:{message:'No autorizado'}});
    if(path==='/admin/auth/refresh')return route.fulfill({status:401,json:{message:'No autenticado'}});
    const json=path==='/admin/kpis'?{kpis:{totalUsers:2,activeUsersCount:1,totalPosts:3,pendingReports:0}}
     :path==='/admin/email-marketing/dashboard'?{campaigns:[],metrics:{recipientCount:1,sent:0,failed:0},sendEnabled:true}
     :path.startsWith('/admin/users')?{data:[],total:0,page:1,totalPages:1}:[];
    await route.fulfill({json});
   });
   await page.goto((process.env.FINIX_ADMIN_TEST_URL||'http://127.0.0.1:5147')+'/');
   if(status===200){
    await page.getByRole('heading',{name:'Dashboard',exact:true}).waitFor();
    await page.getByRole('link',{name:'Email & Alertas',exact:true}).click();
    await page.getByRole('button',{name:'Redactar Email PRO',exact:true}).waitFor();
    await page.getByRole('link',{name:'Usuarios',exact:true}).click();
    await page.getByRole('heading',{name:/Usuarios/}).first().waitFor();
   }else if(status===403)await page.getByRole('heading',{name:'No se pudo abrir el admin'}).waitFor();
   else {await page.waitForURL('**/login');await page.locator('input[type="email"]').waitFor();}
   assert.deepEqual(errors,[]);assert.ok(!requests.some(p=>p.includes('/campaigns')||p.endsWith('/test')),'No send or publish requests');
   await page.close();
  }
  console.log('PASS: admin dashboard, lazy email/users routes, 401 login redirect and 403 denial, no runtime errors or sends.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
