import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
    ArrowRight,
    BarChart3,
    Bell,
    Bookmark,
    Briefcase,
    Calendar,
    Check,
    ChevronDown,
    Flame,
    HelpCircle,
    LogOut,
    MessageSquare,
    Moon,
    Plus,
    Search,
    Settings,
    Sparkles,
    Sun,
    TrendingUp,
    User,
    Users
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { hasCommunityAccess, isProUser, useAuthStore } from '@/stores/authStore';
import { usePlatformAccessStore } from '@/stores/platformAccessStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { PLAN_NAMES, subscribedPlan } from '@/lib/plans';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { cn } from '@/lib/utils';
import { InvestorStreakPill } from '@/components/common/InvestorStreakPill';
import { useInvestorStreak } from '@/hooks/useInvestorStreak';

// Keep aliases in the same navigation group as their canonical Finix route.
function sectionPath(path: string) {
    if (['/mercado/seguimiento', '/market/watchlist'].includes(path)) return '/market/seguimiento';
    if (path === '/calendar') return '/calendario';
    if (path.startsWith('/analisis')) return path.replace('/analisis', '/analysis');
    if (path === '/social') return '/dashboard';
    if (path.startsWith('/mercado/')) return '/market';
    if (path.startsWith('/market/') && path !== '/market/seguimiento') return '/market';
    return path;
}

export function hasDesktopPageHero(path: string) {
    return sectionPath(path) === '/market/seguimiento' || path === '/news';
}

export function DesktopSectionNav() {
    return null;
}

const TOOLS_LIST = [
    {
        title: 'Mercado en Vivo',
        description: 'Cotizaciones, índices globales y variaciones en tiempo real.',
        path: '/market',
        icon: TrendingUp,
        accent: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40',
    },
    {
        title: 'Seguimiento (Watchlists)',
        description: 'Monitorea tus listas de activos prioritarios y alertas.',
        path: '/market/seguimiento',
        icon: Bookmark,
        accent: 'text-sky-500 bg-sky-500/10 border-sky-500/25 group-hover:bg-sky-500/20 group-hover:border-sky-500/40',
    },
    {
        title: 'Análisis Fundamental (DCF)',
        description: 'Modelos de valuación, múltiplos y flujo de fondos proyectado.',
        path: '/analysis',
        icon: BarChart3,
        accent: 'text-violet-500 bg-violet-500/10 border-violet-500/25 group-hover:bg-violet-500/20 group-hover:border-violet-500/40',
    },
    {
        title: 'Portafolio Institucional',
        description: 'Gestión de métricas, rendimiento y diversificación.',
        path: '/portfolio',
        icon: Briefcase,
        accent: 'text-amber-500 bg-amber-500/10 border-amber-500/25 group-hover:bg-amber-500/20 group-hover:border-amber-500/40',
    },
    {
        title: 'Calendario Económico',
        description: 'Resultados corporativos, dividendos y eventos macroeconómicos.',
        path: '/calendario',
        icon: Calendar,
        accent: 'text-rose-500 bg-rose-500/10 border-rose-500/25 group-hover:bg-rose-500/20 group-hover:border-rose-500/40',
    },
    {
        title: 'Top Rendimientos',
        description: 'Empresas con mayor rendimiento, volatilidad y volumen.',
        path: '/mercado/mejores-rendimientos',
        icon: Flame,
        accent: 'text-orange-500 bg-orange-500/10 border-orange-500/25 group-hover:bg-orange-500/20 group-hover:border-orange-500/40',
    },
];

