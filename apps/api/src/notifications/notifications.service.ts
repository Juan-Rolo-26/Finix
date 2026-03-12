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

interface GetNotificationsInput {
    days?: number;
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

    private formatDateKey(value: Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    private formatHistoryDate(value: Date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const target = new Date(value);
        target.setHours(0, 0, 0, 0);

        const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';

        const label = value.toLocaleDateString('es-AR', {
            weekday: 'long',
            day: '2-digit',
            month: 'short',
        });

        return label.charAt(0).toUpperCase() + label.slice(1);
    }

    private resolveHistoryStart(days: number) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - (days - 1));
        return start;
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

    async getNotifications(userId: string, input: GetNotificationsInput = {}) {
        const parsedDays = Number.isFinite(input.days)
            ? Math.max(1, Math.min(30, Math.trunc(input.days as number)))
            : undefined;

        const notifications = await this.prisma.notification.findMany({
            where: {
                userId,
                ...(parsedDays
                    ? {
                        createdAt: {
                            gte: this.resolveHistoryStart(parsedDays),
                        },
                    }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: parsedDays ? 100 : 30,
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
            dateKey: this.formatDateKey(notification.createdAt),
            dateLabel: this.formatHistoryDate(notification.createdAt),
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
