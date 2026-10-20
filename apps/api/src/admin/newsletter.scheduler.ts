import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EmailMarketingService } from './email-marketing.service';
import { MailService } from '../mail/mail.service';
import { MarketService } from '../market/market.service';

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const href = (v?: string | null) => { try { const u = new URL(v || ''); return u.protocol === 'https:' ? esc(u.toString()) : ''; } catch { return ''; } };
const app = (process.env.FRONTEND_URL || 'https://finixarg.com').replace(/\/$/, '');
const dateKey = (d: Date) => new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: 'long', year: 'numeric' }).format(d);
const shortDate = (d?: Date | null) => d ? new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: 'short' }).format(d) : '';
const layout = (tag: string, title: string, subtitle: string, body: string) => '<!doctype html><html lang="es"><body style="margin:0;background:#f2f7f4;font-family:Arial,Helvetica,sans-serif;color:#17332a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f7f4"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="760" cellspacing="0" cellpadding="0" style="width:100%;max-width:760px;background:#fff;border:1px solid #e5e8f1;border-radius:18px;overflow:hidden"><tr><td style="background:#087747;padding:22px 28px;color:#fff"><div style="font-size:13px;letter-spacing:2px;font-weight:bold;color:#d3f5e2">FINIX <span style="color:#54e0a5">●</span> ' + esc(tag) + '</div><h1 style="font-size:28px;line-height:1.2;margin:20px 0 7px;color:#fff">' + esc(title) + '</h1><p style="margin:0;color:#e1f4e9;font-size:14px;line-height:1.5">' + esc(subtitle) + '</p></td></tr><tr><td style="padding:22px 28px 28px;line-height:1.6">' + body + '<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e9eaf1;color:#788098;font-size:11px;line-height:1.6">Finix · Información de mercado para acompañar tu análisis. No constituye una recomendación personalizada.<br><a style="color:#087747" href="' + app + '/settings">Preferencias de correo</a> · <a style="color:#087747" href="{{unsubscribe_url}}">Cancelar suscripción</a></div></td></tr></table></td></tr></table></body></html>';
const panel = (label: string, body: string) => '<section style="margin:0 0 16px;padding:18px 20px;border:1px solid #e8eaf2;border-radius:14px;background:#fff"><div style="font-size:12px;letter-spacing:1.3px;text-transform:uppercase;color:#087747;font-weight:bold;margin-bottom:10px">' + esc(label) + '</div>' + body + '</section>';
const companies = /apple|microsoft|nvidia|amazon|alphabet|google|meta platforms|tesla|broadcom|netflix|jpmorgan|citigroup|wells fargo|goldman sachs|bank of america|morgan stanley|blackrock|eli lilly|exxon|chevron|walmart|costco|oracle|adobe|amd|qualcomm|micron|intel|visa|mastercard/i;
const earnings = /quarter|earnings|results|balance|revenue|ingresos|trimestre|resultado|ganancias|cash flow|margins/i;
const trusted = /(^|\.)sec\.gov$|(^|\.)nasdaq\.com$|(^|\.)nyse\.com$|(^|\.)reuters\.com$|(^|\.)apnews\.com$|(^|\.)bloomberg\.com$/i;
const testRecipient = 'juanpablorolo2007@gmail.com';

@Injectable()
export class NewsletterScheduler {
    private readonly logger = new Logger(NewsletterScheduler.name);
    constructor(private readonly prisma: PrismaService, private readonly campaigns: EmailMarketingService, private readonly mail: MailService, private readonly market: MarketService) {}

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
        const since = new Date(now.getTime() - 72 * 3600000);
        const [articles, marketData, macroEvents, earnings] = await Promise.all([
            this.prisma.newsArticle.findMany({
                where: { isActive: true, isPublished: true, status: 'PUBLISHED', publishedAt: { gte: since } },
                select: { title: true, titleEs: true, description: true, descriptionEs: true, sourceName: true, sourceUrl: true, url: true, publishedAt: true, category: { select: { name: true, slug: true } } },
                orderBy: [{ relevanceScore: 'desc' }, { publishedAt: 'desc' }], take: 30,
            }),
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
        ]);
        if (!articles.length && !marketData) return null;

