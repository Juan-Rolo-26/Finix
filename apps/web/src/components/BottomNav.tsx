import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import type { ComponentType } from 'react';
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
    AreaChart,
    Calendar,
    Receipt,
    GraduationCap,
    FlaskConical,
    Bookmark,
} from 'lucide-react';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { hasCommunityAccess, useAuthStore } from '../stores/authStore';
import { usePreferencesStore } from '../stores/preferencesStore';
import { cn } from '../lib/utils';
import { isWatchlistEnabled, isEducationEnabled } from '@/lib/featureFlags';

const PRIMARY = 'hsl(var(--primary))';

/* ── 3 main tabs + 1 create slot + more button ────────────────── */
const mainTabs = [
    { path: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { path: '/comunidades', label: 'Comunidad', shortLabel: 'Grupos', icon: Users },
    // CENTER: create button
    { path: '/messages', label: 'Mensajes', icon: MessageSquare },
];

export function FinanceMobileNav({ location, navigate }: { location: ReturnType<typeof useLocation>; navigate: ReturnType<typeof useNavigate> }) {
    const items = [
        { label: 'Inicio', path: '/finanzas', icon: LayoutDashboard },
        { label: 'Movimientos', path: '/finanzas/movimientos', icon: Receipt },
        { label: 'Informes', path: '/finanzas/analytics', icon: AreaChart },
        { label: 'Perfil', path: '/profile', icon: User },
    ];
    const active = (path: string) => path === '/finanzas' ? location.pathname === path : location.pathname.startsWith(path);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navegación de finanzas">
            <div className="mx-auto grid h-[68px] max-w-lg grid-cols-5 items-center px-2">
                {items.slice(0, 2).map(({ label, path, icon: Icon }) => <FinanceMobileNavItem key={path} label={label} path={path} Icon={Icon} isActive={active(path)} onNavigate={navigate} />)}
                <button type="button" onClick={() => navigate('/finanzas/movimientos?new=expense')} className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95" aria-label="Agregar movimiento"><Plus className="h-5 w-5" /></button>
                {items.slice(2).map(({ label, path, icon: Icon }) => <FinanceMobileNavItem key={path} label={label} path={path} Icon={Icon} isActive={active(path)} onNavigate={navigate} />)}
            </div>
        </nav>
    );
}

function FinanceMobileNavItem({ label, path, Icon, isActive, onNavigate }: { label: string; path: string; Icon: ComponentType<{ className?: string }>; isActive: boolean; onNavigate: (path: string) => void }) {
    return <button type="button" onClick={() => onNavigate(path)} className={cn('flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')} aria-current={isActive ? 'page' : undefined}><Icon className="h-5 w-5" /><span>{label}</span></button>;
}

