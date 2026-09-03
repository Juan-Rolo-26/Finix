import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Compass,
    MessageSquare,
    MoreHorizontal,
    Users,
    User,
    Settings,
    Search,
    LogOut,
    Sun,
    Moon,
    Plus,
    X,
    Newspaper,
    TrendingUp,
    Briefcase,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { useAuthStore } from '../stores/authStore';
import { usePreferencesStore } from '../stores/preferencesStore';

const PRIMARY = 'hsl(var(--primary))';

/* ── 4 main tabs + 1 create slot ──────────────────────────────── */
const mainTabs = [
    { path: '/dashboard', icon: LayoutDashboard },
    { path: '/comunidades', icon: Users },
    // CENTER: create button
    { path: '/explore', icon: Compass },
    { path: '/messages', icon: MessageSquare },
];

export function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();
    const { theme, setTheme } = usePreferencesStore();

    const [unreadMsgs, setUnreadMsgs] = useState(0);
    const [isMoreOpen, setIsMoreOpen] = useState(false);

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

    const isActive = (p: string) =>
        location.pathname === p ||
        (p !== '/dashboard' && location.pathname.startsWith(`${p}/`));

    const moreActive = ['/market', '/portfolio', '/news', '/learn', '/profile', '/settings', '/notifications'].some(p => isActive(p));

    const moreLinks = [
        { label: 'Mercado', path: '/market', icon: TrendingUp },
        { label: 'Portafolio', path: '/portfolio', icon: Briefcase },
        { label: 'Noticias', path: '/news', icon: Newspaper },
        // { label: 'Aprender', path: '/learn', icon: BookOpen },
        { label: 'Mi Perfil', path: '/profile', icon: User },
        { label: 'Ajustes', path: '/settings', icon: Settings },
    ];

    const LEFT_TABS = mainTabs.slice(0, 2);   // Dashboard, Comunidad
    const RIGHT_TABS = mainTabs.slice(2);       // Explore, Messages

    return (
        <>
            {/* ── BOTTOM BAR ──────────────────────────────── */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
                style={{
                    background: 'hsl(var(--sidebar-bg))',
                    borderTop: '1px solid hsl(var(--sidebar-border))',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                    height: '60px',
                }}
            >
                <div className="flex items-center justify-around h-full px-1">
                    {/* Left tabs */}
                    {LEFT_TABS.map(({ path, icon: Icon }) => {
                        const active = isActive(path);
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
                                            style={{
                                                background: `hsl(var(--sidebar-active-bg-from))`,
                                                border: `1px solid hsl(var(--sidebar-active-border))`,
                                            }}
                                            initial={false}
                                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                        />
                                    )}
                                </AnimatePresence>
                                <Icon
                                    className="w-5 h-5 relative z-10 transition-colors"
                                    style={{ color: active ? PRIMARY : 'hsl(var(--muted-foreground))' }}
                                />
                            </Link>
                        );
                    })}

                    {/* ── CENTER CREATE BUTTON ──────────────── */}
                    <button
                        className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all active:scale-90"
                        style={{
                            background: `linear-gradient(135deg, ${PRIMARY} 0%, hsl(var(--primary) / 0.72) 100%)`,
                            boxShadow: `0 4px 18px hsl(var(--primary) / 0.32), 0 2px 6px hsl(var(--primary) / 0.22)`,
                            marginBottom: '2px',
                        }}
                        onClick={() => navigate('/explore?create=true')}
                        aria-label="Crear publicación"
                    >
                        <Plus className="w-5 h-5" style={{ color: 'hsl(var(--primary-foreground))' }} />
                    </button>

                    {/* Right tabs */}
                    {RIGHT_TABS.map(({ path, icon: Icon }) => {
                        const active = isActive(path);
                        const badge = path === '/messages' ? unreadMsgs : 0;
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
                                            style={{
                                                background: `hsl(var(--sidebar-active-bg-from))`,
                                                border: `1px solid hsl(var(--sidebar-active-border))`,
                                            }}
                                            initial={false}
                                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                        />
                                    )}
                                </AnimatePresence>
                                <Icon
                                    className="w-5 h-5 relative z-10 transition-colors"
                                    style={{ color: active ? PRIMARY : 'hsl(var(--muted-foreground))' }}
                                />
                                {badge > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] rounded-full text-[9px] font-bold flex items-center justify-center px-0.5 z-20"
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
                        aria-label="Más opciones"
                    >
                        {(moreActive || isMoreOpen) && (
                            <motion.div
                                className="absolute inset-0 rounded-xl"
                                style={{
                                    background: `hsl(var(--sidebar-active-bg-from))`,
                                    border: `1px solid hsl(var(--sidebar-active-border))`,
                                }}
                                initial={false}
                            />
                        )}
                        <MoreHorizontal
                            className="w-5 h-5 relative z-10 transition-colors"
                            style={{ color: moreActive || isMoreOpen ? PRIMARY : 'hsl(var(--muted-foreground))' }}
                        />
                    </button>
                </div>
            </nav>

            {/* ── MORE PANEL (slide-up sheet) ──────────────── */}
            <AnimatePresence>
                {isMoreOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 z-40 lg:hidden"
                            style={{ background: 'hsl(0 0% 0% / 0.5)', backdropFilter: 'blur(3px)' }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsMoreOpen(false)}
                        />

                        {/* Sheet */}
                        <motion.div
                            className="fixed left-0 right-0 bottom-0 z-50 lg:hidden rounded-t-3xl overflow-hidden"
                            style={{
                                background: 'hsl(var(--sidebar-bg))',
                                borderTop: '1px solid hsl(var(--sidebar-border))',
                                paddingBottom: 'calc(env(safe-area-inset-bottom) + 68px)',
                                maxHeight: '88vh',
                            }}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
                        >
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-10 h-1 rounded-full" style={{ background: 'hsl(var(--border))' }} />
                            </div>

                            <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(88vh - 64px)' }}>
                                {/* Header */}
                                <div className="flex items-center justify-between px-5 py-3">
                                    <div
                                        className="flex items-center gap-3 cursor-pointer"
                                        onClick={() => navigate('/profile')}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[13px] flex-shrink-0 overflow-hidden"
                                            style={{
                                                background: user?.avatarUrl ? undefined : `linear-gradient(135deg, ${PRIMARY} 0%, hsl(var(--primary) / 0.7) 100%)`,
                                                color: 'hsl(var(--primary-foreground))',
                                            }}
                                        >
                                            {user?.avatarUrl
                                                ? <img src={resolveMediaUrl(user.avatarUrl)} alt={user.username} className="w-full h-full object-cover" />
                                                : (user?.username?.[0]?.toUpperCase() || 'F')
                                            }
                                        </div>
                                        <div>
                                            <p className="font-bold text-[13.5px] leading-tight">{user?.username || 'Usuario'}</p>
                                            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--primary) / 0.6)' }}>
                                                Ver perfil →
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                                        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                                        onClick={() => setIsMoreOpen(false)}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Search Trigger */}
                                <div className="px-4 pb-3">
                                    <button
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
                                        style={{
                                            background: 'hsl(var(--secondary))',
                                            color: 'hsl(var(--muted-foreground))',
                                            border: '1px solid hsl(var(--border))',
                                        }}
                                        onClick={() => {
                                            setIsMoreOpen(false);
                                            window.dispatchEvent(new Event('finix:open-search'));
                                        }}
                                    >
                                        <Search className="w-4 h-4 ml-1" />
                                        <span className="text-[13px]">Buscador Inteligente IA...</span>
                                    </button>
                                </div>

                                {/* Quick links grid */}
                                <div className="grid grid-cols-3 gap-2.5 px-4 pb-3">
                                    {moreLinks.map(({ label, path, icon: Icon }) => {
                                        const active = isActive(path);
                                        return (
                                            <button
                                                key={path}
                                                className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all"
                                                style={{
                                                    background: active ? `hsl(var(--primary) / 0.1)` : 'hsl(var(--secondary))',
                                                    border: `1px solid ${active ? `hsl(var(--primary) / 0.25)` : 'hsl(var(--border))'}`,
                                                    color: active ? PRIMARY : 'hsl(var(--foreground))',
                                                }}
                                                onClick={() => navigate(path)}
                                            >
                                                <Icon className="w-4.5 h-4.5" style={{ color: active ? PRIMARY : 'hsl(var(--muted-foreground))' }} />
                                                <span className="text-[11px] font-semibold">{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mx-4 mb-3 h-px" style={{ background: 'hsl(var(--border) / 0.6)' }} />

                                {/* Utility row */}
                                <div className="px-4 pb-3 space-y-2">
                                    {/* Theme toggle */}
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-colors"
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
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-colors"
                                        style={{
                                            background: 'hsl(0 60% 50% / 0.07)',
                                            border: '1px solid hsl(0 60% 50% / 0.18)',
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
