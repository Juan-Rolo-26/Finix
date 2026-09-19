import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma.service';
import { AdminSendProEmailDto } from './dto/admin-management.dto';

@Injectable()
export class ProEmailCampaignService {
    private readonly logger = new Logger(ProEmailCampaignService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
    ) {}

    private recipientWhere() {
        return {
            status: 'ACTIVE',
            emailVerified: true,
            investmentEmailNotifications: true,
            plan: 'PRO',
            subscriptionStatus: 'ACTIVE',
        };
    }

    private normalizeOptionalUrl(value?: string) {
        if (!value) return null;
        try {
            const url = new URL(value);
            if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid protocol');
            return url.toString();
        } catch {
            throw new BadRequestException('Las URLs de imagen y botón deben ser enlaces http(s) válidos');
        }
    }

    async getSummary() {
        const prisma = this.prisma as any;
        const recipientCount = await prisma.user.count({ where: this.recipientWhere() });
        const campaigns = await prisma.proEmailCampaign.findMany({
            orderBy: { createdAt: 'desc' },
            take: 12,
            include: { createdBy: { select: { username: true, email: true } } },
        });
        return { recipientCount, campaigns };
    }

    async sendCampaign(adminId: string, dto: AdminSendProEmailDto) {
        const prisma = this.prisma as any;
        const imageUrl = this.normalizeOptionalUrl(dto.imageUrl);
        const ctaUrl = this.normalizeOptionalUrl(dto.ctaUrl);
        const recipients = await prisma.user.findMany({
            where: this.recipientWhere(),
            select: { id: true, email: true, username: true },
        });

        if (recipients.length === 0) {
            throw new BadRequestException('No hay usuarios PRO con notificaciones de inversión activadas');
        }

        const campaign = await prisma.proEmailCampaign.create({
            data: {
                subject: dto.subject,
                title: dto.title,
                message: dto.message,
                imageUrl,
                ctaLabel: dto.ctaLabel || null,
                ctaUrl,
                recipientCount: recipients.length,
                createdById: adminId,
            },
        });

        let sentCount = 0;
        let failedCount = 0;
        const concurrency = 3;
        for (let index = 0; index < recipients.length; index += concurrency) {
            const batch = recipients.slice(index, index + concurrency);
            const results = await Promise.allSettled(batch.map((recipient) =>
                this.mailService.sendProInvestmentEmail(recipient.email, {
                    username: recipient.username,
                    subject: dto.subject,
                    title: dto.title,
                    message: dto.message,
                    imageUrl,
                    ctaLabel: dto.ctaLabel,
                    ctaUrl,
                }),
            ));
            results.forEach((result, batchIndex) => {
                if (result.status === 'fulfilled') {
                    sentCount += 1;
                } else {
                    failedCount += 1;
                    this.logger.warn(`No se pudo enviar campaña PRO a ${batch[batchIndex].id}`);
                }
            });
        }

        const updatedCampaign = await prisma.proEmailCampaign.update({
            where: { id: campaign.id },
            data: { sentCount, failedCount },
        });

        return { campaign: updatedCampaign, sentCount, failedCount, recipientCount: recipients.length };
    }
}
