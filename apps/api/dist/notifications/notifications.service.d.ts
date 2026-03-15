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
export declare class NotificationsService {
    private prisma;
    private mailService;
    private readonly logger;
    constructor(prisma: PrismaService, mailService: MailService);
    private formatRelativeTime;
    private formatDateKey;
    private formatHistoryDate;
    private resolveHistoryStart;
    createNotification(input: CreateNotificationInput): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        link: string | null;
        type: string;
        content: string | null;
        userId: string;
        isRead: boolean;
    }>;
    getNotifications(userId: string, input?: GetNotificationsInput): Promise<{
        id: string;
        type: string;
        title: string;
        content: string;
        link: string;
        isRead: boolean;
        time: string;
        createdAt: Date;
        dateKey: string;
        dateLabel: string;
    }[]>;
    countUnread(userId: string): Promise<{
        count: number;
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
    }>;
}
export {};
