import { isCurrentDailyCampaign } from './newsletter-day';
import { isOfficialPublisher } from '../posts/publication-email';
import { BadRequestException, Injectable, Logger, Optional } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { createHmac, timingSafeEqual, randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import sharp = require('sharp');
import { z } from 'zod';
import { PrismaService } from '../prisma.service';
import { ResendQuotaService } from '../mail/resend-quota.service';
import { MailService } from '../mail/mail.service';
import { escapeEmail, renderCampaign } from './email-content';

const url = z.string().max(2048).url().refine(v => new URL(v).protocol === 'https:' || (process.env.NODE_ENV !== 'production' && new URL(v).protocol === 'http:')).or(z.literal('')).optional();
const schema = z.object({ subject: z.string().trim().min(1).max(160), title: z.string().trim().min(1).max(160), message: z.string().trim().min(1).max(10000), imageUrl: url, chartUrl: url, ctaUrl: url, ctaLabel: z.string().max(80).optional(), audience: z.enum(['PRO', 'ALL']).default('PRO'), analysisId: z.string().uuid().or(z.literal('')).optional(), scheduledAt: z.string().datetime().optional(), previewText: z.string().max(250).optional() });

@Injectable()
export class EmailMarketingService {
    private dailyBriefRenderer?: (now: Date) => Promise<{ html: string; message: string; day: string }>;
    setDailyBriefRenderer(renderer: (now: Date) => Promise<{ html: string; message: string; day: string }>) {
        this.dailyBriefRenderer = renderer;
    }
    private busy = false;
    private readonly logger = new Logger(EmailMarketingService.name);
    constructor(private readonly prisma: PrismaService, private readonly mail: MailService, @Optional() private readonly quota?: ResendQuotaService) {}
    private recipientWhere(audience = 'PRO') {
        const notTest = { NOT: { email: { endsWith: '@example.test' } } };
        if (audience === 'OFFICIAL') return {
            status: 'ACTIVE', emailVerified: true, ...notTest,
            OR: [{ emailPreferences: { is: null } }, { emailPreferences: { is: { marketing: true, product: true } } }],
        };
        if (audience === 'DAILY' || audience === 'WEEKLY') {
            const preference = audience === 'DAILY' ? { daily: true } : { weekly: true };
            return {
                status: 'ACTIVE', emailVerified: true, ...notTest,
                OR: [{ emailPreferences: { is: null } }, { emailPreferences: { is: { ...preference, marketing: true } } }],
            };
        }
        const base = {
            status: 'ACTIVE',
            emailVerified: true,
            ...notTest,
            OR: [{ emailPreferences: { is: null } }, { emailPreferences: { is: { marketing: true, analysis: true } } }],
        };
        return audience === 'ALL' ? base : { ...base, plan: 'PRO', subscriptionStatus: 'ACTIVE' };
    }
    async dashboard() {
        const [campaigns, recipientCount, allCount, dailyCount, weeklyCount, sent, delivered, failed, skipped, activeAlerts, triggeredAlerts, totalCampaigns] = await Promise.all([
            this.prisma.proEmailCampaign.findMany({ take: 100, orderBy: { createdAt: 'desc' } }),
            this.prisma.user.count({ where: this.recipientWhere('PRO') }),
            this.prisma.user.count({ where: this.recipientWhere('ALL') }),
            this.prisma.user.count({ where: this.recipientWhere('DAILY') }),
            this.prisma.user.count({ where: this.recipientWhere('WEEKLY') }),
            this.prisma.emailCampaignRecipient.count({ where: { status: { in: ['SENT', 'BOUNCED'] } } }),
            this.prisma.emailCampaignRecipient.count({ where: { deliveredAt: { not: null } } }),
            this.prisma.emailCampaignRecipient.count({ where: { status: { in: ['FAILED', 'BOUNCED'] } } }),
            this.prisma.emailCampaignRecipient.count({ where: { status: 'SKIPPED' } }),
            this.prisma.marketAlert.count({ where: { status: 'ACTIVE' } }),
            this.prisma.marketAlert.count({ where: { status: 'TRIGGERED' } }),
            this.prisma.proEmailCampaign.count(),
        ]);
        return {
            metrics: { recipientCount, allCount, dailyCount, weeklyCount, sent, delivered, failed, skipped, activeAlerts, triggeredAlerts, totalCampaigns },
            campaigns,
            sendEnabled: process.env.EMAIL_SEND_ENABLED === 'true' || process.env.FINIX_APPROVED_EMAILS_ENABLED === 'true',
            automation: { daily: process.env.FINIX_APPROVED_EMAILS_ENABLED === 'true', weekly: process.env.FINIX_APPROVED_EMAILS_ENABLED === 'true', official: process.env.FINIX_OFFICIAL_POST_EMAILS_ENABLED === 'true' },
            jobs: await this.prisma.platformSetting.findMany({ where: { key: { startsWith: 'newsletter.job.' } }, select: { key: true, value: true } }),
            quota: (this.quota?.enabled() ? await this.quota.usage().catch(() => null) : null),
        };
    }

    private canSendCampaign(campaign?: { sourceKey?: string | null; createdAt?: Date } | null) {
        return process.env.EMAIL_SEND_ENABLED === 'true'
            || (process.env.FINIX_APPROVED_EMAILS_ENABLED === 'true' && (campaign?.sourceKey?.startsWith('finix-approved:') === true || this.isEnabledOfficialCampaign(campaign)));
    }

    private isEnabledOfficialCampaign(campaign?: { sourceKey?: string | null; createdAt?: Date } | null) {
        const from = Date.parse(process.env.FINIX_OFFICIAL_POST_EMAILS_FROM || '');
        return process.env.FINIX_OFFICIAL_POST_EMAILS_ENABLED === 'true' &&
            campaign?.sourceKey?.startsWith('official-post:') === true && Number.isFinite(from) &&
            !!campaign.createdAt && campaign.createdAt.getTime() >= from;
    }

    async createApprovedCampaign(input: {
        sourceKey: string;
        subject: string;
        title: string;
        message: string;
        contentHtml: string;
        createdById: string;
        audience?: 'OFFICIAL' | 'DAILY' | 'WEEKLY';
    }) {
        const audience = input.audience || 'OFFICIAL';
        const recipientCount = await this.prisma.user.count({ where: this.recipientWhere(audience) });
        return this.prisma.proEmailCampaign.upsert({
            where: { sourceKey: input.sourceKey },
            update: {},
            create: { ...input, audience, status: 'SENDING', recipientCount, audienceReady: false },
        });
    }

    async getCampaignDetail(id: string) {
        const campaign = await this.prisma.proEmailCampaign.findUnique({
            where: { id },
            include: {
                recipients: {
                    take: 50,
                    orderBy: { updatedAt: 'desc' },
                    include: { user: { select: { username: true, email: true } } },
                },
                createdBy: { select: { username: true, email: true } },
            },
        });
        if (!campaign) throw new BadRequestException('Campaña no encontrada.');
        const statuses = await this.prisma.emailCampaignRecipient.groupBy({ by: ['status'], where: { campaignId: id }, _count: true });
        const delivered = await this.prisma.emailCampaignRecipient.count({ where: { campaignId: id, deliveredAt: { not: null } } });
        return { ...campaign, statuses, deliveredCount: delivered };
    }

    private reconciling = false;
    @Interval(60000)
    async reconcileRecentDeliveries() {
        if (this.reconciling || !process.env.RESEND_API_KEY || process.env.FINIX_LOCAL_MODE === 'true') return;
        this.reconciling = true;
        try { await this.refreshDelivery(); }
        catch { this.logger.warn('Se reintentará la consulta de entregas de Resend.'); }
        finally { this.reconciling = false; }
    }
    async refreshDelivery(campaignId?: string) {
        if (!process.env.RESEND_API_KEY) throw new BadRequestException('Resend no está configurado en este entorno.');
        const rows = await this.prisma.emailCampaignRecipient.findMany({ where: {
            ...(campaignId ? { campaignId } : {}), status: 'SENT', providerId: { not: null }, deliveredAt: null,
            sentAt: { gte: new Date(Date.now() - 7 * 86400000) },
        }, take: 10, orderBy: { updatedAt: 'asc' } });
        let delivered = 0, bounced = 0;
        for (const row of rows) {
            const response = await fetch('https://api.resend.com/emails/' + encodeURIComponent(row.providerId!), {
                headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY }, signal: AbortSignal.timeout(8000),
            });
            if (!response.ok) throw new BadRequestException('No se pudo consultar la entrega en Resend. Reintentá.');
            const mail = await response.json();
            const event = mail.last_event;
            await this.prisma.$transaction(async tx => {
                const result = await tx.emailCampaignRecipient.updateMany({ where: { id: row.id, status: 'SENT', deliveredAt: null }, data: {
                    updatedAt: new Date(),
                    ...(['delivered', 'opened', 'clicked'].includes(event) ? { deliveredAt: new Date() } : {}),
                    ...(['bounced', 'complained', 'failed'].includes(event) ? { status: 'BOUNCED', error: 'Resend: ' + event } : {}),
                } });
                if (result.count && ['delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed'].includes(event)) {
                    const success = ['delivered', 'opened', 'clicked'].includes(event);
                    if (success) delivered++; else bounced++;
                    await tx.emailEvent.create({ data: { type: success ? 'DELIVERED' : 'BOUNCED', campaignId: row.campaignId, recipientId: row.id, userId: row.userId, providerId: row.providerId } });
                }
            });
            await new Promise(resolve => setTimeout(resolve, 550));
        }
        return { checked: rows.length, delivered, bounced };
    }

    async retryFailedRecipients(id: string) {
        const result = await this.prisma.emailCampaignRecipient.updateMany({
            where: { campaignId: id, status: 'FAILED', OR: [{ firstAttemptAt: null }, { firstAttemptAt: { gte: new Date(Date.now() - 23 * 60 * 60 * 1000) } }] },
            data: { status: 'QUEUED', error: null, attempts: 0, nextAttemptAt: new Date() },
        });
        if (result.count > 0) {
            await this.prisma.proEmailCampaign.update({
                where: { id },
                data: { status: 'SENDING' },
            });
        }
        return { retried: result.count };
    }

    async getAnalysisDetailsForEmail(id: string) {
        return this.prisma.assetAnalysis.findUnique({
            where: { id },
        });
    }

    async templates() { return this.prisma.emailTemplate.findMany({ orderBy: { updatedAt: 'desc' } }); }
    async prepare(raw: unknown) {
        const parsed = schema.safeParse(raw);
        if (!parsed.success) throw new BadRequestException('Revisa asunto, contenido, fechas y URLs.');
        const input = parsed.data;
        const analysis = input.analysisId ? await this.prisma.assetAnalysis.findFirst({ where: { id: input.analysisId, status: 'PUBLISHED', isActive: true } }) : null;
        if (input.analysisId && !analysis) throw new BadRequestException('El analisis no esta publicado.');
        return { input, html: renderCampaign({ ...input, title: input.title!, message: input.message!, audience: input.audience }, analysis) };
    }
    async preview(raw: unknown) {
        const { html } = await this.prepare(raw);
        return { html: html.replace('{{unsubscribe_url}}', escapeEmail((process.env.FRONTEND_URL || 'https://finixarg.com') + '/settings')) };
    }
    async test(raw: unknown, address: unknown) {
        if (!this.canSendCampaign({ sourceKey: 'finix-approved:manual:test' })) throw new BadRequestException('Envio deshabilitado en este entorno.');
        const email = z.string().email().safeParse(address);
        if (!email.success) throw new BadRequestException('Email de prueba invalido.');
        const { input } = await this.prepare(raw);
        const { html } = await this.preview(raw);
        await this.mail.sendEmail({ to: email.data, subject: '[PRUEBA] ' + input.subject, text: input.message, html });
        return { sent: true };
    }
    async createCampaign(adminId: string, raw: unknown) {
        const { input, html } = await this.prepare(raw);
        if (input.scheduledAt && new Date(input.scheduledAt).getTime() <= Date.now()) throw new BadRequestException('La fecha debe ser futura.');
        const recipientCount = await this.prisma.user.count({ where: this.recipientWhere(input.audience) });
        if (!recipientCount) throw new BadRequestException('No hay destinatarios con consentimiento.');
        return this.prisma.proEmailCampaign.create({ data: { sourceKey: 'finix-approved:manual:' + randomUUID(), subject: input.subject, title: input.title, message: input.message, imageUrl: input.imageUrl || null, ctaUrl: input.ctaUrl || null, ctaLabel: input.ctaLabel, contentHtml: html, previewText: input.previewText, audience: input.audience, createdById: adminId, status: input.scheduledAt ? 'SCHEDULED' : 'SENDING', scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null, recipientCount } });
    }
    async upload(adminId: string, buffer: Buffer) {
        if (!buffer?.length || buffer.length > 5 * 1024 * 1024) throw new BadRequestException('Imagen requerida; maximo 5 MB.');
        let output: Buffer;
        try {
            const image = sharp(buffer, { limitInputPixels: 20000000 });
            const metadata = await image.metadata();
            if (!['png', 'jpeg', 'webp'].includes(metadata.format)) throw new Error('Unsupported image');
            output = await image.rotate().resize({ width: 1280, withoutEnlargement: true }).png().toBuffer();
        }
        catch { throw new BadRequestException('Imagen invalida.'); }
        const name = randomUUID() + '.png';
        const directory = join(__dirname, '..', '..', 'uploads', 'email');
        await mkdir(directory, { recursive: true });
        await writeFile(join(directory, name), output, { mode: 0o644, flag: 'wx' });
        const mediaUrl = (process.env.API_URL || process.env.FRONTEND_URL || 'https://finixarg.com') + '/uploads/email/' + name;
        return this.prisma.emailMedia.create({ data: { url: mediaUrl, mimeType: 'image/png', size: output.length, uploadedById: adminId } });
    }
    private signature(userId: string) { return createHmac('sha256', process.env.JWT_SECRET!).update('email-unsubscribe:' + userId).digest('hex'); }
    async unsubscribe(userId: string, signature: string) {
        if (!z.string().uuid().safeParse(userId).success || !/^[a-f0-9]{64}$/.test(signature || '') || !timingSafeEqual(Buffer.from(signature), Buffer.from(this.signature(userId)))) throw new BadRequestException('Enlace invalido.');
        await this.prisma.$transaction(async tx => {
            const user=await tx.user.findUnique({where:{id:userId},select:{notificationPrefs:true}});
            let preferences:any={};try{preferences=JSON.parse(user?.notificationPrefs||'{}');}catch{}
            if(!preferences||typeof preferences!=='object'||Array.isArray(preferences))preferences={};
            await tx.user.updateMany({ where: { id: userId }, data: { investmentEmailNotifications: false,notificationPrefs:JSON.stringify({...preferences,email:false}) } });
            await tx.emailPreference.upsert({ where: { userId }, create: { userId, marketing: false, product: false }, update: { marketing: false, product: false } });
        });
        return 'Suscripcion a comunicaciones de inversion cancelada.';
    }
    @Interval(5000)
    async tick() {
        const approvedOnly = process.env.EMAIL_SEND_ENABLED !== 'true';
        if (this.busy || (approvedOnly && process.env.FINIX_APPROVED_EMAILS_ENABLED !== 'true')) return;
        this.busy = true;
        try {
            const campaigns = await this.prisma.proEmailCampaign.findMany({
                where: {
                    status: { in: ['SENDING', 'SCHEDULED'] },
                    OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
                    ...(approvedOnly ? { AND: [{ OR: [{ sourceKey: { startsWith: 'finix-approved:' } }, ...(process.env.FINIX_OFFICIAL_POST_EMAILS_ENABLED === 'true' && Number.isFinite(Date.parse(process.env.FINIX_OFFICIAL_POST_EMAILS_FROM || '')) ? [{ sourceKey: { startsWith: 'official-post:' }, createdAt: { gte: new Date(process.env.FINIX_OFFICIAL_POST_EMAILS_FROM!) } }] : [])] }] } : {}),
                },
                take: 5,
                orderBy: { createdAt: 'asc' },
            });
            for (const campaign of campaigns) await this.processBatch(campaign.id);
        } catch { this.logger.error('Fallo de cola email; se reintentara.'); }
        finally { this.busy = false; }
    }
    async processBatch(id: string) {
        const campaign = await this.prisma.proEmailCampaign.findUnique({ where: { id } });
        if (!campaign || !['SENDING', 'SCHEDULED'].includes(campaign.status) || (campaign.scheduledAt && campaign.scheduledAt > new Date())) return { skipped: true };
        if (!this.canSendCampaign(campaign)) return { paused: true };
        if (campaign.sourceKey?.startsWith('official-post:')) {
            const post = await this.prisma.post.findUnique({ where: { id: campaign.sourceKey.slice('official-post:'.length) },
                select: { visibility: true, deletedAt: true, communityId: true, parentId: true,
                    author: { select: { id: true, username: true, role: true, isVerified: true, status: true } } } });
            if (!post || post.deletedAt || post.communityId || post.parentId || post.visibility !== 'VISIBLE' || !isOfficialPublisher(post.author)) {
                await this.prisma.proEmailCampaign.update({ where: { id }, data: { status: 'CANCELLED' } });
                return { skipped: true };
            }
        }

        if (!campaign.audienceReady) {
            const users = await this.prisma.user.findMany({ where: { ...this.recipientWhere(campaign.audience), ...(campaign.audienceCursor ? { id: { gt: campaign.audienceCursor } } : {}) }, select: { id: true, email: true }, orderBy: { id: 'asc' }, take: 500 });
            await this.prisma.$transaction(async tx => {
                const claim = await tx.proEmailCampaign.updateMany({ where: { id, audienceCursor: campaign.audienceCursor, audienceReady: false }, data: { audienceCursor: users[users.length - 1]?.id || campaign.audienceCursor, audienceReady: users.length < 500, status: 'SENDING' } });
                if (claim.count) await tx.emailCampaignRecipient.createMany({ data: users.map(u => ({ campaignId: id, userId: u.id, email: u.email })), skipDuplicates: true });
            });
            return { preparing: true };
        }
        const allowance = this.quota ? await this.quota.bulkAllowance(5) : { count: 5, retryAt: null };
        if (!allowance.count) {
            await this.prisma.proEmailCampaign.update({ where: { id }, data: { status: 'SCHEDULED', scheduledAt: allowance.retryAt } });
            return { waitingForQuota: true };
        }
        const now = new Date();
        const eligible = { campaignId: id, nextAttemptAt: { lte: now }, OR: [{ status: 'QUEUED' }, { status: 'PROCESSING', lockedUntil: { lt: now } }] };
        const rows = await this.prisma.emailCampaignRecipient.findMany({ where: eligible, take: allowance.count, orderBy: { queuedAt: 'asc' } });
        for (const row of rows) {
            // Resend retains idempotency keys for 24h. Never retry an uncertain delivery outside that window.
            if (row.firstAttemptAt && Date.now() - row.firstAttemptAt.getTime() > 23 * 3600000) {
                await this.prisma.emailCampaignRecipient.updateMany({ where: { id: row.id, ...eligible }, data: { status: 'FAILED', error: 'Requiere conciliacion con el proveedor antes de reenviar' } });
                continue;
            }
            const claim = await this.prisma.emailCampaignRecipient.updateMany({ where: { id: row.id, ...eligible }, data: { status: 'PROCESSING', lockedUntil: new Date(Date.now() + 120000), attempts: { increment: 1 } } });
            if (!claim.count) continue;
            const user = await this.prisma.user.findFirst({ where: { id: row.userId, email: row.email, ...this.recipientWhere(campaign.audience) }, select: { id: true } });
            if (!user) { await this.prisma.emailCampaignRecipient.update({ where: { id: row.id }, data: { status: 'SKIPPED' } }); continue; }
            try {
                const unsubscribe = (process.env.API_URL || process.env.FRONTEND_URL || 'https://finixarg.com') + '/api/email-preferences/unsubscribe?user=' + row.userId + '&token=' + this.signature(row.userId);
                let snapshot = (row.firstAttemptAt ? row.renderedContent : null) as { html: string; text: string; subject: string } | null;
                if (!snapshot) {
                    // Legacy uncertain attempts retain the original campaign payload.
                    let html = campaign.contentHtml || renderCampaign(campaign), message = campaign.message;
                    if (!row.firstAttemptAt && campaign.sourceKey?.startsWith('finix-approved:daily:')) {
                        if (!isCurrentDailyCampaign(campaign.sourceKey)) {
                            await this.prisma.emailCampaignRecipient.update({ where: { id: row.id }, data: { status: 'SKIPPED', error: 'La rueda del informe ya finalizó; se espera el próximo informe diario.', lockedUntil: null } });
                            continue;
                        }
                        if (!this.dailyBriefRenderer) throw new Error('Daily renderer not ready');
                        const fresh = await this.dailyBriefRenderer(new Date());
                        html = fresh.html; message = fresh.message;
                    }
                    snapshot = { html: html.replace('{{unsubscribe_url}}', escapeEmail(unsubscribe)), subject: campaign.subject,
                        text: message + '\n' + (campaign.ctaUrl || '') + '\nCancelar suscripcion: ' + unsubscribe };
                    await this.prisma.emailCampaignRecipient.update({ where: { id: row.id }, data: { renderedContent: snapshot } });
                }
                if (!row.firstAttemptAt) await this.prisma.emailCampaignRecipient.update({ where: { id: row.id }, data: { firstAttemptAt: new Date() } });
                const result = await this.mail.sendEmail({ to: row.email, ...snapshot, idempotencyKey: 'campaign/' + row.id });
                await this.prisma.$transaction([
                    this.prisma.emailCampaignRecipient.update({ where: { id: row.id }, data: { status: 'SENT', sentAt: new Date(), providerId: result.id, lockedUntil: null } }),
                    this.prisma.emailEvent.create({ data: { type: 'SENT', campaignId: id, recipientId: row.id, userId: row.userId, providerId: result.id } }),
                ]);
            } catch {
                await this.prisma.emailCampaignRecipient.update({ where: { id: row.id }, data: { status: row.attempts >= 4 ? 'FAILED' : 'QUEUED', error: 'No se pudo confirmar el envio', lockedUntil: null, nextAttemptAt: new Date(Date.now() + 60000 * 2 ** row.attempts) } });
            }
        }
        const [remaining, sentCount, failedCount, recipientCount] = await Promise.all([
            this.prisma.emailCampaignRecipient.count({ where: { campaignId: id, status: { in: ['QUEUED', 'PROCESSING'] } } }),
            this.prisma.emailCampaignRecipient.count({ where: { campaignId: id, status: { in: ['SENT', 'BOUNCED'] } } }),
            this.prisma.emailCampaignRecipient.count({ where: { campaignId: id, status: { in: ['FAILED', 'BOUNCED'] } } }),
            this.prisma.emailCampaignRecipient.count({ where: { campaignId: id } }),
        ]);
        await this.prisma.proEmailCampaign.update({ where: { id }, data: { sentCount, failedCount, recipientCount, status: remaining ? 'SENDING' : failedCount ? 'FAILED' : 'SENT', sentAt: remaining ? null : new Date() } });
        return { remaining, sentCount, failedCount };
    }
}
