import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { createHmac, timingSafeEqual, randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import sharp = require('sharp');
import { z } from 'zod';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { escapeEmail, renderCampaign } from './email-content';

const url = z.string().max(2048).url().refine(v => new URL(v).protocol === 'https:' || (process.env.NODE_ENV !== 'production' && new URL(v).protocol === 'http:')).or(z.literal('')).optional();
const schema = z.object({ subject: z.string().trim().min(1).max(160), title: z.string().trim().min(1).max(160), message: z.string().trim().min(1).max(10000), imageUrl: url, chartUrl: url, ctaUrl: url, ctaLabel: z.string().max(80).optional(), audience: z.enum(['PRO', 'ALL']).default('PRO'), analysisId: z.string().uuid().or(z.literal('')).optional(), scheduledAt: z.string().datetime().optional(), previewText: z.string().max(250).optional() });

@Injectable()
export class EmailMarketingService {
    private busy = false;
    private readonly logger = new Logger(EmailMarketingService.name);
    constructor(private readonly prisma: PrismaService, private readonly mail: MailService) {}
    private recipientWhere(audience = 'PRO') {
        const base = { status: 'ACTIVE', emailVerified: true, investmentEmailNotifications: true, OR: [{ emailPreferences: { is: null } }, { emailPreferences: { is: { marketing: true, analysis: true } } }] };
        return audience === 'ALL' ? base : { ...base, plan: 'PRO', subscriptionStatus: 'ACTIVE' };
    }
    async dashboard() {
        const [campaigns, recipientCount, sent, failed, activeAlerts] = await Promise.all([
            this.prisma.proEmailCampaign.findMany({ take: 30, orderBy: { createdAt: 'desc' } }),
            this.prisma.user.count({ where: this.recipientWhere() }),
            this.prisma.emailCampaignRecipient.count({ where: { status: 'SENT' } }),
            this.prisma.emailCampaignRecipient.count({ where: { status: 'FAILED' } }),
            (this.prisma as any).marketAlert?.count({ where: { status: 'ACTIVE' } }) ?? 0,
        ]);
        return {
            metrics: { recipientCount, sent, failed, activeAlerts },
            campaigns,
            sendEnabled: process.env.EMAIL_SEND_ENABLED === 'true',
        };
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
        return campaign;
    }

    async retryFailedRecipients(id: string) {
        const result = await this.prisma.emailCampaignRecipient.updateMany({
            where: { campaignId: id, status: 'FAILED' },
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
        return { input, html: renderCampaign({ ...input, title: input.title!, message: input.message! }, analysis) };
    }
    async preview(raw: unknown) {
        const { html } = await this.prepare(raw);
        return { html: html.replace('{{unsubscribe_url}}', escapeEmail((process.env.FRONTEND_URL || 'https://finixarg.com') + '/settings')) };
    }
    async test(raw: unknown, address: unknown) {
        if (process.env.EMAIL_SEND_ENABLED !== 'true') throw new BadRequestException('Envio deshabilitado en este entorno.');
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
        return this.prisma.proEmailCampaign.create({ data: { subject: input.subject, title: input.title, message: input.message, imageUrl: input.imageUrl || null, ctaUrl: input.ctaUrl || null, ctaLabel: input.ctaLabel, contentHtml: html, previewText: input.previewText, audience: input.audience, createdById: adminId, status: input.scheduledAt ? 'SCHEDULED' : 'SENDING', scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null, recipientCount } });
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
        await this.prisma.user.updateMany({ where: { id: userId }, data: { investmentEmailNotifications: false } });
        return 'Suscripcion a comunicaciones de inversion cancelada.';
    }
    @Interval(5000)
    async tick() {
        if (this.busy || process.env.EMAIL_SEND_ENABLED !== 'true') return;
        this.busy = true;
        try {
            const campaigns = await this.prisma.proEmailCampaign.findMany({ where: { status: { in: ['SENDING', 'SCHEDULED'] }, OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }] }, take: 5, orderBy: { createdAt: 'asc' } });
            for (const campaign of campaigns) await this.processBatch(campaign.id);
        } catch { this.logger.error('Fallo de cola email; se reintentara.'); }
        finally { this.busy = false; }
    }
    async processBatch(id: string) {
        if (process.env.EMAIL_SEND_ENABLED !== 'true') return { paused: true };
        const campaign = await this.prisma.proEmailCampaign.findUnique({ where: { id } });
        if (!campaign || !['SENDING', 'SCHEDULED'].includes(campaign.status) || (campaign.scheduledAt && campaign.scheduledAt > new Date())) return { skipped: true };
        if (!campaign.audienceReady) {
            const users = await this.prisma.user.findMany({ where: { ...this.recipientWhere(campaign.audience), ...(campaign.audienceCursor ? { id: { gt: campaign.audienceCursor } } : {}) }, select: { id: true, email: true }, orderBy: { id: 'asc' }, take: 500 });
            await this.prisma.$transaction(async tx => {
                const claim = await tx.proEmailCampaign.updateMany({ where: { id, audienceCursor: campaign.audienceCursor, audienceReady: false }, data: { audienceCursor: users[users.length - 1]?.id || campaign.audienceCursor, audienceReady: users.length < 500, status: 'SENDING' } });
                if (claim.count) await tx.emailCampaignRecipient.createMany({ data: users.map(u => ({ campaignId: id, userId: u.id, email: u.email })), skipDuplicates: true });
            });
            return { preparing: true };
        }
        const now = new Date();
        const eligible = { campaignId: id, nextAttemptAt: { lte: now }, OR: [{ status: 'QUEUED' }, { status: 'PROCESSING', lockedUntil: { lt: now } }] };
        const rows = await this.prisma.emailCampaignRecipient.findMany({ where: eligible, take: 5, orderBy: { queuedAt: 'asc' } });
        for (const row of rows) {
            // Resend retains idempotency keys for 24h. Never retry an uncertain delivery outside that window.
            if (row.firstAttemptAt && Date.now() - row.firstAttemptAt.getTime() > 23 * 3600000) {
                await this.prisma.emailCampaignRecipient.updateMany({ where: { id: row.id, ...eligible }, data: { status: 'FAILED', error: 'Requiere conciliacion con el proveedor antes de reenviar' } });
                continue;
            }
            const claim = await this.prisma.emailCampaignRecipient.updateMany({ where: { id: row.id, ...eligible }, data: { status: 'PROCESSING', firstAttemptAt: row.firstAttemptAt || now, lockedUntil: new Date(Date.now() + 120000), attempts: { increment: 1 } } });
            if (!claim.count) continue;
            const user = await this.prisma.user.findFirst({ where: { id: row.userId, email: row.email, ...this.recipientWhere(campaign.audience) }, select: { id: true } });
            if (!user) { await this.prisma.emailCampaignRecipient.update({ where: { id: row.id }, data: { status: 'SKIPPED' } }); continue; }
            try {
                const unsubscribe = (process.env.API_URL || process.env.FRONTEND_URL || 'https://finixarg.com') + '/api/email-preferences/unsubscribe?user=' + row.userId + '&token=' + this.signature(row.userId);
                const html = (campaign.contentHtml || renderCampaign(campaign)).replace('{{unsubscribe_url}}', escapeEmail(unsubscribe));
                const result = await this.mail.sendEmail({ to: row.email, subject: campaign.subject, html, text: campaign.message + '\n' + (campaign.ctaUrl || '') + '\nCancelar suscripcion: ' + unsubscribe, idempotencyKey: 'campaign/' + row.id });
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
            this.prisma.emailCampaignRecipient.count({ where: { campaignId: id, status: 'SENT' } }),
            this.prisma.emailCampaignRecipient.count({ where: { campaignId: id, status: 'FAILED' } }),
            this.prisma.emailCampaignRecipient.count({ where: { campaignId: id } }),
        ]);
        await this.prisma.proEmailCampaign.update({ where: { id }, data: { sentCount, failedCount, recipientCount, status: remaining ? 'SENDING' : failedCount ? 'FAILED' : 'SENT', sentAt: remaining ? null : new Date() } });
        return { remaining, sentCount, failedCount };
    }
}
