import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EmailMarketingService } from './email-marketing.service';
import { MailService } from '../mail/mail.service';
import { MarketService } from '../market/market.service';
import { NewsletterNewsService } from './newsletter-news.service';
import { NewsTranslationService } from '../news/news-translation.service';
import { getCedearDefinition } from '../market/cedear.data';
import { NEWSLETTER_SECTOR_ETFS, leadingSectorEtf } from './newsletter-sector';
import { PREMARKET_EMAIL_GROUPS, newsletterPremarket } from './newsletter-premarket';
import { newsletterLayout as layout, newsletterPanel as panel, newsletterCompanyHeading } from './newsletter-layout';

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const href = (v?: string | null) => { try { const u = new URL(v || ''); return u.protocol === 'https:' ? esc(u.toString()) : ''; } catch { return ''; } };
const app = (process.env.FRONTEND_URL || 'https://finixarg.com').replace(/\/$/, '');
const dateKey = (d: Date) => new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: 'long', year: 'numeric' }).format(d);
const shortDate = (d?: Date | null) => d ? new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: 'short' }).format(d) : '';
const trusted = /(^|\.)sec\.gov$|(^|\.)nasdaq\.com$|(^|\.)nyse\.com$|(^|\.)reuters\.com$|(^|\.)apnews\.com$|(^|\.)bloomberg\.com$|(^|\.)tradingview\.com$/i;
const testRecipient = 'juanpablorolo2007@gmail.com';

@Injectable()
export class NewsletterScheduler {
    private readonly logger = new Logger(NewsletterScheduler.name);
    constructor(private readonly prisma: PrismaService, private readonly campaigns: EmailMarketingService, private readonly mail: MailService, private readonly market: MarketService, private readonly news: NewsletterNewsService = new NewsletterNewsService(prisma, new NewsTranslationService())) {}

    private async ownerId() {
        const email = process.env.ADMIN_OWNER_EMAIL?.trim();
        const user = email ? await this.prisma.user.findFirst({ where: { email, role: 'ADMIN' }, select: { id: true } })
            : await this.prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
        return user?.id || null;
    }

    private async queue(key: string, audience: 'DAILY' | 'WEEKLY', subject: string, title: string, message: string, contentHtml: string) {
        if (process.env.FINIX_APPROVED_EMAILS_ENABLED !== 'true') return;
        const createdById = await this.ownerId();
        if (createdById) await this.campaigns.createApprovedCampaign({ sourceKey: key, audience, subject, title, message, contentHtml, createdById });
    }

