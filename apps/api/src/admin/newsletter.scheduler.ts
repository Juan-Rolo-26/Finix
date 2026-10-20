import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EmailMarketingService } from './email-marketing.service';
import { MailService } from '../mail/mail.service';

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const href = (v?: string | null) => { try { const u = new URL(v || ''); return u.protocol === 'https:' ? esc(u.toString()) : ''; } catch { return ''; } };
const app = (process.env.FRONTEND_URL || 'https://finixarg.com').replace(/\/$/, '');
const dateKey = (d: Date) => new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: 'long', year: 'numeric' }).format(d);
const shortDate = (d?: Date | null) => d ? new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: 'short' }).format(d) : '';
const layout = (tag: string, title: string, subtitle: string, body: string) => '<!doctype html><html lang="es"><body style="margin:0;background:#f3f5fb;font-family:Arial,Helvetica,sans-serif;color:#18213b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f5fb"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="680" cellspacing="0" cellpadding="0" style="width:100%;max-width:680px;background:#fff;border:1px solid #e5e8f1;border-radius:18px;overflow:hidden"><tr><td style="background:#21105f;padding:22px 28px;color:#fff"><div style="font-size:13px;letter-spacing:2px;font-weight:bold;color:#b8a8ff">FINIX <span style="color:#32ddb0">●</span> ' + esc(tag) + '</div><h1 style="font-size:28px;line-height:1.2;margin:20px 0 7px;color:#fff">' + esc(title) + '</h1><p style="margin:0;color:#d9d5f1;font-size:14px;line-height:1.5">' + esc(subtitle) + '</p></td></tr><tr><td style="padding:22px 28px 28px;line-height:1.6">' + body + '<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e9eaf1;color:#788098;font-size:11px;line-height:1.6">Finix · Información de mercado para acompañar tu análisis. No constituye una recomendación personalizada.<br><a style="color:#177c61" href="' + app + '/settings">Preferencias de correo</a> · <a style="color:#177c61" href="{{unsubscribe_url}}">Cancelar suscripción</a></div></td></tr></table></td></tr></table></body></html>';
const panel = (label: string, body: string) => '<section style="margin:0 0 16px;padding:18px 20px;border:1px solid #e8eaf2;border-radius:14px;background:#fff"><div style="font-size:12px;letter-spacing:1.3px;text-transform:uppercase;color:#6847f5;font-weight:bold;margin-bottom:10px">' + esc(label) + '</div>' + body + '</section>';
const companies = /apple|microsoft|nvidia|amazon|alphabet|google|meta platforms|tesla|broadcom|netflix|jpmorgan|citigroup|wells fargo|goldman sachs|bank of america|morgan stanley|blackrock|eli lilly|exxon|chevron|walmart|costco|oracle|adobe|amd|qualcomm|micron|intel|visa|mastercard/i;
const earnings = /quarter|earnings|results|balance|revenue|ingresos|trimestre|resultado|ganancias|cash flow|margins/i;
const trusted = /(^|\.)sec\.gov$|(^|\.)nasdaq\.com$|(^|\.)nyse\.com$|(^|\.)reuters\.com$|(^|\.)apnews\.com$|(^|\.)bloomberg\.com$/i;
const testRecipient = 'juanpablorolo2007@gmail.com';

@Injectable()
export class NewsletterScheduler {
    private readonly logger = new Logger(NewsletterScheduler.name);
    constructor(private readonly prisma: PrismaService, private readonly campaigns: EmailMarketingService, private readonly mail: MailService) {}

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
        const articles = await this.prisma.newsArticle.findMany({
            where: { isActive: true, isPublished: true, status: 'PUBLISHED', publishedAt: { gte: new Date(now.getTime() - 60 * 3600000) } },
            select: { title: true, titleEs: true, description: true, descriptionEs: true, sourceName: true, sourceUrl: true, url: true },
            orderBy: [{ relevanceScore: 'desc' }, { publishedAt: 'desc' }], take: 5,
        });
        if (!articles.length) return null;
        const stories = articles.map((a, i) => {
            const title = a.titleEs || a.title, description = (a.descriptionEs || a.description || '').trim(), link = href(a.sourceUrl || a.url);
            return '<tr><td style="padding:15px 0;border-top:1px solid #ececf3"><div style="font-size:11px;color:#7557f6;font-weight:bold;letter-spacing:1px">CLAVE ' + (i + 1) + '</div><h2 style="font-size:17px;line-height:1.35;margin:5px 0 7px;color:#18213b">' + (link ? '<a style="color:#18213b;text-decoration:none" href="' + link + '">' + esc(title) + '</a>' : esc(title)) + '</h2><p style="margin:0;color:#59627a;font-size:14px;line-height:1.55">' + esc(description || 'Abrí la fuente para consultar el detalle publicado.') + '</p><div style="margin-top:8px;font-size:12px;color:#858ba0">' + esc(a.sourceName || 'Fuente') + (link ? ' · <a style="color:#6847f5" href="' + link + '">Leer fuente →</a>' : '') + '</div></td></tr>';
        }).join('');
        const day = dateKey(now), title = 'Lo que mueve al mercado hoy';
        const message = articles.map(a => (a.titleEs || a.title) + ': ' + (a.descriptionEs || a.description || '') + ' (' + (a.sourceUrl || a.url) + ')').join('\n\n');
        const html = layout('MERCADO DE HOY', title, day + ' · Una lectura breve para empezar el día con contexto.',
            panel('El mapa de hoy', '<p style="margin:0;color:#59627a;font-size:14px">Cinco claves recientes seleccionadas por relevancia, con enlace a cada fuente.</p>') +
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0">' + stories + '</table><p style="margin:20px 0 0"><a style="display:inline-block;padding:12px 18px;background:#5d35e8;border-radius:9px;color:white;text-decoration:none;font-weight:bold;font-size:14px" href="' + app + '/noticias">Ver mercado en Finix&nbsp; →</a></p>');
        return { day, title, message, html };
    }

