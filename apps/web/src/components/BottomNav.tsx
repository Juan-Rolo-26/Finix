import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    TrendingUp,
    Compass,
    MessageSquare,
    MoreHorizontal,
    PieChart,
    User,
    Settings,
    Search,
    LogOut,
    Sun,
    Moon,
    Plus,
    Loader2,
    X,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { usePreferencesStore } from '../stores/preferencesStore';

const PRIMARY = 'hsl(var(--primary))';

/* ── 5 main tabs ──────────────────────────────────────────── */
const mainTabs = [
    { path: '/dashboard', icon: LayoutDashboard },
    { path: '/market',    icon: TrendingUp },
    { path: '/explore',   icon: Compass },
    { path: '/messages',  icon: MessageSquare },
];

export function BottomNav() {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { logout, user } = useAuthStore();
    const { theme, setTheme } = usePreferencesStore();

    const [unreadMsgs, setUnreadMsgs]  = useState(0);
    const [isMoreOpen, setIsMoreOpen]  = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearchLoading, setIsSearchLoading] = useState(false);

    const isLight = theme === 'light' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

    /* poll unread */
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

    /* close panel on route change */
    useEffect(() => { setIsMoreOpen(false); }, [location.pathname]);

    /* search debounce */
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

    const isActive = (p: string) =>
        location.pathname === p ||
        (p !== '/dashboard' && location.pathname.startsWith(`${p}/`));

    const moreActive = ['/portfolio', '/profile', '/settings'].some(p => isActive(p));

    /* ── Quick links inside "More" panel ─────────────────── */
    const moreLinks = [
        { label: 'Portafolio',     path: '/portfolio', icon: PieChart },
        { label: 'Mi Perfil',      path: '/profile',   icon: User },
        { label: 'Configuración',  path: '/settings',  icon: Settings },
    ];

    return (
        <>
            {/* ── BOTTOM BAR ────────────────────────────────── */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex items-center justify-around px-1"
                style={{
                    background: 'hsl(var(--sidebar-bg))',
                    borderTop: '1px solid hsl(var(--sidebar-border))',
                    height: '56px',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                {/* Main tabs */}
                {mainTabs.map(({ path, icon: Icon }) => {
                    const active = isActive(path);
                    const badge  = path === '/messages' ? unreadMsgs : 0;
                    return (
                        <Link
                            key={path}
                            to={path}
                            className="relative flex items-center justify-center w-12 h-12 rounded-xl"
                        >
                            <AnimatePresence>
                                {active && (
                                    <motion.div
                                        layoutId="bottom-active"
                                        className="absolute inset-0 rounded-xl"
                                        style={{ background: `hsl(var(--sidebar-active-bg-from) / 0.55)`, border: `1px solid hsl(var(--sidebar-active-border))` }}
                                        initial={false}
                                        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                                    />
                                )}
                            </AnimatePresence>
                            <Icon
                                className="w-[22px] h-[22px] relative z-10 transition-colors"
                                style={{ color: active ? PRIMARY : 'hsl(var(--muted-foreground))' }}
                            />
                            {badge > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] rounded-full text-[9px] font-bold flex items-center justify-center px-0.5 z-20"
                                    style={{ background: PRIMARY, color: 'hsl(var(--primary-foreground))' }}
                                >
                                    {badge > 9 ? '9+' : badge}
                                </motion.span>
                            )}
                        </Link>
                    );
                })}

                {/* More button */}
                <button
                    className="relative flex items-center justify-center w-12 h-12 rounded-xl"
                    onClick={() => setIsMoreOpen(v => !v)}
                >
                    {(moreActive || isMoreOpen) && (
                        <motion.div
                            className="absolute inset-0 rounded-xl"
                            style={{ background: `hsl(var(--sidebar-active-bg-from) / 0.55)`, border: `1px solid hsl(var(--sidebar-active-border))` }}
                            initial={false}
                        />
                    )}
                    <MoreHorizontal
                        className="w-[22px] h-[22px] relative z-10 transition-colors"
                        style={{ color: moreActive || isMoreOpen ? PRIMARY : 'hsl(var(--muted-foreground))' }}
                    />
                </button>
            </nav>

            {/* ── MORE PANEL (slide-up sheet) ────────────────── */}
            <AnimatePresence>
                {isMoreOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 z-40 lg:hidden"
                            style={{ background: 'hsl(0 0% 0% / 0.55)', backdropFilter: 'blur(2px)' }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsMoreOpen(false)}
                        />

                        {/* Sheet */}
                        <motion.div
                            className="fixed left-0 right-0 bottom-0 z-50 lg:hidden rounded-t-3xl overflow-hidden"
                            style={{
                                background: 'hsl(var(--sidebar-bg))',
                                borderTop: '1px solid hsl(var(--sidebar-border))',
                                paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)',
                                maxHeight: '85vh',
                            }}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
                        >
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 rounded-full" style={{ background: 'hsl(var(--border))' }} />
                            </div>

                            <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
                                {/* Header */}
                                <div className="flex items-center justify-between px-5 py-3">
                                    <div
                                        className="flex items-center gap-3 cursor-pointer"
                                        onClick={() => navigate('/profile')}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[14px] flex-shrink-0"
                                            style={{
                                                background: `linear-gradient(135deg, ${PRIMARY} 0%, hsl(var(--primary) / 0.7) 100%)`,
                                                color: 'hsl(var(--primary-foreground))',
                                                boxShadow: `0 0 12px hsl(var(--primary) / 0.35)`,
                                            }}
                                        >
                                            {user?.username?.[0]?.toUpperCase() || 'F'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[14px] leading-tight">{user?.username || 'Usuario'}</p>
                                            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--primary) / 0.65)' }}>Ver perfil →</p>
                                        </div>
                                    </div>
                                    <button
                                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                                        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                                        onClick={() => setIsMoreOpen(false)}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="px-4 pb-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                        <input
                                            type="text"
                                            placeholder="Buscar usuarios..."
                                            className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none"
                                            style={{
                                                background: 'hsl(var(--secondary))',
                                                color: 'hsl(var(--foreground))',
                                                border: '1px solid hsl(var(--border))',
                                            }}
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <AnimatePresence>
                                        {(searchResults.length > 0 || isSearchLoading || searchQuery.length >= 2) && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-1 rounded-xl overflow-hidden"
                                                style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}
                                            >
                                                {isSearchLoading ? (
                                                    <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" style={{ color: 'hsl(var(--muted-foreground))' }} /></div>
                                                ) : searchResults.length > 0 ? (
                                                    searchResults.map(u => (
                                                        <div
                                                            key={u.id}
                                                            className="flex items-center gap-3 px-3 py-3 cursor-pointer"
                                                            style={{ borderBottom: '1px solid hsl(var(--border) / 0.4)' }}
                                                            onClick={() => {
                                                                navigate(`/profile/${u.username}`);
                                                                setIsMoreOpen(false);
                                                                setSearchQuery('');
                                                            }}
                                                        >
                                                            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                                                                style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                                                                {u.avatarUrl
                                                                    ? <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                                                                    : <User className="w-4 h-4" style={{ color: PRIMARY }} />
                                                                }
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <p className="text-sm font-bold truncate">{u.username}</p>
                                                                    {u.isVerified && <span className="text-[10px] font-bold" style={{ color: PRIMARY }}>✓</span>}
                                                                </div>
                                                                <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                                    {u.title || u.company || (u.winRate ? `${u.winRate.toFixed(0)}% Win Rate` : 'Ver perfil')}
                                                                </p>
                                                            </div>
                                                            <div className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                                                                style={{ background: 'hsl(var(--primary) / 0.1)', color: PRIMARY }}>
                                                                Ver
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-center py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Sin resultados</p>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Quick links grid */}
                                <div className="grid grid-cols-3 gap-3 px-4 pb-3">
                                    {moreLinks.map(({ label, path, icon: Icon }) => {
                                        const active = isActive(path);
                                        return (
                                            <button
                                                key={path}
                                                className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all"
                                                style={{
                                                    background: active ? `hsl(var(--primary) / 0.12)` : 'hsl(var(--secondary))',
                                                    border: `1px solid ${active ? `hsl(var(--primary) / 0.3)` : 'hsl(var(--border))'}`,
                                                    color: active ? PRIMARY : 'hsl(var(--foreground))',
                                                }}
                                                onClick={() => navigate(path)}
                                            >
                                                <Icon className="w-5 h-5" style={{ color: active ? PRIMARY : 'hsl(var(--muted-foreground))' }} />
                                                <span className="text-[11px] font-semibold">{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Divider */}
                                <div className="mx-4 mb-3" style={{ borderTop: '1px solid hsl(var(--border))' }} />

                                {/* Utility row */}
                                <div className="px-4 pb-3 space-y-2">
                                    {/* Create post */}
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
                                        style={{
                                            background: `linear-gradient(135deg, ${PRIMARY} 0%, hsl(var(--primary) / 0.75) 100%)`,
                                            color: 'hsl(var(--primary-foreground))',
                                            boxShadow: `0 4px 16px hsl(var(--primary) / 0.25)`,
                                        }}
                                        onClick={() => navigate('/explore?create=true')}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Crear publicación
                                    </button>

                                    {/* Theme toggle */}
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                                        style={{
                                            background: 'hsl(var(--secondary))',
                                            border: '1px solid hsl(var(--border))',
                                            color: 'hsl(var(--foreground))',
                                        }}
                                        onClick={() => setTheme(isLight ? 'dark' : 'light')}
                                    >
                                        {isLight
                                            ? <Moon className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                            : <Sun className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                        }
                                        {isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                                    </button>

                                    {/* Logout */}
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                                        style={{
                                            background: 'hsl(0 60% 50% / 0.08)',
                                            border: '1px solid hsl(0 60% 50% / 0.2)',
                                            color: 'hsl(0 68% 55%)',
                                        }}
                                        onClick={() => { logout(); setIsMoreOpen(false); }}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Cerrar sesión
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
