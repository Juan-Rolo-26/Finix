const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEconomicSurprise } = require('../packages/shared/dist');
const { ValueCreationService } = require('../apps/api/dist/market/value-creation.service');
const { MarketService } = require('../apps/api/dist/market/market.service');
const { AdapterFMPService } = require('../apps/api/dist/fundamental/adapters/adapter-fmp.service');
test('TradingView percentages are never multiplied according to their magnitude', () => {
    const service = new ValueCreationService({});
    for (const number of [1.497, 0.3, 0, -1.2, 25]) assert.equal(service.normalizePercent(number), Number(number.toFixed(2)));
    const item = service.toItem({s:'NYSE:BXP',d:['BXP','BXP','Real Estate',1000,100,0,1,1.497,5,21,100]}, {ticker:'BXP',companyName:'BXP',sector:'Real Estate'});
    assert.equal(item.roic, 1.5);
    assert.equal(item.spread, Number((item.roic-item.wacc).toFixed(2)));
    assert.notEqual(item.status, 'CREA_VALOR');
});
test('Economic surprise follows each event, preserves zero, never borrows a stored surprise', () => {
    assert.equal(normalizeEconomicSurprise({actualValue:'50.1',consensusValue:'55',surprise:-0.1}).surprise,-4.9);
    assert.equal(normalizeEconomicSurprise({actualValue:'0',consensusValue:'0',surprise:99}).surprise,0);
    assert.equal(normalizeEconomicSurprise({actualValue:'0',consensusValue:'0'}).surprisePercent,undefined);
    for (const actualValue of [null,'',true,'50.1%',Infinity]) assert.equal(normalizeEconomicSurprise({actualValue,consensusValue:'55',surprise:99}).surprise,undefined);
});
test('FMP fractional ratios convert once, including returns above 100%', async () => {
    const adapter = new AdapterFMPService(); adapter.apiKey='isolated-fixture';
    const nativeFetch = global.fetch;
    global.fetch = async input => {
        const path = new URL(input).pathname.split('/').pop();
        return new Response(JSON.stringify(path==='profile'?[{companyName:'Fixture',currency:'USD'}]:path==='key-metrics'?[{date:'2025-12-31',period:'FY',returnOnEquity:1.2,returnOnInvestedCapital:0.0138}]:[]), { headers: { 'content-type': 'application/json' } });
    };
    try {
        const result=await adapter.fetchFundamentals({normalizedTicker:'BXP',assetType:'stock'});
        assert.equal(result.metrics.roic,1.38); assert.equal(result.metrics.roe,120);
        assert.equal(result.meta.roic.period,'FY'); assert.equal(result.meta.roic.unit,'%');
    } finally {global.fetch=nativeFetch;}
});
test('Weekend queries preserve a real stored reference date or return unavailable without fetching', async () => {
    const service = Object.create(MarketService.prototype);
    service.snapshotLoaded=true;
    service.getPremarketSessionInfo=()=>({isWeekend:true,status:'closed',dateKey:'2026-10-10',label:'Mercado cerrado'});
    service.buildPremarketSnapshot=()=>{throw new Error('Must not query quotes');};
    service.dailyPremarket={dateKey:'2026-10-09',updatedAt:'2026-10-09T13:30:00Z',session:{},indices:[],crypto:[]};
    const saved=await service.getPremarket(true); assert.equal(saved.dateKey,'2026-10-09'); assert.equal(saved.session.status,'closed');
    service.dailyPremarket={dateKey:'2026-10-10',session:{},indices:[],crypto:[]};
    const missing=await service.getPremarket(); assert.equal(missing.dateKey,null); assert.equal(missing.updatedAt,null); assert.deepEqual(missing.indices,[]);
});
test('The ART backup cannot freeze pre-market before the New York bell in standard time', async () => {
    const service=Object.create(MarketService.prototype);
    let captures=0; service.captureFinalPremarketSnapshot=async()=>{captures++;};
    for(const info of [{isWeekend:true,status:'closed'},{isWeekend:false,status:'pre-market'}]) {
        service.getPremarketSessionInfo=()=>({...info,dateKey:'2026-11-02'});
        await service.backupPremarketFreezeArt(); assert.equal(captures,0);
    }
    service.getPremarketSessionInfo=()=>({isWeekend:false,status:'regular',dateKey:'2026-11-02'});
    await service.backupPremarketFreezeArt(); assert.equal(captures,1);
});