export function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();
    const { theme, setTheme } = usePreferencesStore();

    const [unreadMsgs, setUnreadMsgs] = useUnreadCount('messages');
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const moreButtonRef = useRef<HTMLButtonElement>(null);
    const navRef = useRef<HTMLElement>(null);
    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const syncHeight = () => document.documentElement.style.setProperty('--finix-mobile-nav-height', `${nav.getBoundingClientRect().height}px`);
        const observer = new ResizeObserver(syncHeight);
        observer.observe(nav); syncHeight();
        return () => { observer.disconnect(); document.documentElement.style.removeProperty('--finix-mobile-nav-height'); };
    }, []);

    const isLight = theme === 'light' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);
    const visibleMainTabs = hasCommunityAccess(user)
        ? mainTabs
        : mainTabs.filter((tab) => tab.path !== '/comunidades');

    /* poll unread */
    useEffect(() => {
        if (location.pathname === '/messages') setUnreadMsgs(0);
    }, [location.pathname, setUnreadMsgs]);

    /* close panel on route change */
    useEffect(() => { setIsMoreOpen(false); }, [location.pathname]);

    /* close on Escape key and restore focus to trigger */
    useEffect(() => {
        if (!isMoreOpen) return;
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMoreOpen(false);
                moreButtonRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMoreOpen]);

    const isActive = (p: string) =>
        location.pathname === p ||
        (p !== '/dashboard' && location.pathname.startsWith(`${p}/`));

    const moreActive = ['/laboratorio', '/explore', '/market', '/calendario', '/calendar', '/portfolio', '/news', '/analysis', ...(isEducationEnabled() ? ['/educativa'] : []), '/profile', '/settings', '/notifications'].some(p => isActive(p));

    const moreLinks = [
        { label: 'Laboratorio Financiero', path: '/laboratorio', icon: FlaskConical },
        { label: 'Explorar',  path: '/explore',  icon: Compass     },
        { label: 'Mercado',   path: '/market',   icon: TrendingUp  },
        ...(isWatchlistEnabled() ? [{ label: 'Seguimiento', path: '/market/seguimiento', icon: Bookmark }] : []),
        ...(isEducationEnabled() ? [{ label: 'Educativa', path: '/educativa', icon: GraduationCap }] : []),
        { label: 'Calendario', path: '/calendario', icon: Calendar },
        { label: 'Portafolio',path: '/portfolio', icon: Briefcase   },
        { label: 'Noticias',  path: '/news',     icon: Newspaper   },
        { label: 'Análisis',  path: '/analysis', icon: AreaChart   },
        { label: 'Comunidades', path: '/comunidades', icon: Users },
        ...(user ? [
            { label: 'Mi Perfil', path: '/profile', icon: User },
            { label: 'Ajustes',   path: '/settings', icon: Settings },
        ] : []),
    ];

    const splitIndex = hasCommunityAccess(user) ? 2 : 1;
    const LEFT_TABS = visibleMainTabs.slice(0, splitIndex);
    const RIGHT_TABS = visibleMainTabs.slice(splitIndex);

    return (
        <>
            {/* ── BOTTOM BAR ──────────────────────────────── */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
                style={{
                    background: 'hsl(var(--sidebar-bg))',
                    borderTop: '1px solid hsl(var(--sidebar-border))',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                    paddingLeft: 'env(safe-area-inset-left)',
                    paddingRight: 'env(safe-area-inset-right)',
                    minHeight: 'calc(60px + env(safe-area-inset-bottom))',
                    boxSizing: 'border-box',
                }}
                ref={navRef}
                aria-label="Navegación inferior"
            >
                <div className="flex items-stretch justify-around min-h-[60px] py-1 px-1 gap-1">
                    {/* Left tabs */}
                    {LEFT_TABS.map(({ path, label, shortLabel, icon: Icon }) => {
                        const active = isActive(path);
                        return (
                            <Link
                                key={path}
                                to={path}
                                aria-label={label}
                                aria-current={active ? 'page' : undefined}
                                className="relative flex flex-col items-center justify-center min-w-0 flex-1 min-h-12 h-auto rounded-xl touch-manipulation px-1 focus-visible:ring-2 focus-visible:ring-primary"
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
                                <span
                                    className="text-[9px] min-[360px]:text-[9.5px] font-semibold mt-0.5 tracking-tight relative z-10 w-full truncate text-center leading-tight whitespace-nowrap"
                                    style={{ color: active ? PRIMARY : 'hsl(var(--muted-foreground))' }}
                                >
                                    {shortLabel ? (
                                        <>
                                            <span className="hidden min-[360px]:inline">{label}</span>
                                            <span className="min-[360px]:hidden">{shortLabel}</span>
                                        </>
                                    ) : (
                                        label
                                    )}
                                </span>
                            </Link>
                        );
                    })}

                    {/* ── CENTER CREATE BUTTON ──────────────── */}
                    <button
                        className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-primary"
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
                    {RIGHT_TABS.map(({ path, label, icon: Icon }) => {
                        const active = isActive(path);
                        const badge = path === '/messages' ? unreadMsgs : 0;
                        return (
                            <Link
                                key={path}
                                to={path}
                                aria-label={label}
                                aria-current={active ? 'page' : undefined}
                                className="relative flex flex-col items-center justify-center min-w-0 flex-1 min-h-12 h-auto rounded-xl touch-manipulation px-1 focus-visible:ring-2 focus-visible:ring-primary"
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
                                <span
                                    className="text-[9px] min-[360px]:text-[9.5px] font-semibold mt-0.5 tracking-tight relative z-10 w-full truncate text-center leading-tight whitespace-nowrap"
                                    style={{ color: active ? PRIMARY : 'hsl(var(--muted-foreground))' }}
                                >
                                    {label}
                                </span>
                                {badge > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-1 right-1.5 min-w-[15px] h-[15px] rounded-full text-[9px] font-bold flex items-center justify-center px-0.5 z-20"
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
                        ref={moreButtonRef}
                        type="button"
                        className="relative flex flex-col items-center justify-center min-w-0 flex-1 min-h-12 h-auto rounded-xl touch-manipulation px-1 focus-visible:ring-2 focus-visible:ring-primary"
                        onClick={() => setIsMoreOpen(v => !v)}
                        aria-label="Más herramientas y opciones"
                        aria-haspopup="dialog"
                        aria-expanded={isMoreOpen}
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
                        <span
                            className="text-[9px] min-[360px]:text-[9.5px] font-semibold mt-0.5 tracking-tight relative z-10 w-full truncate text-center leading-tight whitespace-nowrap"
                            style={{ color: moreActive || isMoreOpen ? PRIMARY : 'hsl(var(--muted-foreground))' }}
                        >
                            Más
                        </span>
                    </button>
                </div>
            </nav>

            {/* ── MORE PANEL (slide-up sheet) ──────────────── */}
            <AnimatePresence>
                {isMoreOpen && (
                    <DialogPrimitive.Root open={isMoreOpen} onOpenChange={setIsMoreOpen}><DialogPrimitive.Portal>
                        {/* Backdrop */}
                        <DialogPrimitive.Overlay asChild><motion.div
                            className="fixed inset-0 z-40 lg:hidden"
                            style={{ background: 'hsl(0 0% 0% / 0.5)', backdropFilter: 'blur(3px)' }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => {
                                setIsMoreOpen(false);
                                moreButtonRef.current?.focus();
                            }}
                            aria-hidden="true"
                        /></DialogPrimitive.Overlay>

                        {/* Sheet */}
                        <DialogPrimitive.Content asChild aria-describedby={undefined} onCloseAutoFocus={(event) => { event.preventDefault(); moreButtonRef.current?.focus(); }}><motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="more-menu-title"
                            className="fixed left-0 right-0 bottom-0 z-50 lg:hidden rounded-t-3xl overflow-hidden shadow-2xl"
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
                                    {user ? (
                                        <div
                                            className="flex items-center gap-3 cursor-pointer"
                                            onClick={() => {
                                                setIsMoreOpen(false);
                                                navigate('/profile');
                                            }}
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
                                                <p id="more-menu-title" className="font-bold text-[13.5px] leading-tight">{user?.username}</p>
                                                <p className="text-[11px] font-semibold text-primary mt-0.5">
                                                    Ver perfil →
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0">
                                                <img src="/logo-small.webp" alt="Finix" className="w-6 h-6 object-contain" />
                                            </div>
                                            <div>
                                                <p id="more-menu-title" className="font-bold text-[14px] leading-tight">Finix Inversiones</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Navegación y herramientas</p>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        aria-label="Cerrar menú de herramientas"
                                        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                                        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                                        onClick={() => {
                                            setIsMoreOpen(false);
                                            moreButtonRef.current?.focus();
                                        }}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {!user && (
                                    <div className="grid grid-cols-2 gap-2.5 px-4 pb-3">
                                        <Link
                                            to="/login"
                                            onClick={() => setIsMoreOpen(false)}
                                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 min-h-[44px] rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:opacity-95 transition-all focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            Iniciar sesión
                                        </Link>
                                        <Link
                                            to="/login?mode=signup"
                                            onClick={() => setIsMoreOpen(false)}
                                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 min-h-[44px] rounded-xl bg-secondary text-foreground font-semibold text-xs border border-border hover:bg-secondary/80 transition-all focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            Crear cuenta
                                        </Link>
                                    </div>
                                )}

                                {/* Search Trigger */}
                                <div className="px-4 pb-3">
                                    <button
                                        type="button"
                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary"
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
                                                type="button"
                                                className="flex flex-col items-center gap-2 py-3 rounded-2xl transition-all min-h-[72px] focus-visible:ring-2 focus-visible:ring-primary"
                                                style={{
                                                    background: active ? `hsl(var(--primary) / 0.1)` : 'hsl(var(--secondary))',
                                                    border: `1px solid ${active ? `hsl(var(--primary) / 0.25)` : 'hsl(var(--border))'}`,
                                                    color: active ? PRIMARY : 'hsl(var(--foreground))',
                                                }}
                                                onClick={() => {
                                                    setIsMoreOpen(false);
                                                    navigate(path);
                                                }}
                                            >
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center border border-black/30 dark:border-white/35 bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                                                    <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <span className="text-[11px] font-semibold text-center">{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mx-4 mb-3 h-px" style={{ background: 'hsl(var(--border) / 0.6)' }} />

                                {/* Utility row */}
                                <div className="px-4 pb-3 space-y-2">
                                    {/* Theme toggle */}
                                    <button
                                        type="button"
                                        className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-xl text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary"
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

                                    {/* Auth action */}
                                    {user ? (
                                        <button
                                            type="button"
                                            className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-xl text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
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
                                    ) : (
                                        <Link
                                            to="/login"
                                            onClick={() => setIsMoreOpen(false)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-[13px] font-bold text-primary-foreground bg-primary transition-all focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            Iniciar sesión en Finix
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div></DialogPrimitive.Content>
                    </DialogPrimitive.Portal></DialogPrimitive.Root>
                )}
            </AnimatePresence>
        </>
    );
}