    private async dailyBrief(now: Date) {
        const [highlights, marketData, macroEvents, earnings, technologyQuotes, semiconductorQuotes, sectorMap, premarketData] = await Promise.all([
            this.news.getHighlights(now),
            this.market.getDashboard().catch(() => null),
            this.prisma.marketCalendarEvent.findMany({
                where: { isPublished: true, status: 'PUBLISHED', timestampUtc: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) } },
                select: { title: true, date: true, time: true, country: true, sourceUrl: true, actualValue: true, forecastValue: true, consensusValue: true, impactScore: true },
                orderBy: [{ impactScore: 'desc' }, { timestampUtc: 'asc' }], take: 3,
            }).catch(() => []),
            this.prisma.marketEarningsEvent.findMany({
                where: { isPublished: true, timestampUtc: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) } },
                select: { ticker: true, companyName: true, date: true, reportTiming: true, sourceUrl: true },
                orderBy: { timestampUtc: 'asc' }, take: 4,
            }).catch(() => []),
            this.market.getQuotes(['AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA']).catch(() => []),
            this.market.getQuotes(['NVDA','AVGO','AMD','QCOM','INTC','MU','TSM']).catch(() => []),
            this.market.getFinvizHeatmap('d1').catch(() => null),
            this.market.getPremarket(),
        ]);
        const premarketSymbols = PREMARKET_EMAIL_GROUPS.flatMap(([key]) => (premarketData[key] || []).map((asset: {symbol:string}) => asset.symbol));
        const regularQuotes = premarketSymbols.length ? await this.market.getQuotes([...new Set<string>(premarketSymbols)]).catch(() => []) : [];
        const premarket = newsletterPremarket(premarketData, regularQuotes, app);
        const local = highlights.argentina;
        const global = highlights.unitedStates;
        const articles = [...local, ...global];
        const investment = [];

        const storyRows = (items: typeof articles, empty: string) => items.length
            ? items.map(a => {
                const title = a.title, desc = (a.description || '').trim(), link = href(a.url);
                return '<tr><td style="padding:9px 0;border-top:1px solid #e5eee8"><div style="font-size:13px;line-height:1.4;font-weight:bold;color:#203b30">' + (link ? '<a style="color:#203b30;text-decoration:none" href="' + link + '">' + esc(title) + '</a>' : esc(title)) + '</div><p style="margin:4px 0 0;color:#60766b;font-size:12px;line-height:1.45">' + esc(desc || 'Abrí la publicación para consultar los detalles.') + '</p><div style="margin-top:4px;font-size:11px;color:#84968d">' + esc(a.sourceName || 'Fuente') + (a.publishedAt ? ' · ' + esc(shortDate(a.publishedAt)) : '') + (link ? ' · <a style="color:#087747" href="' + link + '">Fuente original</a>' : '') + '</div></td></tr>';
            }).join('')
            : '<tr><td style="padding:8px 0;color:#71857a;font-size:12px">' + esc(empty) + '</td></tr>';
        const storyPanel = (label: string, items: typeof articles, empty: string) =>
            panel(label, '<table role="presentation" width="100%" cellspacing="0" cellpadding="0">' + storyRows(items, empty) + '</table>');

        const fmt = (value: unknown, currency?: string) => typeof value !== 'number' || !Number.isFinite(value) ? '—' :
            currency ? new Intl.NumberFormat('es-AR', { style:'currency', currency, maximumFractionDigits: currency === 'ARS' ? 0 : 2 }).format(value) :
            new Intl.NumberFormat('es-AR', { maximumFractionDigits:2 }).format(value);
        const quoteRows = (items: any[], limit: number) => (Array.isArray(items) ? items : []).filter(a => typeof a.price === 'number' && Number.isFinite(a.price)).slice(0,limit).map(a =>
            '<tr><td style="width:46%;padding:9px 6px 9px 0;border-top:1px solid #e5eee8;color:#344c41;font-size:12px;line-height:1.5;overflow-wrap:anywhere">' + esc(a.label || a.symbol || 'Activo') + '</td><td align="right" style="width:32%;padding:9px 2px;border-top:1px solid #e5eee8;color:#344c41;font-size:12px;font-weight:bold;white-space:nowrap">' + esc(fmt(a.price,a.currency)) + '</td><td align="right" style="width:22%;white-space:nowrap;padding:9px 0 9px 7px;border-top:1px solid #e5eee8;color:' + (typeof a.change === 'number' && a.change < 0 ? '#bd4545' : '#087747') + ';font-size:11px;font-weight:bold">' + (typeof a.change === 'number' ? (a.change > 0 ? '+' : '') + fmt(a.change) + '%' : '—') + '</td></tr>'
        ).join('');
        const quoteBox = (title: string, items: any[], limit: number) => {
            const rows = quoteRows(items,limit); if (!rows) return '';
            return '<td class="quote-column" width="50%" style="width:50%;box-sizing:border-box;vertical-align:top;padding:7px"><div style="padding:16px;border:1px solid #e0ece5;border-radius:12px;background:#fbfdfb"><div style="font-size:12px;color:#087747;font-weight:bold;margin-bottom:5px">' + esc(title) + '</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;table-layout:fixed">' + rows + '</table></div></td>';
        };
        const quoteAssets = (items: any[], labels: Record<string,string>) => (Array.isArray(items) ? items : []).map(q => ({ label: labels[q.inputSymbol || q.symbol] || q.inputSymbol || q.symbol, symbol: q.symbol, price: q.price, change: q.change, currency: 'USD' }));
        const techLabels: Record<string,string> = { AAPL:'Apple · AAPL', MSFT:'Microsoft · MSFT', NVDA:'NVIDIA · NVDA', AMZN:'Amazon · AMZN', GOOGL:'Alphabet · GOOGL', META:'Meta · META', TSLA:'Tesla · TSLA' };
        const semiLabels: Record<string,string> = { NVDA:'NVIDIA · NVDA', AVGO:'Broadcom · AVGO', AMD:'AMD · AMD', QCOM:'Qualcomm · QCOM', INTC:'Intel · INTC', MU:'Micron · MU', TSM:'TSMC · TSM' };
        const sectorRows = (sectorMap as { sectors?: any[] } | null)?.sectors || [];
        const dailySectors = sectorRows.filter((s:any) => typeof s.perf === 'number').sort((a:any,b:any) => b.perf-a.perf);
        const leadingSector: { name: string; perf: number; proxySymbol?: string } | null = dailySectors[0] ||
            leadingSectorEtf(await this.market.getQuotes(Object.keys(NEWSLETTER_SECTOR_ETFS).map(ticker => 'AMEX:' + ticker)).catch(() => []));
        const sectorBasis = leadingSector?.proxySymbol
            ? 'Comparación de los 11 ETF sectoriales del S&P 500 · referencia del sector mediante ' + leadingSector.proxySymbol + ' · Fuente: TradingView · <a style="color:#087747" href="https://www.ssga.com/mainfund/' + esc(leadingSector.proxySymbol) + '">Ver ETF de referencia</a>'
            : 'Variación sectorial ponderada por capitalización · Fuente: Finviz';
        const sectorHighlight = leadingSector ? panel(leadingSector.perf > 0 ? 'Sector destacado del día · EE. UU.' : 'Mejor desempeño relativo · EE. UU.', '<div style="font-size:19px;font-weight:bold;color:#17332a">' + esc(leadingSector.name) + ' <span style="color:' + (leadingSector.perf >= 0 ? '#087747' : '#bd4545') + '">' + (leadingSector.perf > 0 ? '+' : '') + esc(fmt(leadingSector.perf)) + '%</span></div><p style="margin:5px 0 0;color:#71857a;font-size:11px">' + (leadingSector.perf > 0 ? 'Mayor suba de la comparación diaria' : 'Mayor variación relativa de la comparación diaria') + ' · cierre del ' + esc(dateKey(now)) + ' · ' + sectorBasis + '</p>') : panel('Sector destacado del día · EE. UU.','<p style="margin:0;color:#71857a;font-size:12px">El proveedor no informó una variación sectorial confiable para esta rueda.</p>');
        const dollarTiles = (marketData?.dollars || []).filter((d:any) => ['oficial','mep','ccl','blue'].includes(String(d.id).toLowerCase())).slice(0,4);
        const fx = dollarTiles.length ? '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px"><tr>' + dollarTiles.map((d:any) => '<td class="fx-tile" style="width:25%;padding:5px"><div style="padding:11px 8px;border:1px solid #e8eaf2;border-radius:10px;text-align:center;background:#fbfdfb"><div style="font-size:10px;color:#74867c;text-transform:uppercase;font-weight:bold">Dólar ' + esc(d.label || d.id) + '</div><div style="font-size:17px;color:#17332a;font-weight:bold">' + esc(fmt(d.sell,'ARS')) + '</div></div></td>').join('') + '</tr></table>' : '';
        const quotes = marketData?.sections ? '<div style="margin:0 0 15px"><div style="font-size:12px;color:#087747;font-weight:bold;margin:0 5px 5px">Cotizaciones al cierre · ' + esc(dateKey(now)) + '</div>' + fx + '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;table-layout:fixed"><tr>' + quoteBox('7 Tecnológicas',quoteAssets(technologyQuotes,techLabels),7) + quoteBox('Semiconductores',quoteAssets(semiconductorQuotes,semiLabels),7) + '</tr><tr>' + quoteBox('Argentina · S&P Merval y acciones',marketData.sections.argentina,6) + quoteBox('Índices de EE. UU. y mundo',marketData.sections.global,5) + '</tr><tr>' + quoteBox('Materias primas',marketData.sections.commodities,4) + quoteBox('Cripto',marketData.sections.crypto,3) + '</tr></table><p style="font-size:10px;color:#7b8d83;margin:6px 5px 0">Variaciones de la rueda según disponibilidad de cada fuente. <a style="color:#087747" href="' + app + '/market">Ver mercados en Finix</a></p></div>' : '';

        const equities = (marketData?.sections?.argentina || []).filter((a:any) => a.id !== 'merval' && typeof a.change === 'number');
        const gainers = equities.filter((a:any) => a.change > 0).sort((a:any,b:any) => b.change-a.change).slice(0,3);
        const losers = equities.filter((a:any) => a.change < 0).sort((a:any,b:any) => a.change-b.change).slice(0,3);
        const movers = equities.length ? panel('Renta variable local · variación disponible',
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="width:50%;vertical-align:top;padding-right:12px"><div style="font-size:11px;color:#087747;font-weight:bold">' + (gainers.length ? 'MAYORES SUBAS' : 'SIN SUBAS EN LA MUESTRA') + '</div><table role="presentation" width="100%">' + (gainers.length ? quoteRows(gainers,3) : '<tr><td style="padding:7px 0;color:#71857a;font-size:11px">No hubo variaciones positivas entre estos activos.</td></tr>') + '</table></td><td style="width:50%;vertical-align:top;border-left:1px solid #e5eee8;padding-left:12px"><div style="font-size:11px;color:#bd4545;font-weight:bold">' + (losers.length ? 'MAYORES BAJAS' : 'SIN BAJAS EN LA MUESTRA') + '</div><table role="presentation" width="100%">' + (losers.length ? quoteRows(losers,3) : '<tr><td style="padding:7px 0;color:#71857a;font-size:11px">No hubo variaciones negativas entre estos activos.</td></tr>') + '</table></td></tr></table>') : '';

        const agendaCandidates = [
            ...macroEvents.map(e => ({ title:e.title, date:e.date, time:e.time, url:e.sourceUrl, detail:[e.country,e.actualValue ? 'Dato: '+e.actualValue : '',e.consensusValue ? 'Consenso: '+e.consensusValue : e.forecastValue ? 'Estimación: '+e.forecastValue : ''].filter(Boolean).join(' · ') })),
            ...earnings.map(e => ({ title:e.ticker+' · '+e.companyName, date:e.date, time:e.reportTiming, url:e.sourceUrl, detail:'Resultados en agenda' })),
        ];
        const agendaItems = [...new Map(agendaCandidates.map(e => [e.title+'|'+e.date+'|'+(e.time || ''),e])).values()].slice(0,4);
        const agenda = agendaItems.length ? panel('Agenda para seguir',
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0">' + agendaItems.map(e => '<tr><td style="padding:6px 0;border-top:1px solid #e5eee8;font-size:12px;color:#344c41"><b>' + esc(e.title) + '</b><br><span style="color:#74867c">' + esc(e.date) + (e.time ? ' · '+esc(e.time) : '') + (e.detail ? ' · '+esc(e.detail) : '') + '</span>' + (href(e.url) ? ' · <a style="color:#087747" href="'+href(e.url)+'">Fuente</a>' : '') + '</td></tr>').join('') + '</table>') : '';
        const investmentPanel = investment.length ? storyPanel('Una inversión para analizar · no es una recomendación',investment,'Sin novedades recientes de deuda o resultados.')
            : panel('Idea para investigar','<p style="margin:0;color:#60766b;font-size:12px">Seguí resultados, valuaciones y eventos publicados antes de tomar decisiones.</p><a style="color:#087747" href="'+app+'/calendario">Abrir calendario de Finix</a>');
        const title = 'El cierre de mercado, en contexto', day = dateKey(now);
        const mood = marketData?.pulse ? '<p style="margin:0 0 8px;color:#415c4e;font-size:13px"><b>'+esc(marketData.pulse.label)+':</b> '+esc(marketData.pulse.summary)+'</p>' : '';
        const message = articles.slice(0,12).map(a => a.title+': '+(a.description || '')+' ('+(a.url)+')').join('\n\n') + '\n\nAgenda: ' + agendaItems.map(e=>e.title+' · '+e.date+' '+(e.url || '')).join('\n') + '\n\n' + premarket.text;
        const html = layout('AFTER MARKET · CIERRE DE MERCADO',title,day+' · Resumen de la rueda argentina y global, después del cierre.',
            quotes + sectorHighlight +
            panel('El pulso de la rueda',mood+'<p style="margin:0;color:#60766b;font-size:12px">Cierre diario · noticias y variaciones observadas durante la rueda.</p>') +
            storyPanel('Noticias destacadas · Argentina',local,'No se encontraron cuatro noticias argentinas recientes con fuente verificable.') +
            movers + storyPanel('Noticias destacadas · Estados Unidos',global,'No se encontraron cuatro noticias recientes de EE. UU. con fuente verificable.') +
            agenda + investmentPanel + premarket.html +
            '<p style="margin:16px 0 0"><a style="display:inline-block;padding:11px 16px;background:#087747;border-radius:8px;color:white;text-decoration:none;font-weight:bold;font-size:13px" href="'+app+'/market">Ver mercados en Finix</a></p>');
        return { day, title, message, html };
    }

    private async weeklyBrief(now: Date) {
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
            timeZone:'America/Argentina/Buenos_Aires', weekday:'short', year:'numeric', month:'2-digit', day:'2-digit',
        }).formatToParts(now).map(x => [x.type,x.value]));
        const localDate = new Date(parts.year+'-'+parts.month+'-'+parts.day+'T12:00:00Z');
        const weekday = localDate.getUTCDay();
        const monday = new Date(localDate);
        monday.setUTCDate(localDate.getUTCDate() - ((weekday + 6) % 7));
        const isoDate = (d: Date) => d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');
        const weekStart = isoDate(monday);
        const weekEndDate = new Date(monday);
        weekEndDate.setUTCDate(monday.getUTCDate()+4);
        const weekEnd = isoDate(weekEndDate);
        const events = await this.prisma.marketEarningsEvent.findMany({
            where: { isPublished:true, marketCap:{not:null}, date:{gte:weekStart,lte:weekEnd}, OR:[{actualEps:{not:null}},{actualRevenue:{not:null}}] },
            select:{ticker:true,companyName:true,logoUrl:true,date:true,sourceUrl:true,source:true,actualEps:true,epsEstimate:true,epsSurprise:true,actualRevenue:true,revenueEstimate:true,revenueSurprise:true,marketReaction:true,marketCap:true},
            orderBy:[{marketCap:'desc'},{date:'desc'}],take:100,
        }).catch(()=>[]);
        const sectorFor = (ticker: string, name: string) => {
            const text = (ticker+' '+name+' '+(getCedearDefinition(ticker)?.sector || '')).toLowerCase();
            if (/bank|bancorp|bancos|finanza|financial|jpm|goldman|wells fargo|citigroup|morgan stanley|visa|mastercard/.test(text)) return 'Finanzas';
            if (/semiconductor|nvidia|amd|intel|broadcom|micron|qualcomm|chip/.test(text)) return 'Semiconductores';
            if (/energy|energ[ií]a|petr[oó]leo|halliburton|exxon|chevron|oil|gas|petroleum/.test(text)) return 'Energía';
            if (/health|pharma|eli lilly|johnson|pfizer|merck|unitedhealth/.test(text)) return 'Salud';
            if (/retail|consumo|comercio electr|automotriz|domino|general motors|walmart|costco|consumer|home depot|mcdonald/.test(text)) return 'Consumo';
            if (/industrial|industria|aerospace|fastenal|northrop|railroad|boeing|caterpillar|honeywell|union pacific/.test(text)) return 'Industria';
            if (/prologis|real estate|\breit\b|inmobili|bienes ra/i.test(text)) return 'Bienes raíces';
            if (/steel|materials|mining|miner[ií]a/.test(text)) return 'Materiales';
            if (/entertainment|entretenimiento|comunicaci|telecom|netflix|streaming|media/.test(text)) return 'Comunicaciones';
            if (/tech|tecnolog|software|microsoft|apple|amazon|alphabet|google|meta|oracle|adobe|tesla/.test(text)) return 'Tecnología';
            return '';
        };
        const chosen:any[] = [], usedSectors = new Set<string>(), usedTickers = new Set<string>();
        const unresolved = events.filter(event => !event.sourceUrl && /TradingView/i.test(event.source || '') && !getCedearDefinition(event.ticker));
        const resolvedQuotes = unresolved.length ? await this.market.getQuotes(unresolved.map(event => event.ticker)).catch(() => []) : [];
        const resolvedSymbols = new Map(resolvedQuotes.filter(quote => !quote.unavailable && typeof quote.price === 'number' && quote.price > 0)
            .map(quote => [quote.inputSymbol, quote.symbol]));
        const sourcedEvents = events.map(event => {
            if (event.sourceUrl || !/TradingView/i.test(event.source || '')) return event;
            const company = getCedearDefinition(event.ticker);
            const symbol = company?.underlyingTicker === event.ticker ? `${company.underlyingExchange}:${company.underlyingTicker}` : resolvedSymbols.get(event.ticker);
            if (!symbol || !/^(NASDAQ|NYSE|AMEX):[A-Z0-9.-]+$/i.test(symbol)) return event;
            return { ...event, sourceUrl: `https://www.tradingview.com/symbols/${symbol.replace(':', '-')}/financials-earnings/` };
        });
        for (const event of sourcedEvents) {
            const sector = sectorFor(event.ticker,event.companyName);
            const ticker = event.ticker.toUpperCase();
            let host = '';
            try { const url = new URL(event.sourceUrl || ''); if (url.protocol !== 'https:') continue; host = url.hostname; } catch { continue; }
            if (!sector || usedSectors.has(sector) || usedTickers.has(ticker) || !(trusted.test(host) || /investor|ir\./i.test(host))) continue;
            chosen.push(event); usedSectors.add(sector); usedTickers.add(ticker);
            if (chosen.length === 4) break;
        }
        if (chosen.length !== 4) {
            this.logger.warn('Informe semanal omitido: '+chosen.length+'/4 resultados publicados esta semana, con fuente y sectores distintos.');
            return null;
        }
        const number = (value:number|null, currency?:string) => value == null ? 'No informado' :
            currency ? new Intl.NumberFormat('es-AR',{style:'currency',currency,maximumFractionDigits:2}).format(value) :
            new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(value);
        const cards = chosen.map((e,index) => {
            const link = href(e.sourceUrl), sector = sectorFor(e.ticker,e.companyName);
            const metrics = [
                'EPS reportado: '+number(e.actualEps)+(e.epsEstimate != null ? ' · estimación: '+number(e.epsEstimate) : '')+(e.epsSurprise != null ? ' · sorpresa: '+number(e.epsSurprise)+'%' : ''),
                'Ingresos: '+number(e.actualRevenue,'USD')+(e.revenueEstimate != null ? ' · estimación: '+number(e.revenueEstimate,'USD') : '')+(e.revenueSurprise != null ? ' · sorpresa: '+number(e.revenueSurprise)+'%' : ''),
                'Reacción de la acción: '+(e.marketReaction == null ? 'No informada' : (e.marketReaction > 0 ? '+' : '')+number(e.marketReaction)+'%'),
                'Capitalización: '+(e.marketCap == null ? 'No informada' : number(e.marketCap,'USD')),
            ];
            return panel('INFORME '+String(index+1).padStart(2,'0')+' · '+esc(e.date)+' · '+esc(sector),
                newsletterCompanyHeading(e)+'<p style="margin:0 0 9px;color:#60766b;font-size:13px">Resultados trimestrales publicados durante la semana · compañías priorizadas por capitalización y diversificadas por sector.</p><ul style="margin:0;padding-left:18px;color:#344c41;font-size:13px">'+metrics.map(m=>'<li style="padding:3px 0">'+esc(m)+'</li>').join('')+'</ul><div style="margin-top:10px;padding:11px 13px;border-radius:9px;background:#eff8f2;color:#4f4b69;font-size:13px"><b style="color:#087747">Para el análisis:</b> contrastar ingresos, márgenes y generación de caja con el trimestre anterior; revisar valuación y perspectivas en la fuente original.</div>'+(link?'<p style="margin:12px 0 0"><a style="color:#087747;font-size:13px;font-weight:bold" href="'+link+'">'+(link.includes('tradingview.com')?'Resultados en TradingView':'Abrir fuente original')+' →</a></p>':''));
        }).join('');
        const deepDive = chosen.map(e=>'<li style="padding:4px 0">'+esc(e.companyName)+' ('+esc(e.ticker)+') · '+esc(sectorFor(e.ticker,e.companyName))+'</li>').join('');
        const day = dateKey(now), title = 'Cuatro balances de la semana para analizar';
        const message = chosen.map(e=>e.companyName+' ('+e.ticker+'), '+e.date+': EPS '+(e.actualEps ?? 's/d')+', ingresos '+(e.actualRevenue ?? 's/d')+', capitalización '+(e.marketCap ?? 's/d')+' · '+e.sourceUrl).join('\n\n');
        const html = layout('BALANCES · INFORME DE LOS VIERNES',title,day+' · Cuatro compañías de gran capitalización, de sectores distintos, que presentaron resultados esta semana.',
            cards+panel('Empresas para profundizar','<p style="margin:0 0 7px;color:#59627a;font-size:14px">Selección semanal priorizada por capitalización y diversificada por sector:</p><ul style="margin:0;padding-left:20px;color:#17332a;font-size:13px">'+deepDive+'</ul>')+
            '<p style="margin:18px 0 0;color:#777f96;font-size:12px">Los datos no publicados por la empresa o el proveedor se indican como no informados. Revisá cada fuente antes de sacar conclusiones. Este informe es informativo y no constituye una recomendación.</p><p style="margin:18px 0 0"><a style="display:inline-block;padding:12px 18px;background:#087747;border-radius:9px;color:white;text-decoration:none;font-weight:bold;font-size:14px" href="'+app+'/noticias">Seguir resultados en Finix →</a></p>');
        return {day,title,message,html,weekStart,weekEnd};
    }

    @Cron('*/10 17-21 * * *', { timeZone: 'America/Argentina/Buenos_Aires' })
    async daily() {
        if (process.env.FINIX_APPROVED_EMAILS_ENABLED !== 'true') return;
        try {
            const key = 'finix-approved:daily:' + dateKey(new Date());
            if (await this.prisma.proEmailCampaign.findUnique({ where: { sourceKey: key }, select: { id: true } })) return;
            const brief = await this.dailyBrief(new Date());
            if (!brief) { this.logger.warn('Boletín diario omitido: faltan noticias recientes.'); return; }
            await this.queue('finix-approved:daily:' + brief.day, 'DAILY', 'Finix | Cierre del mercado · ' + brief.day, brief.title, brief.message, brief.html);
        } catch { this.logger.error('No se pudo preparar el boletín diario.'); }
    }

    @Cron('*/10 17-21 * * 5', { timeZone: 'America/Argentina/Buenos_Aires' })
    async friday() {
        if (process.env.FINIX_APPROVED_EMAILS_ENABLED !== 'true') return;
        try {
            const key = 'finix-approved:weekly:' + dateKey(new Date());
            if (await this.prisma.proEmailCampaign.findUnique({ where: { sourceKey: key }, select: { id: true } })) return;
            const brief = await this.weeklyBrief(new Date());
            if (!brief) { this.logger.warn('Informe semanal omitido: no hay cuatro resultados recientes con fuente verificable.'); return; }
            await this.queue('finix-approved:weekly:' + brief.day, 'WEEKLY', 'Finix | 4 resultados · ' + brief.day, brief.title, brief.message, brief.html);
        } catch { this.logger.error('No se pudo preparar el boletín semanal.'); }
    }

    /** Sends both samples only to the requested Gmail; never creates a campaign or recipient list. */
    async sendTestBriefings(email: string) {
        const normalized = String(email || '').trim().toLowerCase();
        if (normalized !== testRecipient) throw new BadRequestException('Las pruebas solo se pueden enviar al correo de administración autorizado.');
        const now = new Date();
        const daily = await this.dailyBrief(now);
        let weekly = await this.weeklyBrief(now);
        if (!weekly) {
            // A Tuesday preview can show the last complete reporting week.
            // Scheduled Friday delivery continues to use its own current week.
            const localDay = new Date(now.getTime() - 3 * 3600000);
            const daysSinceFriday = (localDay.getUTCDay() + 2) % 7 || 7;
            const lastFriday = new Date(now.getTime() - daysSinceFriday * 86400000);
            weekly = await this.weeklyBrief(lastFriday);
        }
        if (!daily || !weekly) throw new BadRequestException('No hay suficientes noticias recientes y resultados verificables para generar las dos pruebas.');
        const previewNotice = '<p style="margin:0 0 20px;padding:12px 16px;border:1px solid #bce4ce;border-radius:10px;background:#eff8f2;color:#087747;font-size:13px;line-height:1.6"><b>VISTA PREVIA DE DISEÑO</b> · Datos disponibles al momento de preparar esta prueba. El boletín diario definitivo se genera a las 17:00, hora argentina.</p>';
        const dailyHtml = daily.html.replace(/(<td class="newsletter-content"[^>]*>)/, '$1' + previewNotice)
            .replace('AFTER MARKET · CIERRE DE MERCADO', 'AFTER MARKET · VISTA PREVIA')
            .replace('El cierre de mercado, en contexto', 'Vista previa de After Market')
            .replace('Resumen de la rueda argentina y global, después del cierre.', 'Muestra de diseño con los datos disponibles durante la rueda.')
            .replace('Cotizaciones al cierre', 'Cotizaciones disponibles')
            .replace('Cierre diario ·', 'Vista previa ·')
            .replace(' · cierre del ', ' · muestra del ');
        const results = await Promise.all([
            this.mail.sendEmail({ to: normalized, subject: '[PRUEBA] Finix | After Market · ' + daily.day, text: daily.message, html: dailyHtml.replace('{{unsubscribe_url}}', app + '/settings') }),
            this.mail.sendEmail({ to: normalized, subject: '[PRUEBA] Finix | Balances · semana ' + weekly.weekStart + ' al ' + weekly.weekEnd, text: weekly.message, html: weekly.html.replace('{{unsubscribe_url}}', app + '/settings') }),
        ]);
        return { sent: results.length === 2, recipient: normalized };
    }
}
