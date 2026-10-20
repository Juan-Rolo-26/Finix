const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { NewsletterScheduler } = require('../apps/api/dist/admin/newsletter.scheduler');
const { newsletterLayout, newsletterCompanyHeading } = require('../apps/api/dist/admin/newsletter-layout');
const now = new Date('2026-10-20T15:00:00Z');
const firms = [ ['JNJ', 'Johnson & Johnson'], ['JPM', 'JPMorgan Chase'], ['NVDA', 'NVIDIA Semiconductor'], ['PG', 'Consumer Products'] ];
function fixture() {
    const articles = Array.from({ length: 8 }, (_, i) => ({ title: i < 4 ? `Argentina Merval noticia ${i}` : `Wall Street Nasdaq noticia ${i}`,
        titleEs: null, description: 'Datos de ejemplo para verificar la plantilla.', sourceName: i < 4 ? 'Ámbito' : 'Reuters',
        url: `https://example.com/news/${i}`, sourceUrl: null, publishedAt: now, category: null }));
    const sample = { label: 'Empresa con nombre largo · MSFT', price: 12345.67, change: 1.25, currency: 'USD' };
    const earnings = firms.map(([ticker, companyName]) => ({ ticker, companyName, date: '2026-10-19', logoUrl: 'https://s3-symbol-logo.tradingview.com/example.svg',
        sourceUrl: 'https://www.sec.gov/example', actualEps: 1.23, epsEstimate: 1.2, actualRevenue: 2000000, revenueEstimate: 1900000, marketCap: 1000000000 }));
    const sent = [];
    const prisma = { newsArticle: { findMany: async () => articles }, marketCalendarEvent: { findMany: async () => [] }, marketEarningsEvent: { findMany: async () => earnings } };
    const market = { getPremarket: async () => ({ indices:[],commodities:[],magnificent7:[],argentina:[],crypto:[],session:{sentiment:'neutral',sentimentScore:50},dataContext:{referenceSession:'2026-10-20'} }), getDashboard: async () => ({ dollars: [{ id: 'mep', label: 'MEP', sell: 1536 }], sections: { argentina: [sample], global: [sample], commodities: [sample], crypto: [sample] } }),
        getQuotes: async symbols => symbols.map(inputSymbol => ({ inputSymbol, price: 1234.56, change: -1.23 })),
        getFinvizHeatmap: async () => ({ sectors: [{ name: 'Tecnología', perf: 1.25 }] }) };
    const engine = new NewsletterScheduler(prisma, {}, { sendEmail: async params => { sent.push(params); return { id: 'isolated' }; } }, market, {getHighlights:async()=>({argentina:articles.slice(0,4),unitedStates:articles.slice(4,8)})});
    return { engine, sent };
}

test('daily newsletter renders both quote groups and four news items per market', async () => {
    const { engine } = fixture();
    const daily = await engine.dailyBrief(now);
    assert.ok(daily);
    assert.match(daily.html, /7 Tecnológicas/);
    assert.match(daily.html, /Semiconductores/);
    assert.match(daily.html, /max-width:880px/);
    assert.match(daily.html, /quote-column/);
    assert.match(daily.html, /@media only screen and \(max-width:640px\)/);
    assert.match(daily.html, /width:32%/);
    assert.equal((daily.html.match(/Fuente original<\/a>/g) || []).length, 8);
});

test('weekly newsletter includes a PNG logo for each of the four selected companies', async () => {
    const { engine } = fixture();
    const weekly = await engine.weeklyBrief(now);
    assert.ok(weekly);
    assert.equal((weekly.html.match(/<img /g) || []).length, 4);
    for (const [ticker] of firms) assert.match(weekly.html, new RegExp(`image-stock/${ticker}\\.png`));
    assert.doesNotMatch(weekly.html, /\.svg/);
    assert.match(weekly.html, /newsletter-panel/);
});

test('company headers escape markup and never load non-HTTPS logos', () => {
    const html = newsletterCompanyHeading({ ticker: 'AAPL', companyName: '<script>bad</script>', logoUrl: 'javascript:alert(1)' });
    assert.doesNotMatch(html, /<script>|javascript:/);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /image-stock\/AAPL.png/);
    assert.match(newsletterCompanyHeading({ ticker: 'AAPL', companyName: 'Apple', logoUrl: 'https://example.com/apple.png' }), /src="https:\/\/example.com\/apple.png"/);
    assert.match(newsletterLayout('FINIX', '<title>', 'subtitle', 'body'), /&lt;title&gt;/);
});

test('previews use the official mail service, label live data, and never create a campaign', async () => {
    const { engine, sent } = fixture();
    const result = await engine.sendTestBriefings('juanpablorolo2007@gmail.com');
    assert.equal(result.sent, true);
    assert.equal(sent.length, 2);
    assert.ok(sent.every(mail => mail.to === 'juanpablorolo2007@gmail.com'));
    assert.match(sent[0].html, /VISTA PREVIA DE DISEÑO/);
    assert.doesNotMatch(sent[0].html, /Cotizaciones al cierre/);
    assert.match(sent[1].subject, /semana/);
    await assert.rejects(engine.sendTestBriefings('someone@example.com'));
});

test('a midweek weekly preview can use the last complete week without changing scheduled selection', async () => {
    const { engine, sent } = fixture();
    const references = [];
    engine.weeklyBrief = async date => {
        references.push(date);
        return references.length === 1 ? null : { day: 'viernes anterior', weekStart: '2026-10-12', weekEnd: '2026-10-16', message: 'Muestra', html: 'Muestra' };
    };
    await engine.sendTestBriefings('juanpablorolo2007@gmail.com');
    assert.equal(references.length, 2);
    assert.equal(new Date(references[1].getTime() - 3 * 3600000).getUTCDay(), 5);
    assert.match(sent[1].subject, /2026-10-12 al 2026-10-16/);
});

