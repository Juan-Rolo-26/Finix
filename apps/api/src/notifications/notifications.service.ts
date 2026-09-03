import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma.service';
import { Notification } from '@prisma/client';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type NotificationType =
    | 'SOCIAL_FOLLOW' | 'SOCIAL_LIKE' | 'SOCIAL_COMMENT' | 'SOCIAL_REPLY' | 'SOCIAL_MENTION' | 'SOCIAL_REPOST'
    | 'COMMUNITY_NEW_POST' | 'COMMUNITY_PREMIUM_CONTENT' | 'COMMUNITY_EVENT' | 'COMMUNITY_NEW_MEMBER' | 'COMMUNITY_SUBSCRIPTION' | 'COMMUNITY_CANCEL' | 'COMMUNITY_MODERATION'
    | 'MARKET_PRICE_ALERT' | 'MARKET_VARIATION' | 'MARKET_WATCHLIST' | 'MARKET_EARNINGS' | 'MARKET_NEWS'
    | 'SUBSCRIPTION_NEW' | 'SUBSCRIPTION_RENEW' | 'SUBSCRIPTION_FAIL' | 'SUBSCRIPTION_CANCEL'
    | 'SECURITY_NEW_LOGIN' | 'SECURITY_PASSWORD_CHANGE' | 'SECURITY_EMAIL_CHANGE'
    | 'SYSTEM_ALERT';

export interface CreateNotificationInput {
    userId: string;
    type: NotificationType;
    priority?: NotificationPriority;

    title: string;
    message?: string;
    link?: string;

    entityType?: string;
    entityId?: string;
    actorId?: string;
    metadata?: any;
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
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        return value.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    }

    // Helper to group by type for the UI
    private getCategoryFromType(type: string): string {
        if (type.startsWith('SOCIAL_')) return 'SOCIAL';
        if (type.startsWith('COMMUNITY_')) return 'COMMUNITY';
        if (type.startsWith('MARKET_')) return 'MARKET';
        if (type.startsWith('SECURITY_')) return 'SECURITY';
        if (type.startsWith('SUBSCRIPTION_')) return 'SUBSCRIPTION';
        return 'SYSTEM';
    }

    async checkPreferences(userId: string, category: string): Promise<boolean> {
        if (category === 'SECURITY' || category === 'SYSTEM') return true; // Cannot be disabled
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { notificationPrefs: true } });
        if (!user || !user.notificationPrefs) return true; // Default to allow
        try {
            const prefs = JSON.parse(user.notificationPrefs);
            // Default mappings based on preferences object keys
            // e.g. prefs: { social: true, communities: false }
            const key = category.toLowerCase();
            if (prefs[key] !== undefined) return prefs[key] === true;
        } catch {
            return true;
        }
        return true;
    }

    async createNotification(input: CreateNotificationInput) {
        if (!input.userId) return null;
        if (input.actorId && input.actorId === input.userId) return null; // Avoid self-notifications

        const category = this.getCategoryFromType(input.type);
        const shouldSend = await this.checkPreferences(input.userId, category);
        if (!shouldSend) return null;

        // Create the notification in the DB
        const notification = await this.prisma.notification.create({
            data: {
                userId: input.userId,
                type: input.type,
                priority: input.priority || 'NORMAL',
                title: input.title,
                message: input.message,
                link: input.link,
                entityType: input.entityType,
                entityId: input.entityId,
                actorId: input.actorId,
                metadata: input.metadata ? JSON.stringify(input.metadata) : null,
            },
        });

        // Email dispatch for high priority or specific settings
        if (input.priority === 'CRITICAL' || input.priority === 'HIGH') {
            const recipient = await this.prisma.user.findUnique({
                where: { id: input.userId },
                select: { email: true, username: true, emailVerified: true },
            });
            if (recipient?.email && recipient.emailVerified) {
                try {
                    await this.mailService.sendNotificationEmail(recipient.email, {
                        username: recipient.username,
                        title: input.title,
                        content: input.message,
                        link: input.link,
                    });
                } catch (error) {
                    this.logger.warn(`Email notification failed for ${recipient.email}: ${String(error)}`);
                }
            }
        }

        return notification;
    }

    async getNotifications(userId: string, query: { unreadOnly?: boolean; limit?: number; cursor?: string; category?: string }) {
        const limit = query.limit ? Math.min(query.limit, 50) : 20;

        let whereClause: any = { userId };

        if (query.unreadOnly) {
            whereClause.isRead = false;
        }

        if (query.category && query.category !== 'ALL') {
            whereClause.type = { startsWith: query.category.toUpperCase() + '_' };
        }

        const notifications = await this.prisma.notification.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: limit + 1, // one extra for pagination
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            include: {
                actor: {
                    select: { id: true, username: true, avatarUrl: true, isVerified: true }
                }
            }
        });

        let nextCursor: string | undefined = undefined;
        if (notifications.length > limit) {
            const nextItem = notifications.pop();
            nextCursor = nextItem!.id;
        }

        const formatted = notifications.map(n => ({
            id: n.id,
            type: n.type,
            category: this.getCategoryFromType(n.type),
            priority: n.priority,
            title: n.title,
            message: n.message,
            link: n.link,
            isRead: n.isRead,
            readAt: n.readAt,
            createdAt: n.createdAt,
            timeLabel: this.formatRelativeTime(n.createdAt),
            actor: n.actor,
            entityType: n.entityType,
            entityId: n.entityId,
            metadata: n.metadata ? JSON.parse(n.metadata) : null,
        }));

        return {
            items: formatted,
            nextCursor
        };
    }

    async countUnread(userId: string) {
        const count = await this.prisma.notification.count({
            where: { userId, isRead: false },
        });
        return { count };
    }

    async markAsRead(userId: string, notificationId: string) {
        await this.prisma.notification.updateMany({
            where: { id: notificationId, userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        return { success: true };
    }

    async markAllAsRead(userId: string, category?: string) {
        let whereClause: any = { userId, isRead: false };
        if (category && category !== 'ALL') {
            whereClause.type = { startsWith: category.toUpperCase() + '_' };
        }
        await this.prisma.notification.updateMany({
            where: whereClause,
            data: { isRead: true, readAt: new Date() },
        });
        return { success: true };
    }

    async deleteNotification(userId: string, notificationId: string) {
        const notif = await this.prisma.notification.findUnique({ where: { id: notificationId } });
        // Protect CRITICAL security notifications from being deleted
        if (notif?.userId === userId && notif.priority !== 'CRITICAL') {
            await this.prisma.notification.delete({ where: { id: notificationId } });
            return { success: true };
        }
        return { success: false };
    }

    // Preferences
    async getPreferences(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { notificationPrefs: true } });
        const defaultPrefs = { social: true, communities: true, markets: true, subscriptions: true, security: true };
        if (!user?.notificationPrefs) return defaultPrefs;
        try {
            return { ...defaultPrefs, ...JSON.parse(user.notificationPrefs) };
        } catch {
            return defaultPrefs;
        }
    }

    async updatePreferences(userId: string, prefs: any) {
        // Enforce security notifications are always true
        const updatedPrefs = { ...prefs, security: true };
        await this.prisma.user.update({
            where: { id: userId },
            data: { notificationPrefs: JSON.stringify(updatedPrefs) }
        });
        return updatedPrefs;
    }
}
