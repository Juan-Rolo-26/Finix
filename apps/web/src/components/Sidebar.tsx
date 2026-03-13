import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ComponentType } from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    PieChart,
    Settings,
    LogOut,
    User,
    TrendingUp,
    MessageSquare,
    Bell,
    Search,
    Plus,
    Edit3,
    Compass,
    ChevronRight,
    Loader2,
    Sun,
    Moon,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { NOTIFICATION_HISTORY_DAYS, type NotificationItem, groupNotificationsByDay } from '../lib/notifications';
import { usePreferencesStore } from '../stores/preferencesStore';

/* ─── Brand token (always green accent) ───────────────────────── */
// We read from CSS variable so it adapts to light/dark automatically
const PRIMARY = 'hsl(var(--primary))';
const PRIMARY_BRD = 'hsl(var(--primary) / 0.22)';

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
    onHoverStart,
    onHoverEnd,
}: SidebarNavLinkProps) {
    return (
        <Link
            to={path}
            onMouseEnter={() => onHoverStart(path)}
            onMouseLeave={onHoverEnd}
            className="relative flex items-center gap-3 rounded-xl px-3.5 py-[9px] text-[15px] font-medium transition-colors duration-300 select-none overflow-hidden"
            style={{
                color: active
                    ? PRIMARY
                    : hovered
                        ? 'hsl(var(--foreground))'
                        : 'hsl(var(--muted-foreground))',
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
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
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
                    transition={{ duration: 0.2 }}
                />
            )}
            <div className="relative z-10 flex items-center gap-3 w-full">
                <Icon className="w-[17px] h-[17px] flex-shrink-0" />
                <span className="flex-1 tracking-wide">{name}</span>
                {badge > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="min-w-[18px] h-[18px] rounded-full text-[11px] font-bold flex items-center justify-center px-1"
                        style={{ background: PRIMARY, color: 'hsl(var(--primary-foreground))' }}
                    >
                        {badge > 9 ? '9+' : badge}
                    </motion.span>
                )}
            </div>
        </Link>
    );
}

