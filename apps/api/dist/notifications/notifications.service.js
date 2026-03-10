"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const mail_service_1 = require("../mail/mail.service");
const prisma_service_1 = require("../prisma.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, mailService) {
        this.prisma = prisma;
        this.mailService = mailService;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    formatRelativeTime(value) {
        const diffMs = Date.now() - value.getTime();
        const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
        if (diffMinutes < 1)
            return 'Hace instantes';
        if (diffMinutes < 60)
            return `Hace ${diffMinutes} min`;
        const diffHours = Math.round(diffMinutes / 60);
        if (diffHours < 24)
            return `Hace ${diffHours} h`;
        const diffDays = Math.round(diffHours / 24);
        if (diffDays < 7)
            return `Hace ${diffDays} d`;
        return value.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
        });
    }
    async createNotification(input) {
        if (!input.userId)
            return null;
        if (input.actorId && input.actorId === input.userId)
            return null;
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
            }
            catch (error) {
                this.logger.warn(`No se pudo enviar email de notificacion a ${recipient.email}: ${String(error)}`);
            }
        }
        return notification;
    }
    async getNotifications(userId) {
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
    async countUnread(userId) {
        const count = await this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
        return { count };
    }
    async markAllAsRead(userId) {
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
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map