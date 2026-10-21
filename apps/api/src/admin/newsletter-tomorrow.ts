import type { PrismaService } from '../prisma.service';
import { formatEconomicEventTitle } from '@finix/shared';
const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function tomorrowArgentina(now:Date){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(part=>[part.type,part.value]));return new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day)+1)).toISOString().slice(0,10);}
const timing=(value?:string|null)=>/after|amc|despu[eé]s/i.test(value||'')?'Después del cierre de EE. UU.':/before|bmo|antes/i.test(value||'')?'Antes de la apertura de EE. UU.':'Horario por confirmar';
const url=(raw?:string|null)=>{try{const parsed=new URL(raw||'');return parsed.protocol==='https:'?parsed.href:'';}catch{return '';}};
export async function newsletterTomorrow(prisma:PrismaService,now:Date){
 const date=tomorrowArgentina(now);
 const [general,earnings,dividends]=await Promise.all([
  prisma.marketCalendarEvent.findMany({where:{isPublished:true,status:{in:['PUBLISHED','APPROVED']},date},select:{title:true,country:true,eventType:true,time:true,timestampUtc:true,sourceUrl:true},orderBy:[{timestampUtc:'asc'},{title:'asc'}]}),
  prisma.marketEarningsEvent.findMany({where:{isPublished:true,date},select:{ticker:true,companyName:true,reportTiming:true,sourceUrl:true,marketCap:true},orderBy:{marketCap:'desc'}}),
  prisma.marketDividendEvent.findMany({where:{isPublished:true,OR:[{exDate:date},{paymentDate:date}]},select:{ticker:true,companyName:true,exDate:true,paymentDate:true,amount:true},orderBy:{ticker:'asc'}}),
 ]);
 const groups:{title:string;rows:{name:string;detail:string;url?:string}[]}[]=[{title:'Datos generales',rows:[]},{title:'Eventos de mercado',rows:[]},{title:'Balances',rows:[]},{title:'Dividendos',rows:[]}];
 const seen=new Set<string>();
 for(const event of general){const name=formatEconomicEventTitle(event.title,event.country),key=event.country+'|'+event.title+'|'+(event.time||'');if(seen.has(key))continue;seen.add(key);const clock=/^\d{1,2}:\d{2}/.test(event.time||'')?new Intl.DateTimeFormat('es-AR',{timeZone:'America/Argentina/Buenos_Aires',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(event.timestampUtc)+' ART':/all day|todo el d[ií]a/i.test(event.time||'')?'Todo el día':'Horario por confirmar';groups[/MARKET|CORPORATE/.test(event.eventType)?1:0].rows.push({name,detail:({US:'Estados Unidos',AR:'Argentina',EU:'Eurozona',UK:'Reino Unido',JP:'Japón',CN:'China',BR:'Brasil'}[event.country]||event.country)+' · '+clock,url:url(event.sourceUrl)});}
 for(const event of earnings){const key=event.ticker.toUpperCase();if(seen.has('balance|'+key))continue;seen.add('balance|'+key);groups[2].rows.push({name:event.ticker+' · '+event.companyName,detail:timing(event.reportTiming),url:url(event.sourceUrl)});}
 for(const event of dividends){const detail=[event.exDate===date?'Ex-dividendo':'',event.paymentDate===date?'Pago de dividendo':'',event.amount!=null?new Intl.NumberFormat('es-AR',{style:'currency',currency:'USD',maximumFractionDigits:4}).format(event.amount)+' por acción':''].filter(Boolean).join(' · '),key=event.ticker+'|'+detail;if(seen.has(key))continue;seen.add(key);groups[3].rows.push({name:event.ticker+' · '+event.companyName,detail});}
 const lines=['CALENDARIO DE MAÑANA · '+date+' · Argentina'];
 const html=groups.map(group=>{lines.push('\n'+group.title);for(const row of group.rows)lines.push(row.name+' · '+row.detail+(row.url?' · '+row.url:''));return '<h3 class="nl-subtitle">'+group.title+' · '+group.rows.length+'</h3>'+(group.rows.length?'<table class="nl-data" role="presentation" width="100%"><tbody>'+group.rows.map(row=>'<tr><td>'+(row.url?'<a href="'+esc(row.url)+'">'+esc(row.name)+'</a>':esc(row.name))+'</td><td>'+esc(row.detail)+'</td></tr>').join('')+'</tbody></table>':'<p class="nl-note">Sin eventos publicados para mañana.</p>');}).join('');
 return {date,counts:groups.map(group=>({title:group.title,count:group.rows.length})),text:lines.join('\n'),html:'<p class="nl-note">Agenda del '+date+' · mañana según la fecha de Argentina. Horarios en ART; los balances sin hora exacta indican su momento de publicación previsto. Los datos pueden actualizarse.</p>'+html};
}