    private async weeklyBrief(now: Date) {
        const articles = await this.prisma.newsArticle.findMany({
            where: { isActive: true, isPublished: true, status: 'PUBLISHED', publishedAt: { gte: new Date(now.getTime() - 8 * 86400000) } },
            select: { title: true, titleEs: true, description: true, descriptionEs: true, sourceName: true, sourceUrl: true, url: true, publishedAt: true },
            orderBy: [{ relevanceScore: 'desc' }, { publishedAt: 'desc' }], take: 200,
        });
        const reports = articles.filter(a => {
            let host = ''; try { host = new URL(a.sourceUrl || a.url).hostname; } catch { return false; }
            const text = (a.titleEs || a.title) + ' ' + (a.descriptionEs || a.description || '');
            return companies.test(a.titleEs || a.title) && earnings.test(text) && (trusted.test(host) || /investor|ir\./i.test(host));
        }).slice(0, 4);
        if (reports.length !== 4) return null;
        const cards = reports.map((a, index) => {
            const title = a.titleEs || a.title, description = (a.descriptionEs || a.description || '').trim(), link = href(a.sourceUrl || a.url);
            return panel('INFORME ' + String(index + 1).padStart(2, '0') + ' · ' + esc(shortDate(a.publishedAt)) + ' · ' + esc(a.sourceName || 'Fuente'),
                '<h2 style="margin:0 0 8px;font-size:18px;line-height:1.35;color:#18213b">' + (link ? '<a style="color:#18213b;text-decoration:none" href="' + link + '">' + esc(title) + '</a>' : esc(title)) + '</h2><p style="margin:0 0 12px;color:#59627a;font-size:14px;line-height:1.6">' + esc(description || 'La publicación original contiene el detalle del trimestre.') + '</p><div style="padding:11px 13px;border-radius:9px;background:#f6f4ff;color:#4f4b69;font-size:13px"><b style="color:#5437cb">Para el análisis:</b> contrastar ingresos y márgenes, generación de caja, valuación y perspectivas; tomar como dato solo lo informado por la compañía o la fuente.</div>' + (link ? '<p style="margin:12px 0 0"><a style="color:#6847f5;font-size:13px;font-weight:bold" href="' + link + '">Abrir fuente original&nbsp; →</a></p>' : ''));
        }).join('');
        const day = dateKey(now), title = 'Cuatro balances y resultados para mirar';
        const message = reports.map(a => (a.titleEs || a.title) + ': ' + (a.descriptionEs || a.description || '') + ' (' + (a.sourceUrl || a.url) + ')').join('\n\n');
        const deepDive = reports.map(a => '<li style="padding:4px 0">' + esc(a.titleEs || a.title) + '</li>').join('');
        const html = layout('FINIX PRO · INFORME DE LOS VIERNES', title, day + ' · Resultados recientes de empresas grandes, con fuentes para seguir leyendo.',
            cards + panel('Empresas para profundizar', '<p style="margin:0 0 7px;color:#59627a;font-size:14px">Ideas para una revisión fundamental más completa:</p><ul style="margin:0;padding-left:20px;color:#18213b;font-size:13px">' + deepDive + '</ul>') +
            '<p style="margin:18px 0 0;color:#777f96;font-size:12px">Se priorizan compañías de gran capitalización y fuentes verificables. Consultá en el informe original las métricas que una noticia no publique.</p><p style="margin:18px 0 0"><a style="display:inline-block;padding:12px 18px;background:#5d35e8;border-radius:9px;color:white;text-decoration:none;font-weight:bold;font-size:14px" href="' + app + '/noticias">Seguir resultados en Finix&nbsp; →</a></p>');
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