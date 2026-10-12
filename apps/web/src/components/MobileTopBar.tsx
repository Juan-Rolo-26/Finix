import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Sun, Moon, Plus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usePreferencesStore } from '../stores/preferencesStore';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { InvestorStreakPill } from '@/components/common/InvestorStreakPill';

const PRIMARY = 'hsl(var(--primary))';

export function MobileTopBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { theme, setTheme } = usePreferencesStore();

    const [unreadNotifs] = useUnreadCount('notifications');

    const isLight = theme === 'light' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

    const isMessages = location.pathname.startsWith('/messages');
    const headerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const header = headerRef.current;
        if (!header) return;
        const syncHeight = () => document.documentElement.style.setProperty('--finix-mobile-header-height', `${header.getBoundingClientRect().height}px`);
        const observer = new ResizeObserver(syncHeight);
        observer.observe(header);
        syncHeight();
        return () => { observer.disconnect(); document.documentElement.style.removeProperty('--finix-mobile-header-height'); };
    }, [isMessages]);
    // Messages has its own integrated header — render nothing there.
    if (isMessages) return null;

    return (
        <div
            ref={headerRef}
            className="fixed top-0 left-0 right-0 z-50 lg:hidden flex flex-wrap items-center justify-between gap-x-2 px-3 sm:px-4"
            style={{
                minHeight: 'calc(52px + env(safe-area-inset-top))',
                paddingTop: 'calc(4px + env(safe-area-inset-top))',
                paddingBottom: '4px',
                background: 'hsl(var(--sidebar-bg))',
                borderBottom: '1px solid hsl(var(--sidebar-border))',
            }}
        >
            {/* Logo */}
            <Link to="/dashboard" aria-label="Finix · Inicio" className="flex items-center gap-1.5 min-h-11 shrink-0 focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
                <img
                    src="/logo-small.webp"
                    alt="Finix"
                    className="h-7 w-7 sm:h-8 sm:w-8 object-contain flex-shrink-0"
                />
                <span
                    className="text-[15px] sm:text-[17px] font-black tracking-[0.08em] uppercase"
                    style={{ color: 'hsl(var(--foreground))' }}
                >
                    FINIX
                </span>
            </Link>

            {/* Actions */}
            <div className="ml-auto flex shrink-0 items-center gap-1">
                {/* Theme toggle */}
                <button
                    type="button"
                    aria-label={isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
                    className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    onClick={() => setTheme(isLight ? 'dark' : 'light')}
                >
                    {isLight ? <Moon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
                </button>

                {user ? (
                    <>
                        {/* Streak Pill */}
                        <div className="hidden min-[430px]:flex items-center shrink-0">
                            <InvestorStreakPill />
                        </div>

                        {/* Create post */}
                        <button
                            className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                            onClick={() => navigate('/explore?create=true')}
                            aria-label="Crear publicación"
                        >
                            <Plus className="w-[18px] h-[18px]" />
                        </button>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors relative focus-visible:ring-2 focus-visible:ring-primary"
                                style={{
                                    color: location.pathname === '/notifications' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                                    background: location.pathname === '/notifications' ? 'hsl(var(--muted))' : 'transparent',
                                }}
                                onClick={() => navigate('/notifications')}
                                aria-label="Notificaciones"
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
                        </div>

                        {/* Avatar → profile */}
                        <button
                            className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary"
                            style={{
                                background: `linear-gradient(135deg, ${PRIMARY} 0%, hsl(var(--primary) / 0.7) 100%)`,
                                boxShadow: `0 0 10px hsl(var(--primary) / 0.3)`,
                                color: 'hsl(var(--primary-foreground))',
                                fontSize: '13px',
                                fontWeight: 800,
                                padding: user?.avatarUrl ? 0 : undefined,
                            }}
                            onClick={() => navigate('/profile')}
                            aria-label="Mi perfil"
                        >
                            {user?.avatarUrl
                                ? <img src={resolveMediaUrl(user.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                                : (user?.username?.[0]?.toUpperCase() || (user as any)?.email?.[0]?.toUpperCase() || 'U')
                            }
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-1.5 ml-1">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-2.5 min-h-11 rounded-xl text-xs font-bold transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
                            style={{
                                background: PRIMARY,
                                color: 'hsl(var(--primary-foreground))',
                            }}
                        >
                            Iniciar sesión
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
