const assert = require('node:assert/strict');
const { test } = require('node:test');
require('reflect-metadata');
const { MarketService } = require('../src/market/market.service.ts');
const { WatchlistService } = require('../src/watchlist/watchlist.service.ts');
const { resolveMarketIdentity: identity } = require('../src/market/market-symbol.ts');
const now = Math.floor(Date.now() / 1000);
const payload = (price, times = [now - 86400, now - 3600]) => ({ chart: { result: [{ timestamp: times, indicators: { quote: [{ open: times.map(() => price), high: times.map(() => price + 1), low: times.map(() => price - 1), close: times.map(() => price), volume: times.map(() => 100) }] } }] } });
const mockFetch = (context, fn) => context.mock.method(global, 'fetch', async url => ({ ok: true, json: async () => fn(new URL(url)) }));

test('identity preserves market, currency and listing across asset classes', () => {
    for (const [symbol, yahoo, currency] of [['NASDAQ:AAPL','AAPL','USD'],['AAPL','AAPL','USD'],['BYMA:AAPL','AAPL.BA','ARS'],['GGAL.BA','GGAL.BA','ARS'],['NYSE:GGAL','GGAL','USD'],['TVC:SPX','^GSPC','USD'],['COMEX:GC1!','GC=F','USD']]) {
        assert.equal(identity(symbol).yahooSymbol, yahoo); assert.equal(identity(symbol).currency, currency);
    }
    assert.equal(identity('AAPL','BCBA').assetType,'CEDEAR');
    assert.equal(identity('BCBA:GGAL').assetType,'STOCK');
    assert.equal(identity('BINANCE:PEPEUSDT').binancePair,'PEPEUSDT');
    assert.equal(identity('BINANCE:ETHBTC').currency,'BTC');
    assert.equal(identity('ECONOMICS:ARINTR').yahooSymbol,null);
    assert.equal(identity('OANDA:XAUUSD').yahooSymbol,null,'spot gold must not become a futures contract');
});
test('local and US candle prices and caches stay separate', async context => {
    const calls=[];
    mockFetch(context,url=>{calls.push(url.pathname);return payload(url.pathname.includes('.BA')?6000:20);});
    const service=new MarketService({});
    assert.equal((await service.getCandles('BCBA:GGAL','1d','3mo')).candles[0].close,6000);
    assert.equal((await service.getCandles('NYSE:GGAL','1d','3mo')).candles[0].close,20);
    await service.getCandles('BYMA:GGAL','1d','3mo');
    assert.deepEqual(calls,['/v8/finance/chart/GGAL.BA','/v8/finance/chart/GGAL']);
});
test('minute and hourly intervals use real requested bars', async context => {
    const calls=[];mockFetch(context,url=>{calls.push(url.searchParams.get('interval'));return payload(100);});
    const service=new MarketService({});
    await service.getCandles('NASDAQ:MSFT','15m','5d');
    const result=await service.getCandles('NASDAQ:MSFT','4h','3mo');
    assert.deepEqual(calls,['15m','1h']);assert.ok(result.candles.every(bar=>bar.time%14400===0));
});
test('arbitrary Binance pairs preserve interval and range', async context => {
    mockFetch(context,url=>{assert.equal(url.searchParams.get('symbol'),'PEPEUSDT');assert.equal(url.searchParams.get('interval'),'15m');assert.ok(Number(url.searchParams.get('startTime'))>=Date.now()-86401000);return [[(now-900)*1000,'12','13','11','12.5','5']];});
    assert.equal((await new MarketService({}).getCandles('BINANCE:PEPEUSDT','15m','1d')).candles[0].close,12.5);
});
test('unmapped assets stay empty; invalid, duplicate and future bars never reach graphs', async context => {
    const mock=mockFetch(context,()=>{const data=payload(100,[now-3600,now-86400,now-3600,now+3600,now-7200]);data.chart.result[0].indicators.quote[0].open[4]=null;return data;});
    const service=new MarketService({});
    assert.deepEqual((await service.getCandles('ECONOMICS:ARINTR')).candles,[]);assert.equal(mock.mock.callCount(),0);
    assert.deepEqual((await service.getCandles('NASDAQ:AAPL')).candles.map(bar=>bar.time),[now-86400,now-3600]);
});
test('single add and import resolution respect actual asset classes', async () => {
    for(const [symbol,market,currency,assetType]of[['AAPL','US','USD','STOCK'],['BCBA:AAPL','BCBA','ARS','CEDEAR'],['BCBA:GGAL','BCBA','ARS','STOCK'],['BINANCE:SOLUSDT','BINANCE','USD','CRYPTO'],['TVC:SPX','TVC','USD','INDEX']]){
        let saved;const prisma={user:{findUnique:async()=>({plan:'PRO'})},watchlist:{findFirst:async()=>({items:[]})},watchlistItem:{create:async({data})=>(saved={id:'item',...data})}};
        await new WatchlistService(prisma,{getQuote:async()=>({price:100})},{}).addItem('user','list',{symbol});
        assert.equal(saved.market,market);assert.equal(saved.currency,currency);assert.equal(saved.assetType,assetType);
    }
    const result=await new WatchlistService({}, {}, {}).resolveSymbols(['AAPL','BCBA:GGAL','BYMA:AAPL','BINANCE:BTCUSDT']);
    assert.deepEqual(result.items[0].candidates.map(item=>item.symbol),['BCBA:AAPL','NASDAQ:AAPL']);
    assert.deepEqual(result.items[1].candidates.map(item=>item.symbol),['BCBA:GGAL']);
    assert.equal(result.items[2].candidates[0].symbol,'BCBA:AAPL');assert.equal(result.items[3].candidates[0].assetType,'CRYPTO');
});
test('prefixed stocks receive their earnings and correctly priced local quotes', async () => {
    let query;const items=[{id:'local',symbol:'BCBA:GGAL',market:'BCBA',currency:'ARS',notes:[]},{id:'us',symbol:'NASDAQ:MSFT',market:'NASDAQ',currency:'USD',notes:[]}];
    const prisma={user:{findUnique:async()=>({plan:'PRO'})},watchlist:{findFirst:async()=>({id:'list',items})},holding:{findMany:async()=>[]},marketAlert:{findMany:async()=>[]},marketCalendarEvent:{findMany:async args=>{query=args;return [{ticker:'MSFT',date:'2026-10-28',title:'MSFT earnings'}];}}};
    const data=await new WatchlistService(prisma,{getQuotes:async symbols=>symbols.map(inputSymbol=>({inputSymbol,symbol:inputSymbol,price:inputSymbol==='BCBA:GGAL'?6000:120,change:1,unavailable:false}))},{}).getWatchlistDetail('user','list');
    assert.ok(query.where.ticker.in.includes('MSFT'));assert.equal(data.items[1].nextEarnings.date,'2026-10-28');assert.equal(data.items[0].currentPrice,6000);assert.equal(data.items[0].chartSymbol,'BCBA:GGAL');
});
test('updating and disabling linked alerts never creates duplicates', async () => {
    const calls=[];const item={id:'item',symbol:'NYSE:KO',targetPrice:50,targetDirection:'BELOW',alertId:'alert'};
    const prisma={watchlistItem:{findFirst:async()=>item,update:async({data})=>({...item,...data})}};
    const alerts={updateAlert:async(...args)=>calls.push(args),createAlert:async()=>{throw Error('Duplicate');}};
    const service=new WatchlistService(prisma,{},alerts);
    await service.updateItem('user','list','item',{targetPrice:55,targetDirection:'BELOW',alertEnabled:true,alertChannel:'PUSH'});
    await service.updateItem('user','list','item',{alertEnabled:false});
    assert.equal(calls[0][1],'alert');assert.equal(calls[0][2].targetValue,55);assert.equal(calls[0][2].condition,'LESS_THAN');assert.equal(calls[0][2].notificationChannel,'PUSH');assert.equal(calls[1][2].status,'DISABLED');
});

