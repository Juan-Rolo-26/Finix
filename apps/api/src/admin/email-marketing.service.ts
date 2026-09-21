import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';

type CampaignInput = {
    subject: string;
    title: string;
    message: string;
    previewText?: string;
    imageUrl?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    audience?: 'PRO' | 'ALL';
    scheduledAt?: string;
    sendTestTo?: string;
};

@Injectable()
export class EmailMarketingService {
    constructor(private readonly prisma: PrismaService, private readonly mail: MailService) {}

    private recipientWhere(audience: string = 'PRO') {
        const base = { status: 'ACTIVE', emailVerified: true, investmentEmailNotifications: true };
        return audience === 'ALL' ? base : { ...base, plan: 'PRO', subscriptionStatus: 'ACTIVE' };
    }

    private safeUrl(value?: string) {
        if (!value) return null;
        try {
            const url = new URL(value);
            if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
            return url.toString();
        } catch { throw new BadRequestException('Las URLs deben usar http o https'); }
    }

    async dashboard() {
        const [campaigns, queued, sent, delivered, opened, clicked, bounced, recipientCount] = await Promise.all([
            this.prisma.proEmailCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: 12, select: { id: true, subject: true, status: true, audience: true, recipientCount: true, sentCount: true, failedCount: true, createdAt: true, scheduledAt: true } }),
            this.prisma.emailCampaignRecipient.count({ where: { status: 'QUEUED' } }),
            this.prisma.emailEvent.count({ where: { type: 'SENT' } }),
            this.prisma.emailEvent.count({ where: { type: 'DELIVERED' } }),
            this.prisma.emailEvent.count({ where: { type: 'OPENED' } }),
            this.prisma.emailEvent.count({ where: { type: 'CLICKED' } }),
            this.prisma.emailEvent.count({ where: { type: 'BOUNCED' } }),
            this.prisma.user.count({ where: this.recipientWhere('PRO') }),
        ]);
        return { metrics: { queued, sent, delivered, opened, clicked, bounced, recipientCount, ctr: delivered ? Number(((clicked / delivered) * 100).toFixed(2)) : 0 }, campaigns };
    }

    async templates() {
        const existing = await this.prisma.emailTemplate.findMany({ orderBy: { updatedAt: 'desc' } });
        if (existing.length) return existing;
        return this.prisma.emailTemplate.createMany({ data: [
            { name: 'Alerta de mercado', type: 'ALERT', subject: 'Alerta Finix: {{ticker}}', contentHtml: '<h1>{{title}}</h1><p>{{message}}</p><a href="{{cta_url}}">Ver en Finix</a>', contentText: '{{title}}\n\n{{message}}' },
            { name: 'Finix Daily', type: 'NEWSLETTER', subject: 'Finix Daily: lo importante de hoy', contentHtml: '<h1>Finix Daily</h1><p>{{message}}</p>', contentText: '{{message}}' },
            { name: 'Bienvenida Pro', type: 'TRANSACTIONAL', subject: 'Bienvenido a Finix Pro, {{user.name}}', contentHtml: '<h1>Bienvenido a Finix Pro</h1><p>Tu acceso ya está activo.</p>', contentText: 'Bienvenido a Finix Pro' },
        ] }).then(() => this.prisma.emailTemplate.findMany({ orderBy: { updatedAt: 'desc' } }));
    }

    async createCampaign(adminId: string, input: CampaignInput) {
        if (!input.subject?.trim() || !input.title?.trim() || !input.message?.trim()) throw new BadRequestException('Asunto, título y mensaje son obligatorios');
        const audience = input.audience || 'PRO';
        const recipients = await this.prisma.user.findMany({ where: this.recipientWhere(audience), select: { id: true, email: true, username: true }, orderBy: { id: 'asc' } });
        if (!recipients.length) throw new BadRequestException('No hay destinatarios elegibles para esta audiencia');
        const campaign = await this.prisma.proEmailCampaign.create({ data: { subject: input.subject.trim(), title: input.title.trim(), message: input.message.trim(), previewText: input.previewText?.trim() || null, imageUrl: this.safeUrl(input.imageUrl) as string | null, ctaLabel: input.ctaLabel?.trim() || 'Ver en Finix', ctaUrl: this.safeUrl(input.ctaUrl) as string | null, audience, status: input.scheduledAt ? 'SCHEDULED' : 'SENDING', scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null, recipientCount: recipients.length, createdById: adminId } });
        await this.prisma.emailCampaignRecipient.createMany({ data: recipients.map((user) => ({ campaignId: campaign.id, userId: user.id, email: user.email })) });
        if (input.sendTestTo) await this.mail.sendProInvestmentEmail(input.sendTestTo, { username: 'Vista previa', subject: campaign.subject, title: campaign.title, message: campaign.message, imageUrl: campaign.imageUrl, ctaLabel: campaign.ctaLabel || undefined, ctaUrl: campaign.ctaUrl || undefined });
        if (input.scheduledAt) return campaign;
        await this.processBatch(campaign.id);
        return this.prisma.proEmailCampaign.findUniqueOrThrow({ where: { id: campaign.id } });
    }

    async processBatch(campaignId: string, batchSize = 25) {
        const campaign = await this.prisma.proEmailCampaign.findUnique({ where: { id: campaignId } });
        if (!campaign) throw new BadRequestException('Campaña no encontrada');
        const rows = await this.prisma.emailCampaignRecipient.findMany({ where: { campaignId, status: 'QUEUED' }, take: batchSize, orderBy: { queuedAt: 'asc' }, include: { user: { select: { username: true } } } });
        let sent = 0; let failed = 0;
        for (const row of rows) {
            try {
                const result = await this.mail.sendProInvestmentEmail(row.email, { username: row.user.username, subject: campaign.subject, title: campaign.title, message: campaign.message, imageUrl: campaign.imageUrl, ctaLabel: campaign.ctaLabel || undefined, ctaUrl: campaign.ctaUrl || undefined });
                await this.prisma.emailCampaignRecipient.update({ where: { id: row.id }, data: { status: 'SENT', providerId: result?.id, sentAt: new Date() } });
                await this.prisma.emailEvent.create({ data: { type: 'SENT', providerId: result?.id, campaignId, recipientId: row.id, userId: row.userId } });
                sent++;
            } catch (error) {
                await this.prisma.emailCampaignRecipient.update({ where: { id: row.id }, data: { status: 'FAILED', error: error instanceof Error ? error.message.slice(0, 500) : 'send failed' } });
                failed++;
            }
        }
        const remaining = await this.prisma.emailCampaignRecipient.count({ where: { campaignId, status: 'QUEUED' } });
        await this.prisma.proEmailCampaign.update({ where: { id: campaignId }, data: { sentCount: { increment: sent }, failedCount: { increment: failed }, status: remaining ? 'SENDING' : (failed ? 'FAILED' : 'SENT'), sentAt: remaining ? null : new Date() } });
        return { sent, failed, remaining };
    }
}