if (process.env.FINIX_NEWSLETTER_FIXTURES_DIR) {
    const fs = require('node:fs');
    const path = require('node:path');
    const { engine } = fixture();
    Promise.all([engine.dailyBrief(now), engine.weeklyBrief(now)]).then(([daily, weekly]) => {
        fs.writeFileSync(path.join(process.env.FINIX_NEWSLETTER_FIXTURES_DIR, 'daily.html'), daily.html);
        fs.writeFileSync(path.join(process.env.FINIX_NEWSLETTER_FIXTURES_DIR, 'weekly.html'), weekly.html);
    });
}


test('legacy TradingView earnings missing URLs get their company source and distinct sectors', async () => {
    const { engine } = fixture();
    engine.prisma.marketEarningsEvent.findMany = async () => [
        ['JNJ', 'Johnson & Johnson'], ['JPM', 'JPMorgan Chase'], ['TSM', 'Taiwan Semiconductor'], ['NFLX', 'Netflix'],
    ].map(([ticker, companyName]) => ({ ticker, companyName, date: '2026-10-13', source: 'TradingView Official Scanner', sourceUrl: null, actualEps: 1, actualRevenue: 1000, marketCap: 1000000 }));
    const weekly = await engine.weeklyBrief(now);
    assert.ok(weekly, 'four reported sectors remain eligible even for older cached records');
    assert.match(weekly.html, /NYSE-JNJ\/financials-earnings/);
    assert.match(weekly.html, /NASDAQ-NFLX\/financials-earnings/);
    assert.match(weekly.html, /Resultados en TradingView/);
    assert.match(weekly.html, /Comunicaciones/);
});


test('daily bulletin uses a labeled ETF reference when Finviz is unavailable',async()=>{
 const {engine}=fixture();engine.market.getFinvizHeatmap=async()=>{throw Error('provider unavailable');};
 engine.market.getQuotes=async symbols=>symbols.map((symbol,i)=>({inputSymbol:symbol,symbol,price:100,change:i/10,unavailable:false}));
 let daily=await engine.dailyBrief(now);assert.match(daily.html,/Servicios públicos/);assert.match(daily.html,/11 ETF sectoriales/);assert.match(daily.html,/mainfund\/XLU/);assert.doesNotMatch(daily.html,/Fuente: Finviz/);
 engine.market.getQuotes=async()=>[];daily=await engine.dailyBrief(now);assert.match(daily.html,/no informó una variación sectorial confiable/);
});

const {newsletterPremarket,resolveEmailPremarket}=require('../apps/api/dist/admin/newsletter-premarket');
test('full premarket coverage is added without losing the existing close, news or agenda',async()=>{
 const {engine}=fixture();const keys=['argentina','magnificent7','indices','commodities','crypto'];
 engine.market.getPremarket=async()=>Object.fromEntries([...keys.map((key,i)=>[key,Array.from({length:12},(_,j)=>({symbol:'NASDAQ:MARKER'+i+'X'+j,label:'Empresa '+i+'X'+j,description:'Descripción única '+i+'X'+j,format:'currency',currency:'USD',premarketPrice:123,premarketChange:0,regularPrice:124,regularChange:1,updatedAt:'2026-10-20T13:30:00Z'}))]),['session',{sentiment:'neutral',sentimentScore:50}],['dataContext',{referenceSession:'2026-10-20',source:'Fuente verificable'}]]);
 engine.market.getQuotes=async symbols=>symbols.map(symbol=>({inputSymbol:symbol,symbol,price:125,change:-1,updatedAt:'2026-10-20T20:00:00Z',unavailable:false}));
 const daily=await engine.dailyBrief(now);for(let i=0;i<5;i++)for(let j=0;j<12;j++){assert.ok(daily.html.includes('MARKER'+i+'X'+j));assert.ok(daily.message.includes('MARKER'+i+'X'+j));assert.ok(daily.html.includes('Descripción única '+i+'X'+j));}
 assert.match(daily.html,/60 \/ 60 cotizando/);assert.match(daily.html,/09:30 Nueva York/);assert.match(daily.html,/Rueda regular/);assert.match(daily.html,/Semiconductores/);assert.equal((daily.html.match(/Fuente original<\/a>/g)||[]).length,8);assert.ok(Buffer.byteLength(daily.html,'utf8')<100*1024,'Gmail-size budget for the complete catalog');
});
test('US regular quotes never masquerade as premarket; zero and unavailable data remain distinct',()=>{
 const a={symbol:'NASDAQ:AAPL',price:123,change:1,premarketPrice:null};assert.equal(resolveEmailPremarket(a).value,null);
 assert.deepEqual(resolveEmailPremarket({...a,premarketPrice:124,premarketChange:0}),{value:124,variation:0,label:'Pre-apertura'});
 assert.equal(resolveEmailPremarket({...a,premarketPrice:undefined,isPremarketQuote:true}).value,123);
 const data=newsletterPremarket({indices:[a],session:{sentimentScore:50},dataContext:{referenceSession:'2026-10-19'}},[],'https://finixarg.com');assert.match(data.html,/Sin pre-market/);assert.match(data.html,/Sin cotización/);assert.match(data.html,/2026-10-19/);assert.equal(data.stats.quoted,0);
 const safe=newsletterPremarket({indices:[{...a,label:'<script>bad</script>',description:'<b>escaped</b>'}]},[],'https://finixarg.com');assert.doesNotMatch(safe.html,/<script>|<b>escaped/);
});
