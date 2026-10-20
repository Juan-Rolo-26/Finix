import type { MarketQuote } from '../market/market.service';
import { newsletterPanel } from './newsletter-layout';

export const PREMARKET_EMAIL_GROUPS = [
    ['argentina', 'Argentina en Wall Street'], ['magnificent7', 'Las 7 Magníficas'],
    ['indices', 'Índices globales'], ['commodities', 'Materias primas'], ['crypto', 'Criptomonedas'],
] as const;
type Asset = { symbol: string; label: string; description?: string; format?: string; currency?: string;
    price?: number | null; change?: number | null; premarketPrice?: number | null; premarketChange?: number | null;
    regularPrice?: number | null; regularChange?: number | null; isPremarketQuote?: boolean; updatedAt?: string };
type Snapshot = Partial<Record<typeof PREMARKET_EMAIL_GROUPS[number][0], Asset[]>> & {
    updatedAt?: string | null; isFrozenPremarket?: boolean;
    session?: { label?: string; sentiment?: string; sentimentScore?: number; sentimentSummary?: string };
    dataContext?: { queriedAt?: string; referenceSession?: string | null; source?: string; delay?: string; note?: string };
};
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const num = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null;
const change = (v: number | null) => v === null ? 'Sin datos' : (v > 0 ? '+' : '') + new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(v) + '%';
const stamp = (v?: string | null) => v && Number.isFinite(Date.parse(v)) ? new Intl.DateTimeFormat('es-AR',{timeZone:'America/Argentina/Buenos_Aires',dateStyle:'short',timeStyle:'short'}).format(new Date(v)) + ' ART' : 'No informado';
function price(a: Asset, v: number | null) {
    if (v === null) return 'Sin cotización';
    if (a.format === 'percent') return new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(v) + '%';
    return new Intl.NumberFormat('es-AR', a.format === 'currency' ? {style:'currency',currency:a.currency || 'USD',maximumFractionDigits:2} : {maximumFractionDigits:2}).format(v);
}
export function resolveEmailPremarket(a: Asset) {
    const legacy = a.premarketPrice === undefined && a.isPremarketQuote === true;
    const pre = num(a.premarketPrice) ?? (legacy ? num(a.price) : null);
    const hasPre = pre !== null && pre > 0;
    const requiresPre = /^(NASDAQ|NYSE|AMEX):/i.test(a.symbol);
    const value = hasPre ? pre : requiresPre ? null : num(a.price);
    const variation = value === null ? null : hasPre ? num(a.premarketChange) ?? (legacy && a.premarketChange === undefined ? num(a.change) : null) : num(a.change);
    return { value, variation, label: hasPre ? 'Pre-apertura' : requiresPre ? 'Sin pre-market' : 'Referencia' };
}