function SectionLabel({ label }: { label: string }) {
    return (
        <p
            className="mb-2 px-3 text-[11.5px] font-bold uppercase tracking-[0.22em]"
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
    const { theme, setTheme } = usePreferencesStore();
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

    /* Detect resolved theme for icon */
    const isLight = theme === 'light' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

    /* ── Fetch search results ────────────────────────────────── */
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearchLoading(true);
        const delayDebounce = setTimeout(() => {
            apiFetch(`/users/search?q=${searchQuery}`)
                .then(res => res.json())
                .then(data => setSearchResults(Array.isArray(data) ? data : []))
                .catch(() => setSearchResults([]))
                .finally(() => setIsSearchLoading(false));
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    /* ── Fetch notifications ─────────────────────────────────── */
    useEffect(() => {
        if (isNotifsOpen) {
            const fetchNotifs = async () => {
                setIsNotifsLoading(true);
                try {
                    const res = await apiFetch(`/users/me/notifications?days=${NOTIFICATION_HISTORY_DAYS}`);
                    if (res.ok) {
                        const data = await res.json();
                        setNotifications(Array.isArray(data) ? data : []);
                        const readRes = await apiFetch('/users/me/notifications/read-all', {
                            method: 'PATCH',
                        });
                        if (readRes.ok) {
                            setUnreadNotifs(0);
                        }
                    }
                } catch {
                    setNotifications([]);
                } finally {
                    setIsNotifsLoading(false);
                }
            };
            fetchNotifs();
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

    /* ── Poll unread count ───────────────────────────────────── */
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

    /* ── Fetch pinned assets ─────────────────────────────────── */
    useEffect(() => {
        const load = async () => {
            try {
                const res = await apiFetch('/portfolios/watchlists');
                if (!res.ok) return;
                const d = await res.json();
                const pinned = d.find((w: any) => w.name === '__pinned__');
                if (pinned && pinned.tickers) {
                    // Limit to 3 pinned assets
                    const tcks = pinned.tickers.split(',').filter(Boolean).slice(0, 3);
                    const quotes = await Promise.all(tcks.map(async (t: string) => {
                        try {
                            const qRes = await apiFetch(`/market/quote?symbol=${t}`);
                            if (qRes.ok) {
                                const q = await qRes.json();
                                return {
                                    ticker: t,
                                    change: q.change ?? q.regularMarketChange ?? 0,
                                    changePercent: q.changePercent ?? q.regularMarketChangePercent ?? ((q.change && q.price) ? (q.change / (q.price - q.change)) * 100 : 0),
                                    price: q.price ?? q.regularMarketPrice ?? 0
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
    }, []);

    const isActive = (p: string) =>
        location.pathname === p ||
        (p !== '/dashboard' && location.pathname.startsWith(`${p}/`));

    const sections = [
        {
            label: 'Plataforma',
            links: [
                { name: 'Inicio', path: '/dashboard', icon: LayoutDashboard, badge: 0 },
                { name: 'Portafolio', path: '/portfolio', icon: PieChart, badge: 0 },
                { name: 'Mercado', path: '/market', icon: TrendingUp, badge: 0 },
                { name: 'Explorar', path: '/explore', icon: Compass, badge: 0 },
                { name: 'Mensajes', path: '/messages', icon: MessageSquare, badge: unreadMsgs },
            ],
        },
        {
            label: 'Mi Cuenta',
            links: [
                { name: 'Perfil', path: '/profile', icon: User, badge: 0 },
                { name: 'Configuraciones', path: '/settings', icon: Settings, badge: 0 },
            ],
        },
    ];

    /* ── Popover shared styles ───────────────────────────────── */
    const popoverStyle: React.CSSProperties = {
        background: 'hsl(var(--popover))',
        border: '1px solid hsl(var(--border))',
        color: 'hsl(var(--popover-foreground))',
    };

    const toggleTheme = () => {
        setTheme(isLight ? 'dark' : 'light');
    };

    const handleNotificationClick = (notification: NotificationItem) => {
        if (notification.link) {
            navigate(notification.link);
        }
        setIsNotifsOpen(false);
    };

    const notificationGroups = groupNotificationsByDay(notifications);

    return (
        <motion.aside
            initial={{ x: -12, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed left-0 top-0 z-40 hidden lg:flex h-screen w-[300px] flex-col"
            style={{
                background: 'hsl(var(--sidebar-bg))',
                borderRight: '1px solid hsl(var(--sidebar-border))',
            }}
        >
            {/* Subtle top glow */}
            <div className="pointer-events-none absolute top-0 left-0 w-full h-32"
                style={{ background: 'var(--sidebar-top-glow)' }}
            />

            {/* ── LOGO ───────────────────────────────────── */}
            <div className="flex items-center gap-3.5 px-5 py-5"
                style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
                <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                        background: `linear-gradient(135deg, hsl(var(--sidebar-logo-bg-from)) 0%, hsl(var(--sidebar-logo-bg-to)) 100%)`,
                        border: `1px solid hsl(var(--sidebar-logo-border))`,
                        boxShadow: `0 0 16px hsl(var(--primary) / 0.18)`,
                    }}
                >
                    <img src="/logo.png" alt="Finix" className="h-6 w-6 object-contain" />
                </div>
                <div className="leading-none">
                    <p className="text-[19px] font-black tracking-[0.13em] uppercase"
                        style={{ color: 'hsl(var(--foreground))' }}>
                        FINIX
                    </p>
                    <p className="text-[10.5px] font-bold tracking-[0.28em] uppercase mt-0.5"
                        style={{ color: `hsl(var(--sidebar-logo-subtitle))` }}>
                        Red Social
                    </p>
                </div>

                {/* Header actions */}
                <div className="flex items-center gap-1 ml-auto">
                    {/* Theme toggle */}
                    <button
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                        style={{
                            color: 'hsl(var(--muted-foreground))',
                            background: 'transparent',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={toggleTheme}
                        title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                    >
                        {isLight
                            ? <Moon className="w-4 h-4" />
                            : <Sun className="w-4 h-4" />
                        }
                    </button>

                    {/* Search */}
                    <div className="relative">
                        <button
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                            style={{
                                color: isSearchOpen ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                                background: isSearchOpen ? 'hsl(var(--muted))' : 'transparent',
                            }}
                            onClick={() => { setIsSearchOpen(!isSearchOpen); setIsNotifsOpen(false); }}
                        >
                            <Search className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                            {isSearchOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-12 left-0 w-[260px] rounded-xl shadow-2xl overflow-hidden z-50 p-2"
                                    style={popoverStyle}
                                >
                                    <input
                                        type="text"
                                        placeholder="Buscar usuarios..."
                                        className="w-full text-sm px-3 py-2 rounded-lg outline-none mb-2"
                                        style={{
                                            background: 'hsl(var(--secondary))',
                                            color: 'hsl(var(--foreground))',
                                            border: '1px solid hsl(var(--border))',
                                        }}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="max-h-64 overflow-y-auto space-y-1">
                                        {isSearchLoading ? (
                                            <div className="flex justify-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map(u => (
                                                <div
                                                    key={u.id}
                                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border border-transparent"
                                                    style={{ color: 'hsl(var(--foreground))' }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.background = 'hsl(var(--secondary))';
                                                        e.currentTarget.style.borderColor = 'hsl(var(--border))';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.background = 'transparent';
                                                        e.currentTarget.style.borderColor = 'transparent';
                                                    }}
                                                    onClick={() => {
                                                        navigate(`/profile/${u.username}`);
                                                        setIsSearchOpen(false);
                                                        setSearchQuery('');
                                                    }}
                                                >
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                                                        style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                                                        {u.avatarUrl
                                                            ? <img src={resolveMediaUrl(u.avatarUrl)} alt={u.username} className="w-full h-full object-cover" />
                                                            : <User className="w-4 h-4" style={{ color: PRIMARY }} />
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-sm font-bold truncate leading-tight">{u.username}</p>
                                                            {u.isVerified && (
                                                                <span className="text-[10px] font-bold" style={{ color: PRIMARY }}>✓</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                            {u.title || u.company || (u.winRate ? `${u.winRate.toFixed(0)}% de acierto` : 'Ver perfil')}
                                                        </p>
                                                    </div>
                                                    <div className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                                                        style={{ background: 'hsl(var(--primary) / 0.1)', color: PRIMARY }}>
                                                        Ver perfil
                                                    </div>
                                                </div>
                                            ))
                                        ) : searchQuery.length >= 2 ? (
                                            <p className="text-xs text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Sin resultados</p>
                                        ) : (
                                            <p className="text-[11px] text-center py-4 leading-relaxed px-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                Encuentra a otros inversores y descubre sus portafolios.
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
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                            style={{
                                color: isNotifsOpen ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                                background: isNotifsOpen ? 'hsl(var(--muted))' : 'transparent',
                            }}
                            onClick={() => { setIsNotifsOpen(!isNotifsOpen); setIsSearchOpen(false); }}
                        >
                            <Bell className="w-4 h-4" />
                        </button>
                        {unreadNotifs > 0 && (
                            <span
                                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center pointer-events-none px-1"
                                style={{ background: PRIMARY, color: 'hsl(var(--primary-foreground))' }}
                            >
                                {unreadNotifs > 9 ? '9+' : unreadNotifs}
                            </span>
                        )}
                        <AnimatePresence>
                            {isNotifsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-12 left-auto right-0 sm:left-0 sm:right-auto w-[260px] md:w-[300px] rounded-xl shadow-2xl overflow-hidden z-50 origin-top"
                                    style={{ ...popoverStyle, transformOrigin: 'top right' }}
                                >
                                    <div className="px-4 py-3 sticky top-0 z-10 flex items-center justify-between"
                                        style={{
                                            background: 'hsl(var(--popover))',
                                            borderBottom: '1px solid hsl(var(--border))',
                                        }}>
                                        <div>
                                            <h3 className="font-bold text-sm">Notificaciones</h3>
                                            <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                Ultimos {NOTIFICATION_HISTORY_DAYS} dias
                                            </p>
                                        </div>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto p-2 space-y-1 relative">
                                        {isNotifsLoading ? (
                                            <div className="flex justify-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            </div>
                                        ) : notificationGroups.length > 0 ? (
                                            notificationGroups.map((group) => (
                                                <div key={group.dateKey} className="space-y-1.5">
                                                    <div className="px-2 pt-2 pb-1">
                                                        <p
                                                            className="text-[10px] font-bold uppercase tracking-[0.18em]"
                                                            style={{ color: 'hsl(var(--muted-foreground))' }}
                                                        >
                                                            {group.label}
                                                        </p>
                                                    </div>
                                                    {group.items.map((n) => (
                                                        <div
                                                            key={n.id}
                                                            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors group"
                                                            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--secondary))')}
                                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                            onClick={() => handleNotificationClick(n)}
                                                        >
                                                            <div
                                                                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
                                                                style={{
                                                                    background: n.type === 'follow' ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary))',
                                                                    border: n.type === 'follow' ? 'none' : '1px solid hsl(var(--border))',
                                                                }}
                                                            >
                                                                {n.type === 'follow'
                                                                    ? <User className="w-5 h-5" style={{ color: PRIMARY }} />
                                                                    : <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                                }
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[13px] font-medium leading-snug break-words">{n.title}</p>
                                                                {n.content && (
                                                                    <p
                                                                        className="mt-1 text-[11px] leading-snug break-words"
                                                                        style={{ color: 'hsl(var(--muted-foreground))' }}
                                                                    >
                                                                        {n.content}
                                                                    </p>
                                                                )}
                                                                <span className="text-[10px] mt-1 inline-block font-bold" style={{ color: 'hsl(var(--primary) / 0.7)' }}>
                                                                    {n.time}
                                                                </span>
                                                            </div>
                                                            {n.link && <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 px-4">
                                                <Bell className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground) / 0.3)' }} />
                                                <p className="text-sm font-semibold">No tienes notificaciones</p>
                                                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                    Aqui veras el historial de la ultima semana con seguidores, likes y actividad relevante.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── CREATE POST BUTTON ──────────────────────── */}
            <div className="px-3 pt-3">
                <button
                    onClick={() => navigate('/explore?create=true')}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all group"
                    style={{
                        background: `linear-gradient(135deg, ${PRIMARY} 0%, hsl(var(--primary) / 0.75) 100%)`,
                        color: 'hsl(var(--primary-foreground))',
                        boxShadow: `0 4px 20px hsl(var(--primary) / 0.3)`,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 4px 28px hsl(var(--primary) / 0.5)`)}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 4px 20px hsl(var(--primary) / 0.3)`)}
                >
                    <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Crear publicación
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>

            {/* ── NAV ────────────────────────────────────── */}
            <motion.nav
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03, delayChildren: 0.1 } } }}
                className="flex-1 px-3 py-3 space-y-3 overflow-y-auto overflow-x-hidden scrollbar-hide"
            >
                {sections.map((section) => (
                    <motion.div
                        key={section.label}
                        variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } }}
                    >
                        <SectionLabel label={section.label} />
                        <div className="space-y-0.5">
                            {section.links.map((link) => (
                                <SidebarNavLink
                                    key={link.path}
                                    {...link}
                                    active={isActive(link.path)}
                                    hovered={hov === link.path}
                                    onHoverStart={setHov}
                                    onHoverEnd={() => setHov(null)}
                                />
                            ))}
                        </div>
                    </motion.div>
                ))}

                {/* ── DESTACADOS ───────────────────────────── */}
                <motion.div
                    variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } }}
                >
                    <div className="flex items-center justify-between mb-2 px-1">
                        <SectionLabel label="Destacados" />
                        <button
                            onClick={() => navigate('/profile')}
                            className="text-[10px] font-semibold transition-colors"
                            style={{ color: 'hsl(var(--primary) / 0.5)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = PRIMARY)}
                            onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--primary) / 0.5)')}
                        >
                            <Edit3 className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="rounded-xl overflow-hidden"
                        style={{
                            background: `hsl(var(--sidebar-pinned-bg))`,
                            border: `1px solid hsl(var(--sidebar-pinned-border))`,
                        }}>
                        {pinnedAssets.length === 0 ? (
                            <div className="p-4 text-center">
                                <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Sin activos destacados</p>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                                    style={{
                                        background: 'hsl(var(--primary) / 0.15)',
                                        color: PRIMARY,
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--primary) / 0.25)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'hsl(var(--primary) / 0.15)')}
                                >
                                    Agregar activos
                                </button>
                            </div>
                        ) : (
                            pinnedAssets.map((asset, i) => {
                                const isUp = asset.changePercent >= 0;
                                const shortSymbol = asset.ticker.split(':')[1] || asset.ticker;
                                return (
                                    <motion.button
                                        key={asset.ticker}
                                        onClick={() => navigate(`/market?symbol=${asset.ticker}`)}
                                        className="w-full flex items-center justify-between px-3.5 py-3 transition-colors"
                                        style={{
                                            borderBottom: i < pinnedAssets.length - 1
                                                ? `1px solid hsl(var(--sidebar-pinned-row-border))`
                                                : 'none',
                                        }}
                                        whileHover={{ background: 'hsl(var(--primary) / 0.05)' } as any}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                                                <TrendingUp className="w-4 h-4" style={{ color: PRIMARY }} />
                                            </div>
                                            <span className="text-[14px] font-bold">
                                                {shortSymbol === 'BTCUSD' ? 'BTC' : shortSymbol}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[13.5px] font-bold tracking-tight">
                                                ${(asset.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <span
                                                className="text-[10px] font-bold px-2 py-0.5 rounded text-center opacity-90 flex items-center gap-1"
                                                style={{
                                                    background: isUp ? 'hsl(142 70% 45% / 0.12)' : 'hsl(0 72% 50% / 0.12)',
                                                    color: isUp ? 'hsl(142 70% 35%)' : 'hsl(0 72% 45%)',
                                                }}
                                            >
                                                <span>{isUp ? '+' : '-'}${(Math.abs(asset.change) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                <span className="opacity-80 text-[9px]">({isUp ? '+' : ''}{(asset.changePercent ?? 0).toFixed(2)}%)</span>
                                            </span>
                                        </div>
                                    </motion.button>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </motion.nav>

            {/* ── USER CARD ──────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, delay: 0.42 }}
                className="px-3 py-3"
                style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}
            >
                <div
                    className="rounded-xl p-3 cursor-pointer transition-all"
                    style={{
                        background: `linear-gradient(135deg, hsl(var(--sidebar-card-bg-from)) 0%, hsl(var(--sidebar-card-bg-to)) 100%)`,
                        border: `1px solid hsl(var(--sidebar-card-border))`,
                    }}
                    onClick={() => navigate('/profile')}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.border = `1px solid ${PRIMARY_BRD}`)}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.border = `1px solid hsl(var(--sidebar-card-border))`)}
                >
                    {/* User row */}
                    <div className="flex items-center gap-2.5">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black overflow-hidden"
                                style={{
                                    background: `linear-gradient(135deg, ${PRIMARY} 0%, hsl(var(--primary) / 0.7) 100%)`,
                                    color: 'hsl(var(--primary-foreground))',
                                    boxShadow: `0 0 14px hsl(var(--primary) / 0.4)`,
                                }}
                            >
                                {user?.username?.[0]?.toUpperCase() || 'F'}
                            </div>
                            {/* Online dot */}
                            <span
                                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                                style={{
                                    background: PRIMARY,
                                    border: `2px solid hsl(var(--sidebar-bg))`,
                                    boxShadow: `0 0 5px ${PRIMARY}`,
                                }}
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold truncate leading-tight">
                                {user?.username || 'Usuario'}
                            </p>
                            <p className="text-[9.5px] uppercase tracking-[0.15em] font-bold leading-tight mt-0.5"
                                style={{ color: 'hsl(var(--primary) / 0.65)' }}>
                                Inversor
                            </p>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--primary) / 0.4)' }} />
                    </div>
                </div>

                {/* Logout */}
                <motion.button
                    type="button"
                    className="mt-1.5 w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    whileHover={{ color: 'hsl(0 68% 55%)' } as any}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    onClick={e => { e.stopPropagation(); logout(); }}
                >
                    <LogOut className="w-3 h-3" />
                    <span>Cerrar sesión</span>
                </motion.button>
            </motion.div>
        </motion.aside>
    );
}
