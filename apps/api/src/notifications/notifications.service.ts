import { Injectable, Logger } from '@nestjs/common';

import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma.service';

interface CreateNotificationInput {
    userId: string;
    actorId?: string;
    type: string;
    title: string;
    content?: string;
    link?: string;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    private formatRelativeTime(value: Date) {
        const diffMs = Date.now() - value.getTime();
        const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

        if (diffMinutes < 1) return 'Hace instantes';
        if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

        const diffHours = Math.round(diffMinutes / 60);
        if (diffHours < 24) return `Hace ${diffHours} h`;

        const diffDays = Math.round(diffHours / 24);
        if (diffDays < 7) return `Hace ${diffDays} d`;

        return value.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
        });
    }

    async createNotification(input: CreateNotificationInput) {
        if (!input.userId) return null;
        if (input.actorId && input.actorId === input.userId) return null;

        const [notification, recipient] = await Promise.all([
            this.prisma.notification.create({
                data: {
                    userId: input.userId,
                    type: input.type,
                    title: input.title,
                    content: input.content || null,
                    link: input.link || null,
                },
            }),
            this.prisma.user.findUnique({
                where: { id: input.userId },
                select: {
                    email: true,
                    username: true,
                    emailVerified: true,
                },
            }),
        ]);

        if (recipient?.email && recipient.emailVerified) {
            try {
                await this.mailService.sendNotificationEmail(recipient.email, {
                    username: recipient.username,
                    title: input.title,
                    content: input.content,
                    link: input.link,
                });
            } catch (error) {
                this.logger.warn(`No se pudo enviar email de notificacion a ${recipient.email}: ${String(error)}`);
            }
        }

        return notification;
    }

    async getNotifications(userId: string) {
        const notifications = await this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 30,
        });

        return notifications.map((notification) => ({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            content: notification.content,
            link: notification.link,
            isRead: notification.isRead,
            time: this.formatRelativeTime(notification.createdAt),
            createdAt: notification.createdAt,
        }));
    }

    async countUnread(userId: string) {
        const count = await this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });

        return { count };
    }

    async markAllAsRead(userId: string) {
        await this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return { success: true };
    }
}
