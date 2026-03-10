import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    Sun,
    Moon,
    Plus,
    User,
    Loader2,
    TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usePreferencesStore } from '../stores/preferencesStore';
import { apiFetch } from '../lib/api';

const PRIMARY = 'hsl(var(--primary))';

interface NotificationItem {
    id: string;
    type: string;
    title: string;
    content?: string | null;
    link?: string | null;
    isRead?: boolean;
    time: string;
}

export function MobileTopBar() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { theme, setTheme } = usePreferencesStore();

    const [unreadNotifs, setUnreadNotifs] = useState(0);
    const [isNotifsOpen, setIsNotifsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isNotifsLoading, setIsNotifsLoading] = useState(false);

    const isLight = theme === 'light' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

    const popoverStyle: React.CSSProperties = {
        background: 'hsl(var(--popover))',
        border: '1px solid hsl(var(--border))',
        color: 'hsl(var(--popover-foreground))',
    };

    useEffect(() => {
        if (isNotifsOpen) {
            const fetchNotifications = async () => {
                setIsNotifsLoading(true);
                try {
                    const res = await apiFetch('/users/me/notifications');
                    const data = res.ok ? await res.json() : [];
                    setNotifications(Array.isArray(data) ? data : []);

                    const readRes = await apiFetch('/users/me/notifications/read-all', {
                        method: 'PATCH',
                    });
                    if (readRes.ok) {
                        setUnreadNotifs(0);
                    }
                } catch {
                    setNotifications([]);
                } finally {
                    setIsNotifsLoading(false);
                }
            };

            fetchNotifications();
        }
    }, [isNotifsOpen]);

    useEffect(() => {
        const loadUnreadCount = async () => {
            try {
                const res = await apiFetch('/users/me/notifications/unread-count');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadNotifs(data.count ?? 0);
                }
            } catch { }
        };

        loadUnreadCount();
        const iv = setInterval(loadUnreadCount, 30_000);
        return () => clearInterval(iv);
    }, []);

    const handleNotificationClick = (notification: NotificationItem) => {
        if (notification.link) {
            navigate(notification.link);
        }
        setIsNotifsOpen(false);
    };

    return (
        <div
            className="fixed top-0 left-0 right-0 z-50 lg:hidden flex items-center justify-between px-4"
            style={{
                height: '52px',
                background: 'hsl(var(--sidebar-bg))',
                borderBottom: '1px solid hsl(var(--sidebar-border))',
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-2" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                <div
                    className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                        background: `linear-gradient(135deg, hsl(var(--sidebar-logo-bg-from)) 0%, hsl(var(--sidebar-logo-bg-to)) 100%)`,
                        border: `1px solid hsl(var(--sidebar-logo-border))`,
                        boxShadow: `0 0 12px hsl(var(--primary) / 0.2)`,
                    }}
                >
                    <img src="/logo.png" alt="Finix" className="h-5 w-5 object-contain" />
                </div>
                <span
                    className="text-[17px] font-black tracking-[0.12em] uppercase"
                    style={{ color: 'hsl(var(--foreground))' }}
                >
                    FINIX
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                {/* Theme toggle */}
                <button
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    onClick={() => setTheme(isLight ? 'dark' : 'light')}
                >
                    {isLight ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
                </button>

                {/* Create post */}
                <button
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    onClick={() => navigate('/explore?create=true')}
                >
                    <Plus className="w-[18px] h-[18px]" />
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors relative"
                        style={{
                            color: isNotifsOpen ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                            background: isNotifsOpen ? 'hsl(var(--muted))' : 'transparent',
                        }}
                        onClick={() => setIsNotifsOpen(v => !v)}
                    >
                        <Bell className="w-[18px] h-[18px]" />
                        {unreadNotifs > 0 && (
                            <span
                                className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full text-[8px] font-bold flex items-center justify-center pointer-events-none px-1"
                                style={{ background: PRIMARY, color: 'hsl(var(--primary-foreground))' }}
                            >
                                {unreadNotifs > 9 ? '9+' : unreadNotifs}
                            </span>
                        )}
                    </button>

                    <AnimatePresence>
                        {isNotifsOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsNotifsOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    transition={{ duration: 0.18 }}
                                    className="absolute top-11 right-0 w-[300px] rounded-2xl shadow-2xl overflow-hidden z-50"
                                    style={popoverStyle}
                                >
                                    <div
                                        className="px-4 py-3 flex items-center justify-between"
                                        style={{ borderBottom: '1px solid hsl(var(--border))' }}
                                    >
                                        <h3 className="font-bold text-sm">Notificaciones</h3>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                                        {isNotifsLoading ? (
                                            <div className="flex justify-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            </div>
                                        ) : notifications.length > 0 ? (
                                            notifications.map((n, i) => (
                                                <div
                                                    key={n.id || i}
                                                    className="flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors"
                                                    style={{ borderBottom: i < notifications.length - 1 ? '1px solid hsl(var(--border) / 0.4)' : 'none' }}
                                                    onClick={() => handleNotificationClick(n)}
                                                >
                                                    <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                                                        style={{ background: n.type === 'follow' ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary))' }}>
                                                        {n.type === 'follow'
                                                            ? <User className="w-4 h-4" style={{ color: PRIMARY }} />
                                                            : <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                        }
                                                    </div>
                                                    <div className="flex-1 text-[12px] leading-snug">
                                                        <p className="font-medium">{n.title}</p>
                                                        {n.content && (
                                                            <p className="mt-1 text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                                {n.content}
                                                            </p>
                                                        )}
                                                        <span className="text-[10px] mt-1 inline-block font-bold" style={{ color: 'hsl(var(--primary) / 0.7)' }}>
                                                            {n.time}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 px-4">
                                                <Bell className="w-7 h-7 mx-auto mb-2" style={{ color: 'hsl(var(--muted-foreground) / 0.3)' }} />
                                                <p className="text-sm font-semibold">Sin notificaciones</p>
                                                <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Aqui veras seguidores, likes, comentarios y actividad relevante.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Avatar → profile */}
                <button
                    className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 ml-1"
                    style={{
                        background: `linear-gradient(135deg, ${PRIMARY} 0%, hsl(var(--primary) / 0.7) 100%)`,
                        boxShadow: `0 0 10px hsl(var(--primary) / 0.3)`,
                        color: 'hsl(var(--primary-foreground))',
                        fontSize: '13px',
                        fontWeight: 800,
                    }}
                    onClick={() => navigate('/profile')}
                >
                    {user?.username?.[0]?.toUpperCase() || 'F'}
                </button>
            </div>
        </div>
    );
}