        const content = (a: typeof articles[number]) => (a.titleEs || a.title) + ' ' + (a.descriptionEs || a.description || '') + ' ' + (a.category?.name || '') + ' ' + (a.category?.slug || '');
        const macroRx = /macroeconom[ií]a|econom[ií]a|inflaci[oó]n|ipc|indec|bcra|pib|reservas|d[oó]lar|fiscal|actividad|construcci[oó]n|comercio/i;
        const argentinaMacroRx = /argentina|argentin[oa]|bcra|indec|merval|ipc|peso(s)? argentino(s)?|buenos aires|econom[ií]a local/i;
        const localRx = /mercado local|argentina|merval|byma|acciones argentinas|renta variable|ypf|galicia|ggal|pampa|cresud|tgs|alua|txar|bono|obligaci[oó]n negociable|lecap/i;
        const worldRx = /wall street|s&p|nasdaq|federal reserve|fed\b|treasury|global|internacional|china|europe|petr[oó]leo|gold|oro|bitcoin|mercados/i;
        const recent = [...articles].sort((a,b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));
        const macro = recent.filter(a => macroRx.test(content(a)) && argentinaMacroRx.test(content(a))).slice(0,3);
        const local = recent.filter(a => localRx.test(content(a)) && !macro.includes(a)).slice(0,3);
        const global = recent.filter(a => worldRx.test(content(a)) && !macro.includes(a) && !local.includes(a)).slice(0,3);
        const used = new Set([...macro,...local,...global]);
        const investment = recent.filter(a => /bono|obligaci[oó]n negociable|deuda|emisi[oó]n|dividendo|balance|resultados|earnings/i.test(content(a)) && !used.has(a)).slice(0,1);

        const storyRows = (items: typeof articles, empty: string) => items.length
            ? items.map(a => {
                const title = a.titleEs || a.title, desc = (a.descriptionEs || a.description || '').trim(), link = href(a.url || a.sourceUrl);
                return '<tr><td style="padding:9px 0;border-top:1px solid #e5eee8"><div style="font-size:13px;line-height:1.4;font-weight:bold;color:#203b30">' + (link ? '<a style="color:#203b30;text-decoration:none" href="' + link + '">' + esc(title) + '</a>' : esc(title)) + '</div><p style="margin:4px 0 0;color:#60766b;font-size:12px;line-height:1.45">' + esc(desc || 'Abrí la publicación para consultar los detalles.') + '</p><div style="margin-top:4px;font-size:11px;color:#84968d">' + esc(a.sourceName || 'Fuente') + (a.publishedAt ? ' · ' + esc(shortDate(a.publishedAt)) : '') + (link ? ' · <a style="color:#087747" href="' + link + '">Fuente original</a>' : '') + '</div></td></tr>';
            }).join('')
            : '<tr><td style="padding:8px 0;color:#71857a;font-size:12px">' + esc(empty) + '</td></tr>';
        const storyPanel = (label: string, items: typeof articles, empty: string) =>
            panel(label, '<table role="presentation" width="100%" cellspacing="0" cellpadding="0">' + storyRows(items, empty) + '</table>');

