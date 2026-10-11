export const NOTIFICATION_HISTORY_DAYS = 7;

export interface NotificationItem {
    id: string;
    type: string;
    category: string;
    priority: string;
    title: string;
    message?: string | null;
    link?: string | null;
    isRead: boolean;
    readAt?: string | null;
    timeLabel: string;
    createdAt: string;
    actor?: {
        id: string;
        username: string;
        avatarUrl?: string | null;
        isVerified?: boolean;
    } | null;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: any | null;
}

interface NotificationGroup {
    dateKey: string;
    label: string;
    items: NotificationItem[];
}

export const notificationTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function notificationDateKey(value: Date, timeZone = notificationTimezone()) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
    const part = (type: string) => parts.find(part => part.type === type)?.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
}

export function formatNotificationTime(value: string, timeZone = notificationTimezone()) {
    const date = new Date(value);
    if (!value || !Number.isFinite(date.getTime())) return 'Fecha no disponible';
    return new Intl.DateTimeFormat('es-AR', { timeZone, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
}

function formatDateLabel(value: Date, timeZone: string, now: Date) {
    // Compare local calendar days, independent of DST's 23/25-hour days.
    const today = Date.parse(notificationDateKey(now, timeZone) + 'T00:00:00Z');
    const target = Date.parse(notificationDateKey(value, timeZone) + 'T00:00:00Z');
    const diffDays = Math.round((today - target) / 86400000);
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    const label = value.toLocaleDateString('es-AR', { timeZone, weekday: 'long', day: '2-digit', month: 'short' });
    return label.charAt(0).toUpperCase() + label.slice(1);
}

export function groupNotificationsByDay(notifications: NotificationItem[], options: { timeZone?: string; now?: Date } = {}): NotificationGroup[] {
    const timeZone = options.timeZone || notificationTimezone();
    const now = options.now || new Date();
    const groups: NotificationGroup[] = [];
    const byDay = new Map<string, NotificationGroup>();

    for (const notification of notifications) {
        const createdAt = notification.createdAt ? new Date(notification.createdAt) : null;
        const hasValidDate = createdAt instanceof Date && !Number.isNaN(createdAt.getTime());
        const dateKey = hasValidDate ? notificationDateKey(createdAt, timeZone) : 'sin-fecha';
        const label = hasValidDate ? formatDateLabel(createdAt, timeZone, now) : 'Sin fecha';

        let group = byDay.get(dateKey);
        if (!group) {
            group = {
                dateKey,
                label,
                items: [],
            };
            byDay.set(dateKey, group);
            groups.push(group);
        }

        group.items.push(notification);
    }

    return groups;
}
