const {test,after}=require('node:test'),assert=require('node:assert/strict');
require('reflect-metadata');
const {Test}=require('@nestjs/testing');
const {UnauthorizedException}=require('@nestjs/common');
const {JwtAuthGuard}=require('../apps/api/dist/auth/jwt-auth.guard');
const {AdminGuard}=require('../apps/api/dist/admin/admin.guard');
const {RequireProGuard}=require('../apps/api/dist/access/require-pro.guard');
const {AccessControlService}=require('../apps/api/dist/access/access-control.service');
const {NewsController}=require('../apps/api/dist/news/news.controller');
const {NewsService}=require('../apps/api/dist/news/news.service');
const {NewsSlotsPublicController}=require('../apps/api/dist/news/news-slots.controller');
const {NewsSlotsService}=require('../apps/api/dist/news/news-slots.service');
const {CalendarController}=require('../apps/api/dist/calendar/calendar.controller');
const {CalendarService}=require('../apps/api/dist/calendar/calendar.service');
const {MercadoPagoService}=require('../apps/api/dist/mercadopago/mercadopago.service');
const {StripeService}=require('../apps/api/dist/stripe/stripe.service');
const oldAccess=process.env.FINIX_FREE_ACCESS_ENABLED;after(()=>{if(oldAccess===undefined)delete process.env.FINIX_FREE_ACCESS_ENABLED;else process.env.FINIX_FREE_ACCESS_ENABLED=oldAccess;});

test('HTTP routes protect full news and calendar for anonymous, Free and inactive accounts while preserving PRO, trials and existing Creator access',async()=>{
 process.env.FINIX_FREE_ACCESS_ENABLED='false';
 const users={free:{plan:'FREE',subscriptionStatus:'INACTIVE'},pro:{plan:'PRO',subscriptionStatus:'ACTIVE'},trial:{plan:'PRO',subscriptionStatus:'TRIALING'},creator:{plan:'CREATOR',subscriptionStatus:'ACTIVE'},canceled:{plan:'PRO',subscriptionStatus:'CANCELED'},override:{plan:'FREE',proAccessOverride:true},revoked:{plan:'PRO',subscriptionStatus:'ACTIVE',proAccessOverride:false},unpaid:{plan:'FREE',subscriptionStatus:'ACTIVE'}};
 let calls=0;const service=names=>Object.fromEntries(names.map(name=>[name,async()=>{calls++;return{ok:true};}]));
 const module=await Test.createTestingModule({controllers:[NewsController,NewsSlotsPublicController,CalendarController],providers:[RequireProGuard,{provide:AccessControlService,useValue:new AccessControlService({user:{findUnique:async({where})=>users[where.id]?{id:where.id,role:'USER',...users[where.id]}:null}})},{provide:NewsService,useValue:service(['getNews','getNewsByTicker','getCategories','getSources','getTrendingNews','getNewsByCategory','getNewsStats'])},{provide:NewsSlotsService,useValue:service(['getPublicCategories','getPublicHeadlines','getPublicCategorySlots','registerClick'])},{provide:CalendarService,useValue:service(['getWeekEvents','getPublicEvents','getEventById','getHomeEvents','getPublicSources'])}]}).overrideGuard(JwtAuthGuard).useValue({canActivate(context){const request=context.switchToHttp().getRequest(),id=request.headers['x-fixture-user'];if(!users[id])throw new UnauthorizedException();request.user={id};return true;}}).overrideGuard(AdminGuard).useValue({canActivate:()=>false}).compile();
 const app=module.createNestApplication({logger:false});await app.listen(0,'127.0.0.1');const base=await app.getUrl();
 try{const protectedRoutes=['/news','/news/ticker/AAPL','/news/categories','/news/sources','/news/trending','/news/category/argentina','/news/stats','/news/slots/categories','/news/slots/category/argentina','/calendar/week','/calendar/economic','/calendar/earnings','/calendar/dividends','/calendar/events','/calendar/events/event-id','/calendar/today','/calendar/upcoming'];
 for(const path of protectedRoutes){for(const id of [null,'free','canceled','revoked','unpaid']){const before=calls,response=await fetch(base+path,{headers:id?{'x-fixture-user':id}:{}});assert.equal(response.status,id?403:401,path+' '+id);assert.equal(calls,before,'protected data must not be queried');}for(const id of ['pro','trial','creator','override'])assert.equal((await fetch(base+path,{headers:{'x-fixture-user':id}})).status,200,path+' '+id);}
 for(const path of ['/calendar/home','/news/slots/headlines'])assert.equal((await fetch(base+path)).status,200,'home preview '+path);
 }finally{await app.close();}
});

test('hidden Creator purchases stop before provider calls or pending subscription creation on both providers',async()=>{
 process.env.FINIX_FREE_ACCESS_ENABLED='false';const mp=new MercadoPagoService({},{}),stripe=new StripeService({},{});let touched=false;mp.ensureCheckoutReady=async()=>{touched=true;};stripe.isCheckoutReady=async()=>{touched=true;return true;};
 await assert.rejects(mp.createPreference('fixture','creator'),/Creador no está disponible/);
 await assert.rejects(stripe.createSubscription('fixture','pro_creator'),/Creador no está disponible/);assert.equal(touched,false);
});
