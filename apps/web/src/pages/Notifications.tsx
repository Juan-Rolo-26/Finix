import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Heart, MessageSquare, TrendingUp, UserPlus, Loader2, CheckCheck, Settings, ShieldAlert, Sparkles, Building2, Repeat } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { type NotificationItem, groupNotificationsByDay } from '@/lib/notifications';

const CATEGORIES = [
    { id: 'ALL', label: 'Todas' },
    { id: 'UNREAD', label: 'No leídas' },
    { id: 'SOCIAL', label: 'Social' },
    { id: 'COMMUNITY', label: 'Comunidades' },
    { id: 'MARKET', label: 'Mercados' },
    { id: 'SYSTEM', label: 'Sistema' },
];

const getNotificationConfig = (type: string) => {
    if (type.startsWith('SOCIAL_FOLLOW')) return { icon: UserPlus, color: 'var(--primary)', bg: 'var(--primary) / 0.1' };
    if (type.startsWith('SOCIAL_LIKE')) return { icon: Heart, color: 'hsl(0 68% 54%)', bg: 'hsl(0 68% 54% / 0.1)' };
    if (type.startsWith('SOCIAL_COMMENT') || type.startsWith('SOCIAL_REPLY')) return { icon: MessageSquare, color: 'hsl(145 65% 38%)', bg: 'hsl(145 65% 38% / 0.1)' };
    if (type.startsWith('SOCIAL_REPOST')) return { icon: Repeat, color: 'hsl(280 65% 58%)', bg: 'hsl(280 65% 58% / 0.1)' };
    if (type.startsWith('COMMUNITY_')) return { icon: Building2, color: 'hsl(280 65% 58%)', bg: 'hsl(280 65% 58% / 0.1)' };
    if (type.startsWith('MARKET_')) return { icon: TrendingUp, color: 'hsl(38 88% 52%)', bg: 'hsl(38 88% 52% / 0.1)' };
    if (type.startsWith('SECURITY_')) return { icon: ShieldAlert, color: 'hsl(0 80% 50%)', bg: 'hsl(0 80% 50% / 0.1)' };
    if (type.startsWith('SUBSCRIPTION_')) return { icon: Sparkles, color: 'hsl(var(--brand))', bg: 'hsl(var(--brand) / 0.1)' };
    return { icon: Bell, color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted) / 0.4)' };
};

const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.03, 0.3), duration: 0.28, ease: 'easeOut' as const } }),
};

