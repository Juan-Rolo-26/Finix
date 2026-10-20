import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EmailMarketingService } from './email-marketing.service';

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const href = (v?: string | null) => { try { const u = new URL(v || ''); return u.protocol === 'https:' ? esc(u.toString()) : ''; } catch { return ''; } };
const app = (process.env.FRONTEND_URL || 'https://finixarg.com').replace(/\/$/, '');
const dateKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const layout = (tag: string, body: string) => '<!doctype html><html lang="es"><body style="margin:0;background:#f2f6f4;font-family:Arial,sans-serif;color:#18241f"><table role="presentation" width="100%"><tr><td align="center" style="padding:20px"><table width="620" style="max-width:100%;background:#fff;border:1px solid #dce8e1;border-radius:16px"><tr><td style="background:#087f5b;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold">FINIX · ' + esc(tag) + '</td></tr><tr><td style="padding:24px;line-height:1.55">' + body + '<hr><p style="font-size:11px;color:#718079">Información educativa; no es recomendación personalizada. <a href="' + app + '/settings">Preferencias</a> · <a href="{{unsubscribe_url}}">Cancelar suscripción</a></p></td></tr></table></td></tr></table></body></html>';
const companies = /apple|microsoft|nvidia|amazon|alphabet|google|meta platforms|tesla|broadcom|netflix|jpmorgan|citigroup|wells fargo|goldman sachs|bank of america|morgan stanley|blackrock|eli lilly|exxon|chevron|walmart|costco|oracle|adobe|amd|qualcomm|micron|intel|visa|mastercard/i;
const earnings = /quarter|earnings|results|balance|revenue|ingresos|trimestre|resultado|ganancias|cash flow|margins/i;
const trusted = /(^|\.)sec\.gov$|(^|\.)nasdaq\.com$|(^|\.)nyse\.com$|(^|\.)reuters\.com$|(^|\.)apnews\.com$|(^|\.)bloomberg\.com$/i;

@Injectable()
export class NewsletterScheduler {
    private readonly logger = new Logger(NewsletterScheduler.name);
    constructor(private readonly prisma: PrismaService, private readonly campaigns: EmailMarketingService) {}

    private async ownerId() {
        const email = process.env.ADMIN_OWNER_EMAIL?.trim();
        const user = email
            ? await this.prisma.user.findFirst({ where: { email, role: 'ADMIN' }, select: { id: true } })
            : await this.prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
        return user?.id || null;
    }

    private async queue(key: string, audience: 'DAILY' | 'WEEKLY', subject: string, title: string, message: string, contentHtml: string) {
        if (process.env.FINIX_APPROVED_EMAILS_ENABLED !== 'true') return;
        const createdById = await this.ownerId();
        if (!createdById) return;
        await this.campaigns.createApprovedCampaign({ sourceKey: key, audience, subject, title, message, contentHtml, createdById });
    }

    @Cron('15 10 * * 1-5', { timeZone: 'America/Argentina/Buenos_Aires' })
    async daily() {
        if (process.env.FINIX_APPROVED_EMAILS_ENABLED !== 'true') return;
        try {
            const now = new Date();
            const articles = await this.prisma.newsArticle.findMany({
                where: { isActive: true, isPublished: true, status: 'PUBLISHED', publishedAt: { gte: new Date(now.getTime() - 36 * 3600000) } },
                select: { title: true, titleEs: true, description: true, descriptionEs: true, sourceName: true, sourceUrl: true, url: true },
                orderBy: [{ relevanceScore: 'desc' }, { publishedAt: 'desc' }], take: 3,
            });
            if (!articles.length) { this.logger.warn('Boletín diario omitido: faltan noticias recientes.'); return; }
            const cards = articles.map(a => {
                const t = esc(a.titleEs || a.title), d = esc((a.descriptionEs || a.description || '').slice(0, 420));
                const u = href(a.sourceUrl || a.url);
                return '<article style="padding:14px 0;border-top:1px solid #e6ece8"><h2 style="font-size:16px">' + (u ? '<a href="' + u + '">' + t + '</a>' : t) + '</h2><p>' + d + '</p><small>' + esc(a.sourceName || 'Fuente') + (u ? ' · <a href="' + u + '">Leer fuente →</a>' : '') + '</small></article>';
            }).join('');
            const day = dateKey(now), title = 'Lo que mueve al mercado hoy';
            const message = articles.map(a => (a.titleEs || a.title) + ': ' + (a.descriptionEs || a.description || '')).join('\\n\\n');
            const html = layout('MERCADO · ' + day, '<p>' + day + '</p><h1>' + title + '</h1><p>Tres noticias recientes, con sus fuentes.</p>' + cards + '<p><a href="' + app + '/noticias">Seguir el mercado en Finix →</a></p>');
            await this.queue('finix-approved:daily:' + day, 'DAILY', 'Finix | Apertura de mercado · ' + day, title, message, html);
        } catch { this.logger.error('No se pudo preparar el boletín diario.'); }
    }

