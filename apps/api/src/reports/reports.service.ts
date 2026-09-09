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

        // Send email to admin
        await this.mailService.sendEmail({
            to: 'juanpablorolo2007@gmail.com', // Admin email
            subject: `Nuevo Reporte en Finix: ${targetType}`,
            text: `Reporte de ${targetType}`,
            html: `<div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #ef4444;">Nuevo Reporte de Finix</h2>
                <p><strong>Hecho por:</strong> ${reporter?.username} (${reporter?.email})</p>
                <p><strong>Tipo:</strong> ${targetType}</p>
                <p><strong>Objetivo Reportado:</strong> ${targetDetail}</p>
                <p><strong>Motivo / Descripción:</strong><br/> ${reason}</p>
                <br/>
                <a href="https://admin.finixarg.com" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al Panel Admin</a>
            </div>`
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