        const fmt = (value: unknown, currency?: string) => typeof value !== 'number' || !Number.isFinite(value) ? '—' :
            currency ? new Intl.NumberFormat('es-AR', { style:'currency', currency, maximumFractionDigits: currency === 'ARS' ? 0 : 2 }).format(value) :
            new Intl.NumberFormat('es-AR', { maximumFractionDigits:2 }).format(value);
        const quoteRows = (items: any[], limit: number) => (Array.isArray(items) ? items : []).filter(a => typeof a.price === 'number' && Number.isFinite(a.price)).slice(0,limit).map(a =>
            '<tr><td style="padding:6px 0;border-top:1px solid #e5eee8;color:#344c41;font-size:11px">' + esc(a.label || a.symbol || 'Activo') + '</td><td align="right" style="padding:6px 0;border-top:1px solid #e5eee8;color:#344c41;font-size:11px;font-weight:bold">' + esc(fmt(a.price,a.currency)) + '</td><td align="right" style="padding:6px 0 6px 7px;border-top:1px solid #e5eee8;color:' + (typeof a.change === 'number' && a.change < 0 ? '#bd4545' : '#087747') + ';font-size:11px;font-weight:bold">' + (typeof a.change === 'number' ? (a.change > 0 ? '+' : '') + fmt(a.change) + '%' : '—') + '</td></tr>'
        ).join('');
        const quoteBox = (title: string, items: any[], limit: number) => {
            const rows = quoteRows(items,limit); if (!rows) return '';
            return '<td style="width:50%;vertical-align:top;padding:5px"><div style="padding:10px 12px;border:1px solid #e0ece5;border-radius:10px;background:#fbfdfb"><div style="font-size:12px;color:#087747;font-weight:bold;margin-bottom:5px">' + esc(title) + '</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0">' + rows + '</table></div></td>';
        };
        const quotes = marketData?.sections ? '<div style="margin:0 0 15px"><div style="font-size:12px;color:#087747;font-weight:bold;margin:0 5px 5px">Mercados de referencia · ' + esc(dateKey(now)) + '</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>' + quoteBox('Argentina · S&P Merval y acciones',marketData.sections.argentina,6) + quoteBox('Estados Unidos y mundo',marketData.sections.global,5) + '</tr><tr>' + quoteBox('Materias primas',marketData.sections.commodities,4) + quoteBox('Cripto',marketData.sections.crypto,3) + '</tr></table><p style="font-size:10px;color:#7b8d83;margin:6px 5px 0">Cotizaciones indicativas según disponibilidad de cada fuente. <a style="color:#087747" href="' + app + '/market">Ver mercados en Finix</a></p></div>' : '';

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
        const title = 'La apertura de mercado, en contexto', day = dateKey(now);
        const mood = marketData?.pulse ? '<p style="margin:0 0 8px;color:#415c4e;font-size:13px"><b>'+esc(marketData.pulse.label)+':</b> '+esc(marketData.pulse.summary)+'</p>' : '';
        const message = articles.slice(0,12).map(a => (a.titleEs || a.title)+': '+(a.descriptionEs || a.description || '')+' ('+(a.url || a.sourceUrl)+')').join('\n\n') + '\n\nAgenda: ' + agendaItems.map(e=>e.title+' · '+e.date+' '+(e.url || '')).join('\n');
        const html = layout('APERTURA DE MERCADO',title,day+' · Argentina y mercados globales, con datos y fuentes.',
            panel('El pulso de la rueda',mood+'<p style="margin:0;color:#60766b;font-size:12px">Noticias recientes seleccionadas de publicaciones disponibles en Finix.</p>') +
            storyPanel('Macroeconomía argentina',macro,'Sin novedades macroeconómicas recientes; consultá el calendario.') +
            movers + storyPanel('Mercado local · renta variable',local,'Sin novedades locales destacadas en publicaciones recientes.') +
            storyPanel('Resumen del mercado internacional',global,'Sin novedades globales destacadas en publicaciones recientes.') +
            quotes + agenda + investmentPanel +
            '<p style="margin:16px 0 0"><a style="display:inline-block;padding:11px 16px;background:#087747;border-radius:8px;color:white;text-decoration:none;font-weight:bold;font-size:13px" href="'+app+'/market">Ver mercados en Finix</a></p>');
        return { day, title, message, html };
    }

    private async weeklyBrief(now: Date) {
        const articles = await this.prisma.newsArticle.findMany({
            where: { isActive: true, isPublished: true, status: 'PUBLISHED', publishedAt: { gte: new Date(now.getTime() - 8 * 86400000) } },
            select: { title: true, titleEs: true, description: true, descriptionEs: true, sourceName: true, sourceUrl: true, url: true, publishedAt: true },
            orderBy: [{ publishedAt: 'desc' }, { relevanceScore: 'desc' }], take: 1000,
        });
        const eligible = articles.filter(a => {
            let host = ''; try { host = new URL(a.url || a.sourceUrl).hostname; } catch { return false; }
            const title = a.titleEs || a.title;
            const summary = title + ' ' + (a.descriptionEs || a.description || '');
            const trustedSource = trusted.test(host) || /investor|ir\./i.test(host);
            const companyReport = companies.test(title) && earnings.test(summary);
            const marketEarningsAnalysis = /\b(stocks?|shares?)\b/i.test(title) && earnings.test(title);
            return trustedSource && (companyReport || marketEarningsAnalysis);
        });
        const companyReports = eligible.filter(a => companies.test(a.titleEs || a.title) && earnings.test((a.titleEs || a.title) + ' ' + (a.descriptionEs || a.description || '')));
        const reports = [...companyReports, ...eligible.filter(a => !companyReports.includes(a))].slice(0, 4);
        if (reports.length !== 4) return null;
        const cards = reports.map((a, index) => {
            const title = a.titleEs || a.title, description = (a.descriptionEs || a.description || '').trim(), link = href(a.url || a.sourceUrl);
            return panel('INFORME ' + String(index + 1).padStart(2, '0') + ' · ' + esc(shortDate(a.publishedAt)) + ' · ' + esc(a.sourceName || 'Fuente'),
                '<h2 style="margin:0 0 8px;font-size:18px;line-height:1.35;color:#17332a">' + (link ? '<a style="color:#17332a;text-decoration:none" href="' + link + '">' + esc(title) + '</a>' : esc(title)) + '</h2><p style="margin:0 0 12px;color:#59627a;font-size:14px;line-height:1.6">' + esc(description || 'La publicación original contiene el detalle del trimestre.') + '</p><div style="padding:11px 13px;border-radius:9px;background:#eff8f2;color:#4f4b69;font-size:13px"><b style="color:#087747">Para el análisis:</b> contrastar ingresos y márgenes, generación de caja, valuación y perspectivas; tomar como dato solo lo informado por la compañía o la fuente.</div>' + (link ? '<p style="margin:12px 0 0"><a style="color:#087747;font-size:13px;font-weight:bold" href="' + link + '">Abrir fuente original&nbsp; →</a></p>' : ''));
        }).join('');
        const day = dateKey(now), title = 'Cuatro balances y resultados para mirar';
        const message = reports.map(a => (a.titleEs || a.title) + ': ' + (a.descriptionEs || a.description || '') + ' (' + (a.url || a.sourceUrl) + ')').join('\n\n');
        const deepDive = reports.map(a => '<li style="padding:4px 0">' + esc(a.titleEs || a.title) + '</li>').join('');
        const html = layout('FINIX PRO · INFORME DE LOS VIERNES', title, day + ' · Resultados recientes de empresas grandes, con fuentes para seguir leyendo.',
            cards + panel('Empresas para profundizar', '<p style="margin:0 0 7px;color:#59627a;font-size:14px">Ideas para una revisión fundamental más completa:</p><ul style="margin:0;padding-left:20px;color:#17332a;font-size:13px">' + deepDive + '</ul>') +
            '<p style="margin:18px 0 0;color:#777f96;font-size:12px">Se priorizan compañías de gran capitalización y fuentes verificables. Consultá en el informe original las métricas que una noticia no publique.</p><p style="margin:18px 0 0"><a style="display:inline-block;padding:12px 18px;background:#087747;border-radius:9px;color:white;text-decoration:none;font-weight:bold;font-size:14px" href="' + app + '/noticias">Seguir resultados en Finix&nbsp; →</a></p>');
        return { day, title, message, html };
    }

    @Cron('15 10 * * *', { timeZone: 'America/Argentina/Buenos_Aires' })
    async daily() {
        if (process.env.FINIX_APPROVED_EMAILS_ENABLED !== 'true') return;
        try {
            const brief = await this.dailyBrief(new Date());
            if (!brief) { this.logger.warn('Boletín diario omitido: faltan noticias recientes.'); return; }
            await this.queue('finix-approved:daily:' + brief.day, 'DAILY', 'Finix | Mercado de hoy · ' + brief.day, brief.title, brief.message, brief.html);
        } catch { this.logger.error('No se pudo preparar el boletín diario.'); }
    }

    @Cron('30 17 * * 5', { timeZone: 'America/Argentina/Buenos_Aires' })
    async friday() {
        if (process.env.FINIX_APPROVED_EMAILS_ENABLED !== 'true') return;
        try {
            const brief = await this.weeklyBrief(new Date());
            if (!brief) { this.logger.warn('Informe semanal omitido: no hay cuatro resultados recientes con fuente verificable.'); return; }
            await this.queue('finix-approved:weekly:' + brief.day, 'WEEKLY', 'Finix Pro | 4 resultados · ' + brief.day, brief.title, brief.message, brief.html);
        } catch { this.logger.error('No se pudo preparar el boletín semanal.'); }
    }

    /** Sends both samples only to the requested Gmail; never creates a campaign or recipient list. */
    async sendTestBriefings(email: string) {
        const normalized = String(email || '').trim().toLowerCase();
        if (normalized !== testRecipient) throw new BadRequestException('Las pruebas solo se pueden enviar al correo de administración autorizado.');
        const [daily, weekly] = await Promise.all([this.dailyBrief(new Date()), this.weeklyBrief(new Date())]);
        if (!daily || !weekly) throw new BadRequestException('No hay suficientes noticias recientes y resultados verificables para generar las dos pruebas.');
        const results = await Promise.all([
            this.mail.sendEmail({ to: normalized, subject: '[PRUEBA] Finix | Mercado de hoy · ' + daily.day, text: daily.message, html: daily.html.replace('{{unsubscribe_url}}', app + '/settings') }),
            this.mail.sendEmail({ to: normalized, subject: '[PRUEBA] Finix Pro | 4 resultados · ' + weekly.day, text: weekly.message, html: weekly.html.replace('{{unsubscribe_url}}', app + '/settings') }),
        ]);
        return { sent: results.length === 2, recipient: normalized };
    }
}