    @Cron('30 17 * * 5', { timeZone: 'America/Argentina/Buenos_Aires' })
    async friday() {
        if (process.env.FINIX_APPROVED_EMAILS_ENABLED !== 'true') return;
        try {
            const now = new Date();
            const articles = await this.prisma.newsArticle.findMany({
                where: { isActive: true, isPublished: true, status: 'PUBLISHED', publishedAt: { gte: new Date(now.getTime() - 8 * 86400000) } },
                select: { title: true, titleEs: true, description: true, descriptionEs: true, sourceName: true, sourceUrl: true, url: true, publishedAt: true },
                orderBy: [{ relevanceScore: 'desc' }, { publishedAt: 'desc' }], take: 200,
            });
            const reports = articles.filter(a => {
                const title = a.titleEs || a.title;
                let host = ''; try { host = new URL(a.sourceUrl || a.url).hostname; } catch { return false; }
                return companies.test(title) && earnings.test(title + ' ' + (a.descriptionEs || a.description || '')) && (trusted.test(host) || /investor|ir\\./i.test(host));
            }).slice(0, 4);
            if (reports.length !== 4) { this.logger.warn('Informe semanal omitido: no hay cuatro resultados recientes con fuente verificable.'); return; }
            const cards = reports.map(a => {
                const t = esc(a.titleEs || a.title), d = esc((a.descriptionEs || a.description || '').slice(0, 520));
                const u = href(a.sourceUrl || a.url), date = a.publishedAt ? new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: 'short' }).format(a.publishedAt) : '';
                return '<article style="padding:13px 0;border-top:1px solid #e6ece8"><small>' + date + ' · ' + esc(a.sourceName || 'Fuente') + '</small><h2 style="font-size:16px">' + (u ? '<a href="' + u + '">' + t + '</a>' : t) + '</h2><p>' + d + '</p><a href="' + u + '">Abrir informe →</a></article>';
            }).join('');
            const day = dateKey(now), title = 'Cuatro informes para seguir esta semana';
            const message = reports.map(a => (a.titleEs || a.title) + ': ' + (a.descriptionEs || a.description || '')).join('\\n\\n');
            const html = layout('FINIX PRO · VIERNES · ' + day, '<h1>' + title + '</h1><p>Se resumen solo los datos presentes en cada fuente: ingresos, rentabilidad, caja, valuación y perspectiva. Las métricas no publicadas se omiten.</p>' + cards + '<p><b>Para profundizar:</b> comparar crecimiento, calidad de márgenes y flujo de caja con la valuación y la guía de cada empresa. En bancos, usar ROE/ROTCE, capital y calidad crediticia.</p>');
            await this.queue('finix-approved:weekly:' + day, 'WEEKLY', 'Finix Pro | 4 informes · ' + day, title, message, html);
        } catch { this.logger.error('No se pudo preparar el boletín semanal.'); }
    }
}
