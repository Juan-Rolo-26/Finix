import { unzipSync, strFromU8 } from 'fflate';
import type { MarketService } from '../market/market.service';
import { NEWSLETTER_SECTOR_ETFS } from './newsletter-sector';
const { parseStringPromise } = require('xml2js');
type Holding={ticker:string;name:string;weight:number};
type Holdings={etf:string;date:string;source:string;items:Holding[]};
const cache=new Map<string,{at:number;data:Holdings}>();
const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:null;
const text=(node:any):string=>typeof node==='string'?node:node?String(node._||'')+(node.t||[]).map(text).join('')+(node.r||[]).map(text).join(''):'';
export function sectorEtf(name:string,proxy?:string){
 if(proxy&&NEWSLETTER_SECTOR_ETFS[proxy])return proxy;
 const names:Record<string,string>={'communication services':'XLC','consumer cyclical':'XLY','consumer defensive':'XLP','energy':'XLE','financial':'XLF','financial services':'XLF','healthcare':'XLV','industrials':'XLI','basic materials':'XLB','real estate':'XLRE','technology':'XLK','utilities':'XLU'};
 return names[name.toLowerCase()]||Object.keys(NEWSLETTER_SECTOR_ETFS).find(key=>NEWSLETTER_SECTOR_ETFS[key].toLowerCase()===name.toLowerCase())||null;
}
export async function parseSectorHoldings(bytes:Uint8Array,etf:string):Promise<Omit<Holdings,'source'>>{
 if(!NEWSLETTER_SECTOR_ETFS[etf]||bytes.length>2000000)throw Error('Invalid holdings file');
 let size=0;const allowed=new Set(['xl/worksheets/sheet1.xml','xl/sharedStrings.xml']);
 const zip=unzipSync(bytes,{filter:file=>{if(!allowed.has(file.name))return false;size+=file.originalSize;if(size>8000000)throw Error('Holdings file too large');return true;}});
 const parse=async(name:string)=>{const value=zip[name]?strFromU8(zip[name]):'';if(!value||/<!DOCTYPE|<!ENTITY/i.test(value))throw Error('Invalid holdings XML');return parseStringPromise(value);};
 const shared=zip['xl/sharedStrings.xml']?((await parse('xl/sharedStrings.xml')).sst?.si||[]).map(text):[];
 const worksheet=await parse('xl/worksheets/sheet1.xml');
 const rows=(worksheet.worksheet?.sheetData?.[0]?.row||[]).map((row:any)=>Object.fromEntries((row.c||[]).map((cell:any)=>[String(cell.$?.r||'').replace(/\d/g,''),cell.$?.t==='s'?shared[Number(cell.v?.[0])]:cell.$?.t==='inlineStr'?text(cell.is?.[0]):String(cell.v?.[0]??'')])));
 if(!rows.some((row:any)=>row.A==='Ticker Symbol:'&&row.B===etf))throw Error('Unexpected sector fund');
 const rawDate=rows.find((row:any)=>row.A==='Holdings:')?.B||'';
 const match=String(rawDate).match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})/),months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 if(!match||!months.includes(match[2]))throw Error('Missing holdings date');
 const date=match[3]+'-'+String(months.indexOf(match[2])+1).padStart(2,'0')+'-'+match[1].padStart(2,'0');
 const header=rows.findIndex((row:any)=>row.A==='Name'&&row.B==='Ticker');if(header<0)throw Error('Missing holdings header');
 const items:Holding[]=rows.slice(header+1).filter((row:any)=>/^[A-Z]{1,6}(?:[.-][A-Z])?$/.test(row.B||'')&&/^[A-Z0-9]{9}$/.test(row.C||'')&&row.H==='USD'&&!/CASH|MMKT|MONEY MARKET|FUTURE|SWAP|FORWARD|US DOLLAR|TREASURY BILL/i.test(row.A||'')).map((row:any)=>({ticker:row.B,name:row.A,weight:Number(row.E)}));
 if(!items.length||items.length>200||new Set(items.map(item=>item.ticker)).size!==items.length)throw Error('Invalid sector constituents');
 return {etf,date,items};
}
export async function loadSectorHoldings(etf:string):Promise<Holdings>{
 if(!NEWSLETTER_SECTOR_ETFS[etf])throw Error('Unknown sector');
 const cached=cache.get(etf);if(cached&&Date.now()-cached.at<6*3600000)return cached.data;
 const source='https://www.ssga.com/library-content/products/fund-data/etfs/us/holdings-daily-us-en-'+etf.toLowerCase()+'.xlsx';
 const response=await fetch(source,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Official sector holdings unavailable');
 const parsed=await parseSectorHoldings(new Uint8Array(await response.arrayBuffer()),etf);
 const age=Date.now()-Date.parse(parsed.date+'T00:00:00Z');if(age>10*86400000||age< -2*86400000)throw Error('Holdings are out of date');
 const data={...parsed,source};cache.set(etf,{data,at:Date.now()});return data;
}
export async function newsletterSectorStocks(market:Pick<MarketService,'getQuotes'>,sector:{name:string;proxySymbol?:string}|null){
 const etf=sector?sectorEtf(sector.name,sector.proxySymbol):null;
 if(!etf)return {html:'',text:'',count:0};
 try{
  const holdings=await loadSectorHoldings(etf),quotes=await market.getQuotes(holdings.items.map(item=>item.ticker));
  const byTicker=new Map(quotes.map(quote=>[quote.inputSymbol.split(':').pop()!,quote]));
  const lines=['ACCIONES DEL SECTOR · '+NEWSLETTER_SECTOR_ETFS[etf],holdings.items.length+' acciones del ETF '+etf+' · composición oficial '+holdings.date];
  let up=0,down=0,available=0;
  const rows=holdings.items.map(item=>{const quote=byTicker.get(item.ticker);const valid=quote&&!quote.unavailable&&number(quote.price)!==null&&quote.price!>0;const price=valid?new Intl.NumberFormat('es-AR',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(quote.price!):'Sin dato';const change=valid?number(quote.change):null;if(change!==null){available++;if(change>0)up++;if(change<0)down++;}const variation=change===null?'Sin dato':(change>0?'+':'')+change.toLocaleString('es-AR',{maximumFractionDigits:2})+'%';lines.push(item.name+' ('+item.ticker+'): '+price+' · '+variation);return '<tr><td><b>'+esc(item.ticker)+'</b><br><small>'+esc(item.name)+'</small></td><td>'+esc(price)+'</td><td class="'+(change!==null&&change<0?'loss':'gain')+'">'+esc(variation)+'</td></tr>';}).join('');
  return {count:holdings.items.length,text:lines.join('\n')+'\nFuente: '+holdings.source,html:'<p class="nl-note">'+holdings.items.length+' acciones del sector '+esc(NEWSLETTER_SECTOR_ETFS[etf])+' representado por '+etf+'. Composición oficial: '+holdings.date+'. '+up+' suben · '+down+' bajan · '+available+' con variación disponible.</p><table class="nl-data" role="presentation" width="100%"><thead><tr><th>Empresa</th><th>Precio USD</th><th>Variación diaria</th></tr></thead><tbody>'+rows+'</tbody></table><p class="nl-note">Cotizaciones de la rueda regular consultadas al preparar el informe; pueden tener demora. Se incluyen todas las acciones de la composición publicada del ETF sectorial, sin efectivo ni derivados. <a href="'+holdings.source+'">Composición oficial de State Street</a>.</p>'};
 }catch{return {count:0,text:'Composición completa del sector no disponible en la fuente oficial.',html:'<p class="nl-note">No se pudo obtener la composición completa del sector en la fuente oficial. No se reemplaza por una lista parcial.</p>'};}
}