export default function Notifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL');
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isMarkingRead, setIsMarkingRead] = useState(false);
    const loadSequence = useRef(0);

    const loadNotifications = async (cursor?: string | null, tab = activeTab) => {
        const sequence = ++loadSequence.current;
        try {
            setError('');
            const isInitial = !cursor;
            if (isInitial) setIsLoading(true);
            else setIsLoadingMore(true);

            let url = `/notifications?limit=20`;
            if (tab === 'UNREAD') url += '&unreadOnly=true';
            else if (tab !== 'ALL') url += `&category=${tab}`;
            if (cursor) url += `&cursor=${cursor}`;

            const res = await apiFetch(url);
            if (!res.ok) throw new Error('No se pudieron cargar las notificaciones.');
            const data = await res.json();
            if (!Array.isArray(data?.items)) throw new Error('No se pudieron cargar las notificaciones.');
            if (sequence === loadSequence.current) {
                if (isInitial) {
                    setNotifications(data.items);
                } else {
                    setNotifications(prev => [...prev, ...data.items]);
                }
                setNextCursor(data.nextCursor || null);
            }
        } catch {
            if (sequence === loadSequence.current) setError('No se pudieron cargar las notificaciones. Intentá nuevamente.');
        } finally {
            if (sequence === loadSequence.current) {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        }
    };

    useEffect(() => {
        setNotifications([]);
        setNextCursor(null);
        loadNotifications(null, activeTab);
        return () => { loadSequence.current++; };
    }, [activeTab]);

    const handleMarkAllRead = async () => {
        if (isMarkingRead) return;
        const ids = new Set(notifications.map(n => n.id));
        setIsMarkingRead(true);
        setError('');
        try {
            let body: any = {};
            if (activeTab !== 'ALL' && activeTab !== 'UNREAD') {
                body.category = activeTab;
            }
            const response = await apiFetch('/notifications/read-all', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
            });
            if (!response.ok) throw new Error('No se pudieron marcar las notificaciones como leídas.');
            setNotifications(prev => prev.map(n => ids.has(n.id) ? { ...n, isRead: true } : n));
            window.dispatchEvent(new Event('finix:unread-refresh'));
        } catch {
            setError('No se pudieron marcar las notificaciones como leídas. Intentá nuevamente.');
        } finally { setIsMarkingRead(false); }
    };

    const handleNotificationClick = async (n: NotificationItem) => {
        if (!n.isRead) {
            try {
                const response = await apiFetch(`/notifications/${n.id}/read`, { method: 'PATCH' });
                if (!response.ok) throw new Error('No se pudo guardar la lectura.');
                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
                window.dispatchEvent(new Event('finix:unread-refresh'));
            } catch { setError('No se pudo marcar la notificación como leída. Intentá nuevamente.'); }
        }
        if (n.link) navigate(n.link);
    };

    const groups = groupNotificationsByDay(notifications);

    return (
        <div className="page-enter max-w-3xl mx-auto px-0 md:px-4 py-0 md:py-8 w-full flex flex-col min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-30 pt-4 pb-3 px-4 md:px-0 md:pt-0" style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-[22px] font-black tracking-tight flex items-center gap-2">
                            Notificaciones
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {notifications.length > 0 && notifications.some(n => !n.isRead) && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={isMarkingRead}
                                className="w-8 h-8 md:w-auto md:px-3 md:h-9 flex items-center justify-center gap-2 rounded-xl transition-all"
                                style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.1)' }}
                                title="Marcar leídas"
                            >
                                <CheckCheck className="w-4 h-4" />
                                <span className="hidden md:block text-[13px] font-bold">Leídas</span>
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/settings?tab=notifications')}
                            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl transition-all hover:bg-secondary"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Tabs / Filters */}
                <div className="desktop-filter-bar flex items-center gap-2 overflow-x-auto scb-hidden pb-1 -mx-4 px-4 md:mx-0 md:px-0">
                    {CATEGORIES.map(c => {
                        const isActive = activeTab === c.id;
                        return (
                            <button
                                key={c.id}
                                onClick={() => setActiveTab(c.id)}
                                aria-pressed={isActive}
                                className="relative px-3.5 py-1.5 rounded-full text-[13px] font-semibold flex-shrink-0 transition-colors z-10"
                                style={{
                                    color: isActive ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                                }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="notif-tab"
                                        className="absolute inset-0 rounded-full -z-10"
                                        style={{ background: 'hsl(var(--primary))' }}
                                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                                    />
                                )}
                                {c.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 px-4 md:px-0 mt-4 pb-20">
                {error && <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    <span>{error}</span>
                    <button type="button" className="underline" onClick={() => void loadNotifications(null, activeTab)}>Reintentar</button>
                </div>}
                {isLoading ? (
                    <div className="flex justify-center items-center py-32">
                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    </div>
                ) : groups.length === 0 && !error ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4" style={{ background: 'hsl(var(--muted) / 0.5)' }}>
                            <Bell className="w-7 h-7" style={{ color: 'hsl(var(--muted-foreground))' }} />
                        </div>
                        <h3 className="text-base font-bold mb-1">Todo al día</h3>
                        <p className="text-[13.5px] max-w-[280px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            No hay notificaciones recientes en esta categoría.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groups.map((group, gi) => (
                            <div key={group.dateKey}>
                                <p className="mb-2.5 px-2 text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    {group.label}
                                </p>
                                <div className="space-y-1 md:space-y-2">
                                    {group.items.map((n, i) => {
                                        const cfg = getNotificationConfig(n.type);
                                        const Icon = cfg.icon;
                                        const isUnread = !n.isRead;

                                        return (
                                            <motion.button
                                                key={n.id}
                                                custom={gi * 10 + i}
                                                variants={cardVariants}
                                                initial="hidden"
                                                animate="show"
                                                onClick={() => handleNotificationClick(n)}
                                                className="w-full flex gap-3.5 p-3.5 md:p-4 rounded-2xl md:rounded-3xl border transition-all text-left relative group overflow-hidden"
                                                style={{
                                                    borderColor: isUnread ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border) / 0.3)',
                                                    background: isUnread ? 'hsl(var(--primary) / 0.03)' : 'hsl(var(--card) / 0.3)',
                                                }}
                                            >
                                                {/* Hover effect */}
                                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                                {/* Actor Avatar or Icon */}
                                                <div className="relative shrink-0">
                                                    {n.actor?.avatarUrl ? (
                                                        <div className="w-11 h-11 rounded-full overflow-hidden border border-border">
                                                            <img src={resolveMediaUrl(n.actor.avatarUrl)} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="w-11 h-11 rounded-full flex items-center justify-center"
                                                            style={{ background: `hsl(${cfg.bg})` }}
                                                        >
                                                            <Icon className="w-5 h-5" style={{ color: `hsl(${cfg.color})` }} />
                                                        </div>
                                                    )}

                                                    {/* Small type icon badge if there's an avatar */}
                                                    {n.actor && (
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2"
                                                            style={{ background: `hsl(${cfg.color})`, borderColor: 'hsl(var(--card))' }}
                                                        >
                                                            <Icon className="w-2.5 h-2.5 text-white" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0 pr-6">
                                                    <p className="text-[14px] font-semibold leading-[1.3] mb-0.5" style={{ color: isUnread ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                                                        {n.title}
                                                    </p>
                                                    {n.message && (
                                                        <p className="text-[13px] leading-snug line-clamp-2"
                                                            style={{ color: 'hsl(var(--muted-foreground) / 0.8)' }}>
                                                            {n.message}
                                                        </p>
                                                    )}
                                                    <span className="text-[11px] mt-1.5 inline-block font-semibold"
                                                        style={{ color: isUnread ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.6)' }}>
                                                        {n.timeLabel}
                                                    </span>
                                                </div>

                                                {isUnread && (
                                                    <span className="absolute top-1/2 -mt-1 right-4 w-2 h-2 rounded-full" style={{ background: 'hsl(var(--primary))' }} />
                                                )}

                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {nextCursor && !isLoading && (
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={() => loadNotifications(nextCursor)}
                            disabled={isLoadingMore}
                            className="text-[13px] font-bold px-6 py-2.5 rounded-full transition-all"
                            style={{
                                color: 'hsl(var(--foreground))',
                                background: 'hsl(var(--secondary))',
                                opacity: isLoadingMore ? 0.7 : 1
                            }}
                        >
                            {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Cargar historial'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
