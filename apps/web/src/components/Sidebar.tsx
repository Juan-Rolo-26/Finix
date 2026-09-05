import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ComponentType } from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    User,
    TrendingUp,
    MessageSquare,
    Bell,
    Search,
    Plus,
    Compass,
    ChevronRight,
    Loader2,
    Sun,
    Moon,
    Users,
    Newspaper,
    Briefcase,
    PanelLeftClose,
    PanelLeftOpen,
    CheckCheck,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { NOTIFICATION_HISTORY_DAYS, type NotificationItem, groupNotificationsByDay } from '../lib/notifications';
import { usePreferencesStore } from '../stores/preferencesStore';

/* ─── Brand token ─────────────────────────────────────────────── */
const PRIMARY = 'hsl(var(--primary))';
const PRIMARY_BRD = 'hsl(var(--primary) / 0.2)';

interface PinnedAsset {
    ticker: string;
    change: number;
    changePercent: number;
    price: number;
}

interface SidebarNavLinkProps {
    name: string;
    path: string;
    icon: ComponentType<{ className?: string }>;
    badge: number;
    active: boolean;
    hovered: boolean;
    collapsed: boolean;
    onHoverStart: (path: string) => void;
    onHoverEnd: () => void;
}

function SidebarNavLink({
    name,
    path,
    icon: Icon,
    badge,
    active,
    hovered,
    collapsed,
    onHoverStart,
    onHoverEnd,
}: SidebarNavLinkProps) {
    return (
        <Link
            to={path}
            title={collapsed ? name : undefined}
            onMouseEnter={() => onHoverStart(path)}
            onMouseLeave={onHoverEnd}
            className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-200 select-none overflow-hidden"
            style={{
                color: active
                    ? PRIMARY
                    : hovered
                        ? 'hsl(var(--foreground))'
                        : 'hsl(var(--muted-foreground))',
                justifyContent: collapsed ? 'center' : undefined,
            }}
        >
            {active && (
                <motion.div
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 rounded-xl"
                    style={{
                        background: 'linear-gradient(90deg, hsl(var(--sidebar-active-bg-from)) 0%, hsl(var(--sidebar-active-bg-to)) 100%)',
                        border: '1px solid hsl(var(--sidebar-active-border))',
                    }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                />
            )}
            {hovered && !active && (
                <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{
                        background: 'hsl(var(--sidebar-hover-bg))',
                        border: '1px solid hsl(var(--sidebar-hover-border))',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                />
            )}
            <div className="relative z-10 flex items-center gap-3 w-full" style={{ justifyContent: collapsed ? 'center' : undefined }}>
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && (
                    <>
                        <span className="flex-1 leading-none">{name}</span>
                        {badge > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1"
                                style={{ background: PRIMARY, color: 'hsl(var(--primary-foreground))' }}
                            >
                                {badge > 9 ? '9+' : badge}
                            </motion.span>
                        )}
                    </>
                )}
                {collapsed && badge > 0 && (
                    <span
                        className="absolute top-0 right-0 w-2 h-2 rounded-full"
                        style={{ background: PRIMARY }}
                    />
                )}
            </div>
        </Link>
    );
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
    if (collapsed) return <div className="h-px mx-2 my-3" style={{ background: 'hsl(var(--border) / 0.5)' }} />;
    return (
        <p
            className="mb-1.5 px-3 pt-1 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: 'hsl(var(--sidebar-section-label))' }}
        >
            {label}
        </p>
    );
}

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();
    const { theme, setTheme, sidebarCollapsed: collapsed, toggleSidebar: setCollapsed } = usePreferencesStore();
    const [hov, setHov] = useState<string | null>(null);
    const [unreadMsgs, setUnreadMsgs] = useState(0);
    const [unreadNotifs, setUnreadNotifs] = useState(0);
    const [pinnedAssets, setPinnedAssets] = useState<PinnedAsset[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotifsOpen, setIsNotifsOpen] = useState(false);
    const [isSearchLoading, setIsSearchLoading] = useState(false);

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isNotifsLoading, setIsNotifsLoading] = useState(false);

    const isLight = theme === 'light' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

    /* ── Fetch search results ─────────────────────────────────── */
    useEffect(() => {
        if (searchQuery.length < 2) { setSearchResults([]); return; }
        setIsSearchLoading(true);
        const t = setTimeout(() => {
            apiFetch(`/users/search?q=${searchQuery}`)
                .then(r => r.json())
                .then(d => setSearchResults(Array.isArray(d) ? d : []))
                .catch(() => setSearchResults([]))
                .finally(() => setIsSearchLoading(false));
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    /* ── Fetch notifications ──────────────────────────────────── */
    useEffect(() => {
        if (!isNotifsOpen) return;
        const fetchNotifs = async () => {
            setIsNotifsLoading(true);
            try {
                const res = await apiFetch(`/notifications?limit=25`);
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.items || []);
                    await apiFetch('/notifications/read-all', { method: 'PATCH' });
                    setUnreadNotifs(0);
                }
            } catch {
                setNotifications([]);
            } finally {
                setIsNotifsLoading(false);
            }
        };
        fetchNotifs();
    }, [isNotifsOpen]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await apiFetch('/notifications/unread-count');
                if (res.ok) { const d = await res.json(); setUnreadNotifs(d.count ?? 0); }
            } catch { }
        };
        load();
        const iv = setInterval(load, 30_000);
        return () => clearInterval(iv);
    }, []);

    /* ── Poll unread messages ─────────────────────────────────── */
    useEffect(() => {
        const load = async () => {
            try {
                const res = await apiFetch('/messages/unread-count');
                if (res.ok) { const d = await res.json(); setUnreadMsgs(d.count ?? 0); }
            } catch { }
        };
        load();
        const iv = setInterval(load, 30_000);
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        if (location.pathname === '/messages') setUnreadMsgs(0);
    }, [location.pathname]);

    /* ── Fetch pinned assets ──────────────────────────────────── */
    useEffect(() => {
        if (collapsed) return;
        const load = async () => {
            try {
                const res = await apiFetch('/portfolios/watchlists');
                if (!res.ok) return;
                const d = await res.json();
                const pinned = d.find((w: any) => w.name === '__pinned__');
                if (pinned?.tickers) {
                    const tcks = pinned.tickers.split(',').filter(Boolean).slice(0, 3);
                    const quotes = await Promise.all(tcks.map(async (t: string) => {
                        try {
                            const qRes = await apiFetch(`/market/quote?symbol=${t}`);
                            if (qRes.ok) {
                                const q = await qRes.json();
                                return {
                                    ticker: t,
                                    change: q.change ?? q.regularMarketChange ?? 0,
                                    changePercent: q.changePercent ?? q.regularMarketChangePercent ?? 0,
                                    price: q.price ?? q.regularMarketPrice ?? 0,
                                };
                            }
                        } catch { }
                        return null;
                    }));
                    setPinnedAssets(quotes.filter(Boolean) as PinnedAsset[]);
                }
            } catch { }
        };
        load();
        const iv = setInterval(load, 60_000);
        return () => clearInterval(iv);
    }, [collapsed]);

    const isActive = (p: string) =>
        location.pathname === p ||
        (p !== '/dashboard' && location.pathname.startsWith(`${p}/`));

    const sections = [
        {
            label: 'Social',
            links: [
                { name: 'Inicio', path: '/dashboard', icon: LayoutDashboard, badge: 0 },
                { name: 'Explorar', path: '/explore', icon: Compass, badge: 0 },
                { name: 'Comunidades', path: '/comunidades', icon: Users, badge: 0 },
                { name: 'Mensajes', path: '/messages', icon: MessageSquare, badge: unreadMsgs },
                { name: 'Noticias', path: '/news', icon: Newspaper, badge: 0 },
            ],
        },
        {
            label: 'Finanzas',
            links: [
                { name: 'Mercado', path: '/market', icon: TrendingUp, badge: 0 },
                { name: 'Portafolio', path: '/portfolio', icon: Briefcase, badge: 0 },
                // { name: 'Aprender', path: '/learn', icon: BookOpen, badge: 0 },
            ],
        },
        {
            label: 'Mi Cuenta',
            links: [
                { name: 'Perfil', path: '/profile', icon: User, badge: 0 },
                { name: 'Notificaciones', path: '/notifications', icon: Bell, badge: unreadNotifs },
                { name: 'Configuraciones', path: '/settings', icon: Settings, badge: 0 },
            ],
        },
    ];

    const popoverStyle: React.CSSProperties = {
        background: 'hsl(var(--popover))',
        border: '1px solid hsl(var(--border))',
        color: 'hsl(var(--popover-foreground))',
        boxShadow: 'var(--shadow-elevated)',
    };

    const toggleTheme = () => setTheme(isLight ? 'dark' : 'light');

    const notificationGroups = groupNotificationsByDay(notifications);

    const sidebarWidth = collapsed ? '72px' : '276px';

    return (
        <motion.aside
            initial={{ x: -12, opacity: 0 }}
            animate={{ x: 0, opacity: 1, width: sidebarWidth }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed left-0 top-0 z-40 hidden lg:flex h-screen flex-col"
            style={{
                width: sidebarWidth,
                background: 'hsl(var(--sidebar-bg))',
                borderRight: '1px solid hsl(var(--sidebar-border))',
                transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            {/* Subtle top glow */}
            <div className="pointer-events-none absolute top-0 left-0 w-full h-36"
                style={{ background: 'var(--sidebar-top-glow)' }}
            />

            {/* ── LOGO ─────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer"
                    style={{
                        background: `linear-gradient(135deg, hsl(var(--sidebar-logo-bg-from)) 0%, hsl(var(--sidebar-logo-bg-to)) 100%)`,
                        border: `1px solid hsl(var(--sidebar-logo-border))`,
                        boxShadow: `0 0 14px hsl(var(--primary) / 0.15)`,
                    }}
                    onClick={() => navigate('/dashboard')}
                >
                    <img src="/logo.png" alt="Finix" className="h-5 w-5 object-contain" />
                </div>

                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="leading-none flex-1 min-w-0"
                    >
                        <p className="text-[17px] font-black tracking-[0.1em] uppercase"
                            style={{ color: 'hsl(var(--foreground))' }}>
                            FINIX
                        </p>
                        <p className="text-[9px] font-bold tracking-[0.24em] uppercase mt-0.5"
                            style={{ color: `hsl(var(--sidebar-logo-subtitle))` }}>
                            Red Social
                        </p>
                    </motion.div>
                )}

                {/* Header actions */}
                {!collapsed && (
                    <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
                        {/* Theme toggle */}
                        <button
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            onClick={toggleTheme}
                            title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                        >
                            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                        </button>

                        {/* Search */}
                        <div className="relative">
                            <button
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                style={{
                                    color: isSearchOpen ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                                    background: isSearchOpen ? 'hsl(var(--muted))' : 'transparent',
                                }}
                                onClick={() => { setIsSearchOpen(!isSearchOpen); setIsNotifsOpen(false); }}
                                title="Buscar"
                            >
                                <Search className="w-3.5 h-3.5" />
                            </button>
                            <AnimatePresence>
                                {isSearchOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                        className="absolute top-10 left-0 w-[264px] rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
                                        style={popoverStyle}
                                        transition={{ duration: 0.16 }}
                                    >
                                        <div className="relative mb-2">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                                                style={{ color: 'hsl(var(--muted-foreground))' }} />
                                            <input
                                                type="text"
                                                placeholder="Buscar personas, activos, temas..."
                                                className="w-full text-[13px] pl-8 pr-3 py-2 rounded-xl outline-none"
                                                style={{
                                                    background: 'hsl(var(--secondary))',
                                                    color: 'hsl(var(--foreground))',
                                                    border: '1px solid hsl(var(--border))',
                                                }}
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-60 overflow-y-auto space-y-0.5">
                                            {isSearchLoading ? (
                                                <div className="flex justify-center py-4">
                                                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                                </div>
                                            ) : searchResults.length > 0 ? (
                                                searchResults.map(u => (
                                                    <button
                                                        key={u.id}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors text-left"
                                                        onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--secondary))')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                        onClick={() => { navigate(`/profile/${u.username}`); setIsSearchOpen(false); setSearchQuery(''); }}
                                                    >
                                                        <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                                                            style={{ background: 'hsl(var(--primary) / 0.12)' }}>
                                                            {u.avatarUrl
                                                                ? <img src={resolveMediaUrl(u.avatarUrl)} alt={u.username} className="w-full h-full object-cover" />
                                                                : <User className="w-4 h-4" style={{ color: PRIMARY }} />
                                                            }
                                                        </div>
                                                        <div className="flex-1 min-w-0 text-left">
                                                            <div className="flex items-center gap-1">
                                                                <p className="text-[13px] font-semibold truncate">{u.username}</p>
                                                                {u.isVerified && (
                                                                    <span className="verified-badge">✓</span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                                {u.title || u.company || 'Ver perfil →'}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : searchQuery.length >= 2 ? (
                                                <div className="empty-state py-6">
                                                    <p className="text-[13px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                        Sin resultados para "{searchQuery}"
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-[12px] text-center py-4 leading-relaxed px-3"
                                                    style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                    Busca personas, activos o temas de interés
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors relative"
                                style={{
                                    color: isNotifsOpen ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                                    background: isNotifsOpen ? 'hsl(var(--muted))' : 'transparent',
                                }}
                                onClick={() => { setIsNotifsOpen(!isNotifsOpen); setIsSearchOpen(false); }}
                                title="Notificaciones"
                            >
                                <Bell className="w-3.5 h-3.5" />
                                {unreadNotifs > 0 && (
                                    <span
                                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full pulse-dot"
                                        style={{ background: PRIMARY }}
                                    />
                                )}
                            </button>
                            <AnimatePresence>
                                {isNotifsOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                        className="absolute top-10 left-0 w-[300px] rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-left"
                                        style={popoverStyle}
                                        transition={{ duration: 0.16 }}
                                    >
                                        <div className="px-4 py-3 flex items-center justify-between sticky top-0 z-10"
                                            style={{ background: 'hsl(var(--popover))', borderBottom: '1px solid hsl(var(--border) / 0.6)' }}>
                                            <div>
                                                <h3 className="font-semibold text-[13.5px]">Notificaciones</h3>
                                                <p className="text-[10.5px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                    Últimos {NOTIFICATION_HISTORY_DAYS} días
                                                </p>
                                            </div>
                                            {notifications.length > 0 && (
                                                <button
                                                    className="flex items-center gap-1 text-[11px] font-medium transition-colors"
                                                    style={{ color: 'hsl(var(--primary) / 0.7)' }}
                                                    onMouseEnter={e => (e.currentTarget.style.color = PRIMARY)}
                                                    onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--primary) / 0.7)')}
                                                >
                                                    <CheckCheck className="w-3.5 h-3.5" />
                                                    Leer todo
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
                                            {isNotifsLoading ? (
                                                <div className="flex justify-center py-6">
                                                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                                </div>
                                            ) : notificationGroups.length > 0 ? (
                                                notificationGroups.map((group) => (
                                                    <div key={group.dateKey} className="space-y-0.5">
                                                        <p className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                                                            style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                            {group.label}
                                                        </p>
                                                        {group.items.map((n) => (
                                                            <button
                                                                key={n.id}
                                                                className="w-full flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors text-left"
                                                                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--secondary))')}
                                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                                onClick={() => { if (n.link) navigate(n.link); setIsNotifsOpen(false); }}
                                                            >
                                                                <div
                                                                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                                                                    style={{
                                                                        background: n.type === 'follow' ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--secondary))',
                                                                    }}
                                                                >
                                                                    {n.type === 'follow'
                                                                        ? <User className="w-4 h-4" style={{ color: PRIMARY }} />
                                                                        : <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                                                    }
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[12.5px] font-medium leading-snug">{n.title}</p>
                                                                    {n.message && (
                                                                        <p className="mt-0.5 text-[11px] leading-snug truncate"
                                                                            style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                                            {n.message}
                                                                        </p>
                                                                    )}
                                                                    <span className="text-[10px] mt-1 inline-block font-semibold"
                                                                        style={{ color: 'hsl(var(--primary) / 0.65)' }}>
                                                                        {n.timeLabel}
                                                                    </span>
                                                                </div>
                                                                {n.link && <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-1"
                                                                    style={{ color: 'hsl(var(--muted-foreground))' }} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty-state py-8">
                                                    <div className="empty-state-icon">
                                                        <Bell className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-[13px] font-semibold">Sin notificaciones</p>
                                                    <p className="text-[11.5px] leading-relaxed max-w-[200px]"
                                                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                        Acá verás seguidores, likes y actividad relevante
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>

            {/* ── CREATE POST BUTTON ──────────────────────── */}
            <div className="px-3 pt-3 flex-shrink-0">
                <button
                    onClick={() => navigate('/explore?create=true')}
                    className="w-full flex items-center gap-2.5 rounded-xl font-semibold text-[13px] transition-all group btn-primary-glow"
                    style={{
                        background: `linear-gradient(135deg, ${PRIMARY} 0%, hsl(var(--primary) / 0.72) 100%)`,
                        color: 'hsl(var(--primary-foreground))',
                        padding: collapsed ? '10px' : '10px 14px',
                        justifyContent: collapsed ? 'center' : undefined,
                    }}
                >
                    <Plus className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="flex-1">Crear publicación</span>}
                </button>
            </div>

            {/* ── NAV ─────────────────────────────────────── */}
            <motion.nav
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.025, delayChildren: 0.08 } } }}
                className="flex-1 px-3 py-3 space-y-3 overflow-y-auto overflow-x-hidden scrollbar-hide"
            >
                {sections.map((section) => (
                    <motion.div
                        key={section.label}
                        variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.24 } } }}
                    >
                        <SectionLabel label={section.label} collapsed={collapsed} />
                        <div className="space-y-0.5">
                            {section.links.map((link) => (
                                <SidebarNavLink
                                    key={link.path}
                                    {...link}
                                    active={isActive(link.path)}
                                    hovered={hov === link.path}
                                    collapsed={collapsed}
                                    onHoverStart={setHov}
                                    onHoverEnd={() => setHov(null)}
                                />
                            ))}
                        </div>
                    </motion.div>
                ))}

                {/* ── PINNED ASSETS (only when expanded) ── */}
                {!collapsed && pinnedAssets.length > 0 && (
                    <motion.div
                        variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.24 } } }}
                    >
                        <SectionLabel label="Destacados" collapsed={collapsed} />
                        <div className="rounded-xl overflow-hidden"
                            style={{
                                background: `hsl(var(--sidebar-pinned-bg))`,
                                border: `1px solid hsl(var(--sidebar-pinned-border))`,
                            }}>
                            {pinnedAssets.map((asset, i) => {
                                const isUp = asset.changePercent >= 0;
                                const shortSymbol = asset.ticker.split(':')[1] || asset.ticker;
                                return (
                                    <motion.button
                                        key={asset.ticker}
                                        onClick={() => navigate(`/market?symbol=${asset.ticker}`)}
                                        className="w-full flex items-center justify-between px-3.5 py-2.5 transition-colors"
                                        style={{
                                            borderBottom: i < pinnedAssets.length - 1
                                                ? `1px solid hsl(var(--sidebar-pinned-row-border))`
                                                : 'none',
                                        }}
                                        whileHover={{ background: 'hsl(var(--primary) / 0.04)' } as any}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                                                <TrendingUp className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
                                            </div>
                                            <span className="text-[13px] font-semibold">
                                                {shortSymbol === 'BTCUSD' ? 'BTC' : shortSymbol}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className="text-[13px] font-bold num tracking-tight">
                                                ${(asset.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <span
                                                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                                style={{
                                                    background: isUp ? 'hsl(145 70% 40% / 0.1)' : 'hsl(0 72% 50% / 0.1)',
                                                    color: isUp ? 'hsl(145 65% 36%)' : 'hsl(0 65% 43%)',
                                                }}
                                            >
                                                {isUp ? '+' : ''}{(asset.changePercent ?? 0).toFixed(2)}%
                                            </span>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </motion.nav>

            {/* ── USER CARD ───────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.36, delay: 0.38 }}
                className="px-3 pb-3 pt-2 flex-shrink-0"
                style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}
            >
                {/* Collapse toggle */}
                <button
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-2 text-[11.5px] font-medium transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted) / 0.6)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setCollapsed()}
                    title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                >
                    {collapsed
                        ? <PanelLeftOpen className="w-4 h-4 mx-auto" />
                        : <>
                            <PanelLeftClose className="w-3.5 h-3.5" />
                            <span>Colapsar</span>
                        </>
                    }
                </button>

                <div
                    className="rounded-xl p-3 cursor-pointer transition-all"
                    style={{
                        background: `linear-gradient(135deg, hsl(var(--sidebar-card-bg-from)) 0%, hsl(var(--sidebar-card-bg-to)) 100%)`,
                        border: `1px solid hsl(var(--sidebar-card-border))`,
                    }}
                    onClick={() => navigate('/profile')}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = PRIMARY_BRD)}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--sidebar-card-border))')}
                >
                    <div className="flex items-center gap-2.5" style={{ justifyContent: collapsed ? 'center' : undefined }}>
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold overflow-hidden"
                                style={{
                                    background: user?.avatarUrl ? undefined : `linear-gradient(135deg, ${PRIMARY} 0%, hsl(var(--primary) / 0.65) 100%)`,
                                    color: 'hsl(var(--primary-foreground))',
                                }}
                            >
                                {user?.avatarUrl
                                    ? <img src={resolveMediaUrl(user.avatarUrl)} alt={user.username || 'Avatar'} className="w-full h-full object-cover" />
                                    : (user?.username?.[0]?.toUpperCase() || (user as any)?.email?.[0]?.toUpperCase() || 'U')
                                }
                            </div>
                            <span
                                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                                style={{
                                    background: PRIMARY,
                                    border: `2px solid hsl(var(--sidebar-bg))`,
                                }}
                            />
                        </div>

                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-[12.5px] font-semibold truncate leading-tight">
                                    {user?.username || (user as any)?.email?.split('@')[0] || 'Usuario'}
                                </p>
                                <p className="text-[9.5px] uppercase tracking-[0.14em] font-semibold leading-tight mt-0.5"
                                    style={{ color: 'hsl(var(--primary) / 0.6)' }}>
                                    Inversor
                                </p>
                            </div>
                        )}

                        {!collapsed && (
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--primary) / 0.35)' }} />
                        )}
                    </div>
                </div>

                {/* Logout */}
                <motion.button
                    type="button"
                    className="mt-1.5 w-full flex items-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground))', justifyContent: collapsed ? 'center' : 'center' }}
                    whileHover={{ color: 'hsl(0 68% 55%)' } as any}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.14 }}
                    onClick={e => { e.stopPropagation(); logout(); }}
                >
                    <LogOut className="w-3.5 h-3.5" />
                    {!collapsed && <span>Cerrar sesión</span>}
                </motion.button>
            </motion.div>
        </motion.aside>
    );
}
