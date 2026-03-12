export const NOTIFICATION_HISTORY_DAYS = 7;

export interface NotificationItem {
    id: string;
    type: string;
    title: string;
    content?: string | null;
    link?: string | null;
    isRead?: boolean;
    time: string;
    createdAt?: string;
    dateKey?: string;
    dateLabel?: string;
}

interface NotificationGroup {
    dateKey: string;
    label: string;
    items: NotificationItem[];
}

function formatDateKey(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatDateLabel(value: Date) {
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

export function groupNotificationsByDay(notifications: NotificationItem[]): NotificationGroup[] {
    const groups: NotificationGroup[] = [];
    const byDay = new Map<string, NotificationGroup>();

    for (const notification of notifications) {
        const createdAt = notification.createdAt ? new Date(notification.createdAt) : null;
        const hasValidDate = createdAt instanceof Date && !Number.isNaN(createdAt.getTime());
        const dateKey = notification.dateKey || (hasValidDate ? formatDateKey(createdAt) : 'sin-fecha');
        const label = notification.dateLabel || (hasValidDate ? formatDateLabel(createdAt) : 'Sin fecha');

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
