import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ReportsService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    async createReport(reporterId: string, targetType: string, targetId: string, reason: string) {
        if (!['USER', 'POST', 'MESSAGE', 'COMMENT', 'CHAT'].includes(targetType)) {
            throw new BadRequestException('Tipo de objetivo de reporte inválido');
        }

        let targetDetail = `ID: ${targetId}`;

        // Fetch specific details based on type for the email report
        if (targetType === 'USER') {
            const user = await this.prisma.user.findUnique({ where: { id: targetId } });
            if (user) targetDetail = `Usuario: ${user.username} (${user.email}) - ID: ${targetId}`;
        } else if (targetType === 'POST') {
            const post = await this.prisma.post.findUnique({ where: { id: targetId } });
            if (post) targetDetail = `Publicación ID: ${targetId} - Texto: ${post.content.substring(0, 100)}`;
        } else if (targetType === 'MESSAGE') {
            const msg = await this.prisma.directMessage.findUnique({ where: { id: targetId } });
            if (msg) targetDetail = `Mensaje ID: ${targetId} - Texto: ${msg.content.substring(0, 100)}`;
        }

        const report = await this.prisma.report.create({
            data: {
                reporterId,
                targetType,
                targetId,
                reason,
            }
        });

        // Search for reporter details context
        const reporter = await this.prisma.user.findUnique({ where: { id: reporterId } });

        // Send email alert to admin
        await this.mailService.sendAdminAlert({
            eventType: 'REPORT_CREATED',
            title: `Nuevo Reporte: ${targetType}`,
            badgeText: 'REPORTE RECIBIDO',
            badgeColor: '#ef4444',
            summary: `Se ha recibido un nuevo reporte en Finix contra un elemento de tipo ${targetType}.`,
            details: [
                { label: 'Tipo de Elemento', value: targetType },
                { label: 'Detalle del Objetivo', value: targetDetail },
                { label: 'Denunciante', value: `${reporter?.username || 'Anónimo'} (${reporter?.email || 'N/A'})` },
                { label: 'Motivo / Descripción', value: reason },
                { label: 'ID Reporte', value: report.id },
                { label: 'Fecha y Hora', value: new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) },
            ],
            actionUrl: `${this.mailService.getAdminUrl()}/reports`,
            actionLabel: 'Moderar Reporte en Panel Admin',
        });

        return report;
    }

    async getReports() {
        return this.prisma.report.findMany({
            orderBy: { createdAt: 'desc' },
            include: { reporter: { select: { username: true, email: true } } }
        });
    }

    async resolveReport(id: string, note?: string) {
        return this.prisma.report.update({
            where: { id },
            data: { status: 'RESOLVED', resolutionNote: note }
        });
    }
}