test('rate-limited Yahoo requests retry the same asset on the second provider host', async context => {
    const hosts=[];
    context.mock.method(global,'fetch',async url=>{const parsed=new URL(url);hosts.push(parsed.host);return parsed.host.startsWith('query1')?{ok:false,status:429}:{ok:true,status:200,json:async()=>payload(100)};});
    const result=await new MarketService({}).getCandles('NYSE:KO');
    assert.equal(result.candles[0].close,100);
    assert.deepEqual(hosts,['query1.finance.yahoo.com','query2.finance.yahoo.com']);
});

test('batch imports deduplicate canonical aliases and retain crypto metadata', async () => {
    const saved=[];const prisma={user:{findUnique:async()=>({plan:'PRO'})},watchlist:{findFirst:async()=>({items:[]})},watchlistItem:{create:async({data})=>{saved.push(data);return data;}}};
    const result=await new WatchlistService(prisma,{},{}).batchImport('user','list',{items:[{symbol:'BYMA:GGAL'},{symbol:'BCBA:GGAL'},{symbol:'BINANCE:SOLUSDT'}]});
    assert.equal(result.addedCount,2);assert.equal(result.duplicatesSkipped,1);
    assert.equal(saved[1].market,'BINANCE');assert.equal(saved[1].assetType,'CRYPTO');
});
test('invalid alert targets are rejected before any watchlist write', async () => {
    let writes=0;const prisma={watchlistItem:{findFirst:async()=>({symbol:'NASDAQ:MSFT',targetPrice:null}),update:async()=>{writes++;}}};
    const service=new WatchlistService(prisma,{},{});
    await assert.rejects(()=>service.updateItem('user','list','item',{targetPrice:-1,alertEnabled:true}));
    await assert.rejects(()=>service.updateItem('user','list','item',{targetPrice:null,alertEnabled:true}));
    assert.equal(writes,0);
});
