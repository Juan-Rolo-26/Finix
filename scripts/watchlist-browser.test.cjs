// Requires the web dev server at http://127.0.0.1:4173.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { writeFileSync, unlinkSync } = require('node:fs');
const { join } = require('node:path');
async function main() {
 const browser = await chromium.launch({ headless: true });
 const name = `watchlist-test-${process.pid}.html`;
 const filename = join(__dirname, '../apps/web', name);
 const now = Date.parse('2026-10-03T18:00:00Z');
 const point = (days, close) => ({ time: (now - days * 86400000) / 1000, close });
 const lists = [{ id:'first', name:'Mi lista', itemCount:4 }, { id:'second', name:'Cripto', itemCount:1 }, { id:'slow', name:'Lista lenta', itemCount:1 }];
 const item = (id, symbol, price, change, extra={}) => ({ id, symbol, chartSymbol:symbol, name:id, currentPrice:price, changePercent:change, isUnavailable:price===null, market:symbol.split(':')[0], currency:symbol.startsWith('BCBA:')?'ARS':'USD', assetType:'STOCK', addedPrice:null, personalStatus:'RESEARCHING', targetPrice:price?price+5:null, targetDirection:'BELOW', distancePct:5, tags:[], notes:[], quoteUpdatedAt:new Date(now).toISOString(), ...extra });
 const items = [item('Apple','NASDAQ:AAPL',100,1), item('Galicia','BCBA:GGAL',6000,-1), item('Bitcoin','BINANCE:BTCUSDT',90000,2), item('Sin datos','NASDAQ:MISSING',null,null)];
 let failed=false, pending=null, refreshCount=0, saved=null, failAdd=true;
 const candles = { 'NASDAQ:AAPL':[point(35,80),point(31,80),point(8,90),point(7,90),point(3,95),point(0,100)], 'BCBA:GGAL':[point(35,7500),point(31,7500),point(8,6500),point(7,6500),point(0,6000)], 'BINANCE:BTCUSDT':[point(35,80000),point(31,80000),point(8,85000),point(7,85000),point(0,90000)] };
 try {
  writeFileSync(filename, `<!doctype html><div id="root"></div><script type="module">
    import React from 'react'; import ReactDOM from 'react-dom/client'; import { BrowserRouter, Routes, Route } from 'react-router-dom';
    import WatchlistPage from '/src/pages/WatchlistPage.tsx'; import AddToWatchlistModal from '/src/components/watchlist/AddToWatchlistModal.tsx'; import { useAuthStore } from '/src/stores/authStore.ts'; import '/src/index.css';
    useAuthStore.setState({ user: { id:'user', plan:'PRO', username:'tester' } });
    const root=ReactDOM.createRoot(document.getElementById('root')); window.renderModal=()=>root.render(React.createElement(AddToWatchlistModal,{symbol:'NASDAQ:AAPL',isOpen:true,onClose:()=>{}})); root.render(React.createElement(BrowserRouter, null, React.createElement(Routes, null, React.createElement(Route, {path:'*',element:React.createElement(WatchlistPage)}))));
  </script>`);
  const page=await browser.newPage({viewport:{width:1400,height:1000},timezoneId:'America/Argentina/Buenos_Aires'});
  await page.clock.install({time:new Date(now)});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(() => { localStorage.setItem('finix_watchlist_onboarding_dismissed','true');localStorage.setItem('token','watchlist-test'); window.chartWidgets=[]; window.TradingView={widget:class {constructor(config){window.chartWidgets.push(config);document.getElementById(config.container_id).textContent=`Chart ${config.symbol} ${config.interval}`;}}}; });
  await page.route('**/api/**',async route=>{
   const req=route.request(), url=new URL(req.url()), path=url.pathname.replace(/^\/api/,'');
   if(path.startsWith('/watchlist/membership/'))return route.fulfill({json:{lists:[{id:'first',name:'Mi lista',containsSymbol:false}]}});
   if(path==='/watchlist/first/items'&&req.method()==='POST')return route.fulfill(failAdd?{status:403,json:{message:'Límite de activos alcanzado'}}:{json:{id:'added'}});
   if(path==='/watchlist')return route.fulfill({json:{watchlists:lists}});
   if(path==='/market/candles')return route.fulfill({json:{candles:candles[url.searchParams.get('symbol')]||[]}});
   if(path.startsWith('/watchlist/posts/'))return route.fulfill({json:{posts:[]}});
   if(path.endsWith('/export')){assert.equal(req.headers().authorization,'Bearer watchlist-test');return route.fulfill({body:'symbol,price\nNASDAQ:AAPL,100',contentType:'text/csv'});}
   if(req.method()==='PATCH'){saved=req.postDataJSON();return route.fulfill({json:{success:true}});}
   if(path==='/watchlist/slow'){pending=route;return;}
   if(path==='/watchlist/first'||path==='/watchlist/second'){
    refreshCount++;
    if(failed)return route.fulfill({status:503,json:{message:'offline'}});
    return route.fulfill({json:{id:path.split('/').at(-1),items:path.endsWith('first')?items:[items[2]]}});
   }
   return route.fulfill({json:{}});
  });
  await page.goto(`http://127.0.0.1:4173/${name}`);
  const summary=page.getByRole('heading',{name:'Resumen de tu Lista'}).locator('..').locator('..');
  await summary.locator('svg[aria-label="Historial de precios del último mes"]').first().waitFor();
  assert.equal(await summary.locator('svg[aria-label="Historial de precios del último mes"]').count(),3);
  assert.equal(await summary.getByText('Sin historial',{exact:true}).count(),1);
  const lines=await summary.locator('svg polyline').evaluateAll(lines=>lines.map(line=>line.getAttribute('points')));
  assert.notEqual(lines[0],lines[1],'curves must reflect each actual price series');
  const gainers=page.getByRole('heading',{name:'Top Gainers',exact:true}).locator('..').locator('..').locator('..').locator('..');
  await gainers.getByRole('button',{name:'1W',exact:true}).click();await gainers.getByText('+11.1%',{exact:true}).waitFor();
  await gainers.getByRole('button',{name:'1M',exact:true}).click();await gainers.getByText('+25.0%',{exact:true}).waitFor();
  assert.equal(await page.getByText(/anuncia dividendo|Insider de/).count(),0);
  await summary.getByText('BCBA:GGAL',{exact:true}).click();
  await page.getByText('Chart BCBA:GGAL D',{exact:true}).waitFor();
  await page.getByRole('button',{name:'4H',exact:true}).click();await page.getByText('Chart BCBA:GGAL 240',{exact:true}).waitFor();
  const target=page.getByRole('spinbutton',{name:'Precio objetivo'});await target.fill('5900');
  const before=refreshCount;const autoRefresh=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/watchlist/first');await page.clock.fastForward(45001);await autoRefresh;assert.ok(refreshCount>before);
  assert.equal(await target.inputValue(),'5900','refresh must not overwrite edited targets');
  await page.getByRole('button',{name:'Guardar configuración',exact:true}).click();await page.getByText('Cambios guardados con éxito.',{exact:true}).waitFor();
  assert.equal(saved.targetPrice,5900);assert.equal(saved.targetDirection,'BELOW');
  await page.getByRole('button',{name:'Ver en Mercado'}).click();assert.ok(page.url().includes('/market?symbol=BCBA%3AGGAL'));
  await page.goto(`http://127.0.0.1:4173/${name}`);await summary.getByText('NASDAQ:AAPL',{exact:true}).waitFor();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar',exact:true}).click();assert.equal((await download).suggestedFilename(),'seguimiento.csv');
  await page.getByRole('button',{name:/Lista lenta/}).click();await page.getByRole('button',{name:/Cripto/}).click();
  await summary.getByText('BINANCE:BTCUSDT',{exact:true}).waitFor();
  if(pending)await pending.fulfill({json:{id:'slow',items:[item('Wrong','NYSE:WRONG',1,1)]}}).catch(()=>{});
  assert.equal(await summary.getByText('NYSE:WRONG',{exact:true}).count(),0);
  failed=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.getByRole('alert').waitFor();
  assert.ok(await summary.getByText('BINANCE:BTCUSDT',{exact:true}).count(),'last good list survives an outage');
  failed=false;await page.getByRole('button',{name:'Reintentar'}).click();await page.getByRole('alert').waitFor({state:'hidden'});
  await page.setViewportSize({width:390,height:844});await summary.getByText('BINANCE:BTCUSDT',{exact:true}).click();await page.getByText('Chart BINANCE:BTCUSDT D',{exact:true}).waitFor();
  assert.ok((await page.evaluate(()=>window.chartWidgets)).every(config=>config.allow_symbol_change===false));
  await page.evaluate(()=>window.renderModal());await page.getByRole('button',{name:'Mi lista',exact:true}).waitFor();
  await page.getByRole('button',{name:'Mi lista',exact:true}).click();await page.getByRole('alert').getByText('Límite de activos alcanzado').waitFor();
  assert.equal(await page.getByText('Agregado a "Mi lista"',{exact:true}).count(),0);
  failAdd=false;await page.getByRole('button',{name:'Mi lista',exact:true}).click();await page.getByText('Agregado a "Mi lista"',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({realSparklines:true,weeklyMonthlyReturns:true,allAssetCharts:true,refreshPreservesDrafts:true,correctMarketRoute:true,authenticatedExport:true,lateResponsesIgnored:true,outageRecovery:true,mobile:true,addErrorsVisible:true}));
 }finally{await browser.close();try{unlinkSync(filename);}catch{}}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