export function DesktopNavigation({ onOpenSearch }: { onOpenSearch: () => void }) {
    const location = useLocation();
    const user = useAuthStore(state => state.user);
    const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
    const logout = useAuthStore(state => state.logout);
    const freeAccess = usePlatformAccessStore(state => state.freeAccessEnabled);
    const theme = usePreferencesStore(state => state.theme);
    const setTheme = usePreferencesStore(state => state.setTheme);
    const [messages] = useUnreadCount('messages');
    const [notifications] = useUnreadCount('notifications');
    const { streak } = useInvestorStreak();
    const path = sectionPath(location.pathname);
    const isLight = theme === 'light' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
    const isPro = isProUser(user) || user?.plan === 'PRO';
    const plan = isPro
        ? 'Finix PRO'
        : (freeAccess ? 'Acceso Libre' : (PLAN_NAMES[subscribedPlan(user)] || 'Finix Free'));

    const isToolsActive =
        path.startsWith('/market') ||
        path.startsWith('/mercado') ||
        path.startsWith('/analysis') ||
        path === '/calendario';

    return (
        <header className="desktop-header hidden lg:block" aria-label="Navegación de escritorio">
            <div className="desktop-header__inner">
                <div className="desktop-header__left">
                    <Link to="/dashboard" className="desktop-brand" aria-label="Finix, inicio">
                        <img src="/logo-small.webp" alt="" />
                        <span>FINIX</span>
                    </Link>

                    <nav className="desktop-primary-nav" aria-label="Navegación principal">
                        <Link
                            to="/dashboard"
                            aria-current={path === '/dashboard' || path === '/social' ? 'page' : undefined}
                        >
                            Inicio
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className="desktop-tools-trigger"
                                data-active={isToolsActive}
                                aria-label="Menú desplegable de herramientas"
                            >
                                <span>Herramientas</span>
                                <ChevronDown size={14} className="opacity-70 transition-transform duration-200" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="center"
                                sideOffset={14}
                                className="desktop-tools-menu"
                            >
                                <div className="desktop-tools-menu__layout">
                                    <div>
                                        <div className="desktop-tools-menu__label">
                                            <span>Investigación y Valoración</span>
                                            <span className="desktop-tools-menu__label-pill">Finix Tools</span>
                                        </div>
                                        <div className="desktop-tools-menu__grid">
                                            {TOOLS_LIST.map(tool => {
                                                const IconComponent = tool.icon;
                                                return (
                                                    <DropdownMenuItem key={tool.path} asChild>
                                                        <Link to={tool.path} className="desktop-tools-menu__item group">
                                                            <span className={cn("desktop-tools-menu__icon", tool.accent)}>
                                                                <IconComponent size={17} />
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <strong>{tool.title}</strong>
                                                                    <ArrowRight size={13} className="text-muted-foreground/40 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                                                                </div>
                                                                <small>{tool.description}</small>
                                                            </div>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Finix PRO Feature Card */}
                                    <div className="desktop-tools-promo">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="desktop-tools-promo__badge">
                                                    <Sparkles size={11} className="mr-1" />
                                                    FINIX PRO
                                                </span>
                                                <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">Plan</span>
                                            </div>
                                            <h3 className="desktop-tools-promo__title">
                                                Lleva tus inversiones al siguiente nivel
                                            </h3>
                                            <p className="desktop-tools-promo__desc">
                                                Accedé a herramientas institucionales diseñadas para inversores exigentes:
                                            </p>
                                            <ul className="desktop-tools-promo__features">
                                                <li>
                                                    <Check size={13} />
                                                    <span>Watchlists y alertas de precios</span>
                                                </li>
                                                <li>
                                                    <Check size={13} />
                                                    <span>Valuación DCF y múltiplos reales</span>
                                                </li>
                                                <li>
                                                    <Check size={13} />
                                                    <span>Comunidades privadas y salas</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <Link to="/pricing#planes" className="desktop-tools-promo__cta">
                                            <span>Explorar funcionalidades PRO</span>
                                            <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Link
                            to="/portfolio"
                            aria-current={path === '/portfolio' ? 'page' : undefined}
                        >
                            Portafolio
                        </Link>

                        <Link
                            to="/explore"
                            aria-current={path === '/explore' || path.startsWith('/explore/') ? 'page' : undefined}
                        >
                            Explorar
                        </Link>
                        <Link
                            to="/news"
                            aria-current={path === '/news' ? 'page' : undefined}
                        >
                            Noticias
                        </Link>
                        {(hasCommunityAccess(user) || freeAccess) && (
                            <Link
                                to="/comunidades"
                                aria-current={path === '/comunidades' || path.startsWith('/comunidades/') ? 'page' : undefined}
                            >
                                Comunidades
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="desktop-header__right">
                    <button type="button" className="desktop-search" onClick={onOpenSearch} aria-label="Buscar en Finix">
                        <Search size={15} className="shrink-0 text-primary" />
                        <span className="truncate">Buscar activos…</span>
                        <kbd className="hidden xl:inline-block">Ctrl K</kbd>
                    </button>
                    {user ? (
                        <>
                            <div className="hidden 2xl:flex items-center shrink-0">
                                <InvestorStreakPill />
                            </div>
                            <Link to="/pricing#planes" className="desktop-plan shrink-0" title="Planes y precios">
                                <Sparkles size={13} className="shrink-0" />
                                Planes
                            </Link>
                            <div className="desktop-header__actions shrink-0">
                                <Link to="/messages" className="desktop-icon-button" aria-label={messages > 0 ? `Mensajes, ${messages} sin leer` : 'Mensajes'}><MessageSquare size={18} />{messages > 0 && <span className="desktop-nav-dot" />}</Link>
                                <Link to="/notifications" className="desktop-icon-button" aria-label={notifications > 0 ? `Notificaciones, ${notifications} sin leer` : 'Notificaciones'}><Bell size={18} />{notifications > 0 && <span className="desktop-nav-dot" />}</Link>
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="desktop-account-trigger" aria-label="Mi cuenta"><span className="desktop-account-avatar">{user?.avatarUrl && user.avatarUrl !== failedAvatar ? <img src={resolveMediaUrl(user.avatarUrl)} alt="" onError={() => setFailedAvatar(user.avatarUrl || null)} /> : <User size={19} />}</span><ChevronDown size={12} /></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" sideOffset={12} className="desktop-account-menu">
                                        <DropdownMenuLabel className="p-3 pb-2.5">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="desktop-account-name font-semibold text-[13.5px] text-foreground tracking-tight truncate">
                                                    {user?.username || 'Mi cuenta'}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25 shrink-0">
                                                    🔥 {streak}d
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                                    <Sparkles size={11} className="text-emerald-500 shrink-0" />
                                                    {plan}
                                                </span>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link to="/profile" className="flex items-center gap-2.5 py-2 cursor-pointer group">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-500/10 text-blue-500 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
                                                    <User size={13} />
                                                </span>
                                                <span className="font-medium text-[13px]">Mi perfil</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/settings" className="flex items-center gap-2.5 py-2 cursor-pointer group">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-violet-500/10 text-violet-500 dark:text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-colors shrink-0">
                                                    <Settings size={13} />
                                                </span>
                                                <span className="font-medium text-[13px]">Configuraciones</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/settings?tab=suscripcion" className="flex items-center gap-2.5 py-2 cursor-pointer group">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                                                    <Briefcase size={13} />
                                                </span>
                                                <span className="font-medium text-[13px]">Mi plan y facturación</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/explore?create=true" className="flex items-center gap-2.5 py-2 cursor-pointer group">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
                                                    <Plus size={13} />
                                                </span>
                                                <span className="font-medium text-[13px]">Crear publicación</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => setTheme(isLight ? 'dark' : 'light')} className="flex items-center gap-2.5 py-2 cursor-pointer group">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                                                {isLight ? <Moon size={13} /> : <Sun size={13} />}
                                            </span>
                                            <span className="font-medium text-[13px]">{isLight ? 'Modo oscuro' : 'Modo claro'}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/help" className="flex items-center gap-2.5 py-2 cursor-pointer group">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-sky-500/10 text-sky-500 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors shrink-0">
                                                    <HelpCircle size={13} />
                                                </span>
                                                <span className="font-medium text-[13px]">Ayuda</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/about" className="flex items-center gap-2.5 py-2 cursor-pointer group">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-teal-500/10 text-teal-500 dark:text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors shrink-0">
                                                    <Users size={13} />
                                                </span>
                                                <span className="font-medium text-[13px]">Sobre Finix</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={logout} className="flex items-center gap-2.5 py-2 cursor-pointer text-rose-500 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-500/10 group">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-rose-500/10 text-rose-500 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors shrink-0">
                                                <LogOut size={13} />
                                            </span>
                                            <span className="font-medium text-[13px]">Cerrar sesión</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </>
                    ) : (
                        <div className="desktop-header__actions desktop-header__actions--guest flex items-center gap-3">
                            <Link to="/pricing#planes" className="desktop-plan-link text-sm font-semibold px-2 py-1 text-muted-foreground hover:text-foreground transition-colors">Planes</Link>
                            <Link to="/login" className="desktop-plan" title="Iniciar sesión">Iniciar sesión</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