/** Full category coverage, including unavailable instruments, never the old UI's search/filter state. */
export function newsletterPremarket(snapshot: Snapshot, regularQuotes: MarketQuote[], appUrl: string) {
    const groups = PREMARKET_EMAIL_GROUPS.map(([key,title]) => ({key,title,assets:snapshot[key] || []}));
    const assets = groups.flatMap(g => g.assets);
    const quoted = assets.map(resolveEmailPremarket).filter(a => a.value !== null);
    const stats = { total:assets.length, quoted:quoted.length, up:quoted.filter(a => a.variation !== null && a.variation > 0).length, down:quoted.filter(a => a.variation !== null && a.variation < 0).length };
    const scores: Record<string,string> = {bullish:'Alcista',bearish:'Bajista',cautious:'Cautela',neutral:'Neutral'};
    const score = quoted.length ? num(snapshot.session?.sentimentScore) : null;
    const climate = score === null ? 'Sin datos' : (scores[snapshot.session?.sentiment || 'neutral'] || 'Neutral') + ' · ' + Math.max(0,Math.min(100,score)) + '%';
    const context = snapshot.dataContext;
    const reference = context?.referenceSession || 'Sin corte bursátil guardado';
    const summary = ['PRE-APERTURA · CORTE DE REFERENCIA', 'Sesión: '+reference, 'Corte: 09:30 Nueva York · registro '+stamp(snapshot.updatedAt), 'Clima de mercado: '+climate, snapshot.session?.sentimentSummary || '', stats.up+' en alza · '+stats.down+' en baja · '+stats.quoted+'/'+stats.total+' cotizando', 'Fuente: '+(context?.source || 'Proveedor de cotizaciones de Finix'), context?.delay || 'Demora no informada por el proveedor.', context?.note || 'El corte de apertura se conserva por separado de la rueda regular.'];
    const bySymbol = new Map(regularQuotes.map(q => [q.inputSymbol.toUpperCase(),q]));
    const tableStyle = 'width:100%;table-layout:fixed;border-collapse:collapse;font:12px/1.5 Arial;color:#344c41';
    const body = groups.map(group => {
        summary.push('\n'+group.title+' · '+group.assets.length+' activos');
        const rows = group.assets.map(a => {
            const pre = resolveEmailPremarket(a), current = bySymbol.get(a.symbol.toUpperCase());
            const fresh = current && !current.unavailable && num(current.price) !== null;
            const regularPrice = fresh ? num(current.price) : num(a.regularPrice) ?? (!a.isPremarketQuote ? num(a.price) : null);
            const regularChange = fresh ? num(current.change) : num(a.regularChange) ?? (!a.isPremarketQuote ? num(a.change) : null);
            const regularLabel = fresh ? 'Regular · '+stamp(current.updatedAt) : 'Regular en el registro';
            const name = a.label + ' · ' + (a.symbol.split(':').pop() || a.symbol);
            summary.push(name + ': '+price(a,pre.value)+' ('+change(pre.variation)+', '+pre.label+'); regular '+price(a,regularPrice)+' ('+change(regularChange)+') · '+regularLabel+' · '+(a.description || '')+' · registro '+stamp(a.updatedAt));
            return '<tr><td style="width:44%;padding:9px 6px 9px 0;border-top:1px solid #e5eee8;overflow-wrap:anywhere"><a style="color:#17332a;text-decoration:none;font-weight:bold" href="'+esc(appUrl+'/market?symbol='+encodeURIComponent(a.symbol))+'">'+esc(name)+'</a><div style="font-size:10px;color:#71857a">'+esc(a.description || '')+'<br>'+esc(stamp(a.updatedAt))+'</div></td><td style="width:28%;padding:9px 5px;border-top:1px solid #e5eee8;vertical-align:top"><b>'+esc(price(a,pre.value))+'</b><br>'+esc(change(pre.variation))+'<div style="font-size:10px;color:#71857a">'+esc(pre.label)+'</div></td><td style="width:28%;padding:9px 0 9px 5px;border-top:1px solid #e5eee8;vertical-align:top"><b>'+esc(price(a,regularPrice))+'</b><br>'+esc(change(regularChange))+'<div style="font-size:10px;color:#71857a">'+esc(regularLabel)+'</div></td></tr>';
        }).join('');
        return newsletterPanel(group.title+' · '+group.assets.length+' activos', '<table width="100%" cellspacing="0" cellpadding="0" style="'+tableStyle+'"><thead><tr><th align="left" width="44%">Activo</th><th align="left" width="28%">Pre-apertura / referencia</th><th align="left" width="28%">Rueda regular</th></tr></thead><tbody>'+ (rows || '<tr><td colspan="3" style="padding:10px 0">Sin corte disponible para esta categoría.</td></tr>')+'</tbody></table>');
    }).join('');
    const header = newsletterPanel('Pre-apertura completa · resumen y cotizaciones', '<p style="margin:0 0 8px;font-size:13px;color:#344c41"><b>Clima de mercado: '+esc(climate)+'</b><br>'+esc(snapshot.session?.sentimentSummary || 'Sin resumen disponible.')+'</p><p style="margin:0 0 8px;font-size:12px">'+stats.up+' en alza · '+stats.down+' en baja · '+stats.quoted+' / '+stats.total+' cotizando</p><p style="margin:0;font-size:11px;color:#71857a">Sesión del corte: '+esc(reference)+' · 09:30 Nueva York · '+(snapshot.isFrozenPremarket ? 'Corte guardado' : 'Registro disponible')+'<br>Registro: '+esc(stamp(snapshot.updatedAt))+' · Consulta: '+esc(stamp(context?.queriedAt))+'<br>Fuente: '+esc(context?.source || 'Proveedor de cotizaciones de Finix')+'. '+esc(context?.delay || 'Demora no informada por el proveedor.')+'<br>'+esc(context?.note || 'El corte de apertura se conserva por separado de la rueda regular.')+'<br>Las cotizaciones de la apertura no son precios de cierre. La columna regular indica su momento de consulta.</p>');
    return {html:header+body,text:summary.join('\n'),stats,groups:groups.map(g=>({key:g.key,count:g.assets.length}))};
}
