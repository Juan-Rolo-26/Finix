const test = require('node:test');
const assert = require('node:assert/strict');
const {FundamentalOrchestratorService} = require('../apps/api/dist/fundamental/services/fundamental-orchestrator.service.js');
const resolved={input:'BXP',normalizedTicker:'BXP',tvSymbol:'NYSE:BXP',exchange:'NYSE',assetType:'stock',name:'BXP'};
function service(chain, adapter){return new FundamentalOrchestratorService({resolve:async()=>resolved},{getFallbackOrder:()=>chain,getAdapter:()=>adapter},{schedule:async(_,fn)=>fn()},{isOpen:async()=>false,recordFailure:async()=>{},recordSuccess:async()=>{}},{buildCacheKey:()=> 'test',get:async()=>null,set:async()=>{}},{enrich:r=>r});}
for(const scenario of ['none','failed'])test(`Upstream ${scenario}: no invented financial data`,async()=>{const s=service(scenario==='none'?[]:['fmp'],{fetchFundamentals:async()=>{throw Error('Unavailable');}});const r=await s.getFundamentals({ticker:'BXP',provider:'fmp',fallback:true,forceRefresh:true});assert.ok(Object.values(r.metrics).every(v=>v===null));assert.ok(Object.values(r.statements).every(v=>v.length===0));assert.equal(r.quality.coverage,0);assert.match(r.quality.warnings.join(' '),/no están disponibles/);});
