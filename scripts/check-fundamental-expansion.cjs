const f=require('../apps/api/dist/analysis/fundamental-import');
f.fetchObservedFundamentals(f.FUNDAMENTAL_EXPANSION_TICKERS).then(rows=>console.log(JSON.stringify({requested:f.FUNDAMENTAL_EXPANSION_TICKERS.length,verified:rows.size,missing:f.FUNDAMENTAL_EXPANSION_TICKERS.filter(t=>!rows.has(t))}))).catch(e=>{console.error(e.message);process.exitCode=1});
