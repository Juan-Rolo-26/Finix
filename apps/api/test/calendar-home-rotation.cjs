const assert = require('node:assert/strict');
const { CalendarService } = require('../src/calendar/calendar.service');
const economic = i => ({ id:'macro-'+i, date:'2026-10-16', time:'11:00', title:'Purchasing Managers Index '+i, country:'US', importance:'HIGH', marketImpactScore:80, sourceType:'MANUAL', actualValue:'52', previousValue:'50', consensusValue:'51' });
const earnings = i => ({ id:'stored-'+i,ticker:'CORP'+i,companyName:'Empresa '+i,date:'2026-10-16',earningsImpactScore:90,reportTiming:'BMO',epsEstimate:2,revenueEstimate:2000000,dateStatus:'CONFIRMED' });
const dividends = [0,1].map(i=>({ticker:'DIV'+i,companyName:'Dividendo '+i,exDate:'2026-10-15',paymentDate:'2026-10-20',amount:i===0?0:0.75}));
function make({ dividendFailure=false, empty=false }={}) {
 const db={marketCalendarEvent:{findMany:async()=>[economic(0),economic(1)]},marketEarningsEvent:{findMany:async()=>empty?[]:[earnings(0),earnings(1)]},marketDividendEvent:{findMany:async()=>[]}};
 const provider={getUpcomingEconomicEvents:async()=>[],fetchTradingViewSP500Earnings:async()=>empty?[]:[earnings(0),earnings(1),{...earnings(2),epsEstimate:null,revenueEstimate:null}],fetchTradingViewSP500Dividends:async()=>{if(dividendFailure)throw Error('offline');return empty?[]:[...dividends,dividends[0],{...dividends[0],ticker:'PAID',exDate:'2026-10-08',paymentDate:'2026-10-16'},{...dividends[0],ticker:'OUTSIDE',exDate:'2025-01-01',paymentDate:'2025-01-02'}];}};
 const service=new CalendarService(db,provider,{}, {getTradingViewLogoUrl:()=>''});service.getCurrentWeekBounds=()=>({mondayStr:'2026-10-12',fridayStr:'2026-10-16'});return service;
}
(async()=>{
 const service=make();const result=await service.getHomeEvents();
 assert.equal(result.events.filter(e=>e.type==='EARNINGS').length,2);
 assert.equal(result.events.filter(e=>e.type==='DIVIDEND').length,3);
 assert.equal(result.events.filter(e=>e.type==='ECONOMIC').length,2);
 assert.equal(result.events.find(e=>e.ticker==='DIV0').amount,0);
 assert.equal(result.events.find(e=>e.ticker==='PAID').date,'2026-10-16');
 assert.equal(result.events.find(e=>e.ticker==='PAID').dateKind,'PAYMENT_DATE');
 assert.ok(result.events.every(e=>e.date>=result.weekRange.from&&e.date<=result.weekRange.to));
 assert.equal((await service.getHomeEvents()),result,'Home response is cached');
 const failure=await make({dividendFailure:true}).getHomeEvents();assert.ok(failure.events.some(e=>e.type==='EARNINGS'));assert.ok(!failure.events.some(e=>e.type==='DIVIDEND'));
 const empty=await make({empty:true}).getHomeEvents();assert.ok(!empty.events.some(e=>e.type==='EARNINGS'||e.type==='DIVIDEND'));
 console.log('PASS: real rotating candidates, separate categories, payment/ex-date, zero amounts, deduplication, financial quality, provider failure and cache.');
})().catch(e=>{console.error(e);process.exitCode=1;});
