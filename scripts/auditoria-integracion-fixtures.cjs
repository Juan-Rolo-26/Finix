// This data is isolated test content, not verified quotes or user publications.
const LONG_NAME='Compañía de prueba con nombre deliberadamente extenso para comprobar que toda su identidad se lee sin recortes en cada tamaño de pantalla';
const LONG_TITLE='Título de prueba extenso sobre información de mercados y empresas que debe conservar todas sus palabras en celular y escritorio sin puntos suspensivos';
const QUOTE='Texto de prueba de una publicación citada. '.repeat(22)+'FINAL DE LA CITA';
const dataContext={queriedAt:'2026-10-10T15:00:00Z',referenceSession:'2026-10-09',source:'Fixture local de integración',priceUnit:'USD por acción',volumeUnit:'acciones en la sesión de referencia',delay:'Demora no informada por este fixture.'};
const ranks=Array.from({length:6},(_,i)=>({rank:i+1,ticker:'PRUEBA'+i,companyName:LONG_NAME,price:100+i,previousClose:99,change:1,changePercent:1+i,volume:24000000,logoUrl:'/logo-small.webp'}));
async function integrationFixtures(page){
 await page.route('**/api/**',route=>{
  if(route.request().method()!=='GET')return route.fallback();
  const path=new URL(route.request().url()).pathname.replace(/^\/api/,'');
  let json;
  if(path==='/market/rankings'||path.includes('/market/rankings/top-'))json={items:ranks,date:'2026-10-09',dataContext,isStale:true};
  if(path==='/market/premarket')json={updatedAt:null,dateKey:null,dataContext:{...dataContext,referenceSession:null,note:'No hay corte bursátil guardado.'},session:{status:'closed',label:'Mercado cerrado',nextBell:'Próxima apertura no informada',secondsToOpen:0,sentiment:'neutral',sentimentScore:0,sentimentSummary:'Sin datos para calcular el sentimiento.'},indices:[],commodities:[],magnificent7:[],argentina:[],crypto:[]};
  if(path==='/news/slots/headlines')json=[{id:'fixture-news',title:LONG_TITLE,url:'https://example.invalid',sourceName:'Fixture local',publishedAt:'2026-10-09T18:00:00Z',imageUrl:'/logo-small.webp',category:'Mercados'}];
  if(path==='/posts/feed')json={posts:[{id:'fixture-post',author:{id:'another',username:'prueba_local'},content:'Fixture de texto principal para medir legibilidad, acciones y expansión de cita.',type:'post',media:[],tickers:'PRUEBA',likesCount:4,commentsCount:0,repostsCount:0,savesCount:0,createdAt:'2026-10-09T18:00:00Z',quotedPost:{id:'quote-local',author:{id:'third',username:'cita_local'},content:QUOTE,type:'post',createdAt:'2026-10-08T18:00:00Z',media:[]}}],hasMore:false,nextCursor:null};
  return json?route.fulfill({json}):route.fallback();
 });
}
module.exports={integrationFixtures,LONG_NAME,LONG_TITLE,QUOTE,ranks,dataContext};
