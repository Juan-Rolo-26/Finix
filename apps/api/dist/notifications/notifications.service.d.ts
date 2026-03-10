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
export declare class NotificationsService {
    private prisma;
    private mailService;
    private readonly logger;
    constructor(prisma: PrismaService, mailService: MailService);
    private formatRelativeTime;
    createNotification(input: CreateNotificationInput): Promise<{
        id: string;
        type: string;
        title: string;
        content: string | null;
        isRead: boolean;
        link: string | null;
        createdAt: Date;
        userId: string;
    }>;
    getNotifications(userId: string): Promise<{
        id: string;
        type: string;
        title: string;
        content: string;
        link: string;
        isRead: boolean;
        time: string;
        createdAt: Date;
    }[]>;
    countUnread(userId: string): Promise<{
        count: number;
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
    }>;
}
export {};
