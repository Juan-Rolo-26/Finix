import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Heart, MessageSquare, TrendingUp, UserPlus, Repeat2, Loader2, CheckCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { NOTIFICATION_HISTORY_DAYS, type NotificationItem, groupNotificationsByDay } from '@/lib/notifications';

const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    follow: { icon: UserPlus, color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.1)' },
    like: { icon: Heart, color: 'hsl(0 68% 54%)', bg: 'hsl(0 68% 54% / 0.1)' },
    comment: { icon: MessageSquare, color: 'hsl(var(--brand))', bg: 'hsl(var(--brand) / 0.1)' },
    repost: { icon: Repeat2, color: 'hsl(145 65% 38%)', bg: 'hsl(145 65% 38% / 0.1)' },
    market: { icon: TrendingUp, color: 'hsl(38 88% 52%)', bg: 'hsl(38 88% 52% / 0.1)' },
    default: { icon: Bell, color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted) / 0.4)' },
};

const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.04, duration: 0.28, ease: 'easeOut' },
    } as const),
};

export default function Notifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await apiFetch(`/users/me/notifications?days=${NOTIFICATION_HISTORY_DAYS}`);
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(Array.isArray(data) ? data : []);
                    // Mark all as read
                    await apiFetch('/users/me/notifications/read-all', { method: 'PATCH' }).catch(() => { });
                }
            } catch {
                setNotifications([]);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const groups = groupNotificationsByDay(notifications);

    return (
        <div className="page-enter max-w-2xl mx-auto px-4 py-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Notificaciones</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Actividad de los últimos {NOTIFICATION_HISTORY_DAYS} días
                    </p>
                </div>
                {notifications.length > 0 && (
                    <button
                        className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.08)' }}
                    >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Marcar todo leído
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </div>
            ) : groups.length === 0 ? (
                <div className="empty-state py-20">
                    <div className="empty-state-icon">
                        <Bell className="w-7 h-7" />
                    </div>
                    <p className="text-[14.5px] font-semibold">Todo tranquilo por acá</p>
                    <p className="text-[13px] leading-relaxed max-w-[260px]"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Cuando alguien te siga, le guste tu publicación o te comente, lo verás aquí.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {groups.map((group, gi) => (
                        <div key={group.dateKey}>
                            <p className="section-label mb-2 px-1">{group.label}</p>
                            <div className="space-y-1">
                                {group.items.map((n, i) => {
                                    const cfg = iconMap[n.type] ?? iconMap.default;
                                    const Icon = cfg.icon;
                                    return (
                                        <motion.button
                                            key={n.id}
                                            custom={gi * 10 + i}
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="show"
                                            onClick={() => n.link && navigate(n.link)}
                                            className="w-full flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all text-left"
                                            style={{
                                                borderColor: 'hsl(var(--border) / 0.4)',
                                                background: 'hsl(var(--card) / 0.5)',
                                            }}
                                            onMouseEnter={e => {
                                                (e.currentTarget as HTMLElement).style.background = 'hsl(var(--card) / 0.9)';
                                                (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border) / 0.75)';
                                            }}
                                            onMouseLeave={e => {
                                                (e.currentTarget as HTMLElement).style.background = 'hsl(var(--card) / 0.5)';
                                                (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border) / 0.4)';
                                            }}
                                        >
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                                style={{ background: cfg.bg }}
                                            >
                                                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13.5px] font-medium leading-snug">{n.title}</p>
                                                {n.content && (
                                                    <p className="mt-0.5 text-[12px] leading-snug line-clamp-2"
                                                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                        {n.content}
                                                    </p>
                                                )}
                                                <span className="text-[11px] mt-1.5 inline-block font-semibold"
                                                    style={{ color: 'hsl(var(--primary) / 0.6)' }}>
                                                    {n.time}
                                                </span>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
