import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/i18n';
import { useAuthStore } from '../stores/authStore';
import { usePreferencesStore } from '../stores/preferencesStore';
import { usePlatformAccessStore } from '../stores/platformAccessStore';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useInvestorStreak } from '@/hooks/useInvestorStreak';
import { subscribedPlan } from '../lib/plans';
import { resolveMediaUrl } from '../lib/mediaUrl';
import {
    Menu,
    Search,
    Sun,
    Moon,
    User,
    Bell,
    Settings,
    LogOut,
    Sparkles,
    HelpCircle,
    Info,
    ChevronDown,
    Flame,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { FinixHomeDrawer } from './rava-home/FinixHomeDrawer';

const PLAN_NAMES: Record<string, string> = {
    FREE: 'Finix Free',
    PRO: 'Finix PRO',
    BLACK: 'Finix Black',
};

export function DesktopNavigation({ onOpenSearch }: { onOpenSearch: () => void }) {
    const { ui } = useTranslation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [failedAvatar, setFailedAvatar] = useState<string | null>(null);

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const freeAccess = usePlatformAccessStore((state) => state.freeAccessEnabled);
    const theme = usePreferencesStore((state) => state.theme);
    const setTheme = usePreferencesStore((state) => state.setTheme);

    const [notifications] = useUnreadCount('notifications');
    const { streak } = useInvestorStreak();

    const isLight =
        theme === 'light' ||
        (theme === 'system' &&
            typeof window !== 'undefined' &&
            Boolean(window.matchMedia?.('(prefers-color-scheme: light)').matches));

    const toggleTheme = () => {
        setTheme(isLight ? 'dark' : 'light');
    };

    const isPro = user?.plan === 'PRO';
    const plan = isPro
        ? 'Finix PRO'
        : freeAccess
        ? ui('Acceso Libre')
        : PLAN_NAMES[subscribedPlan(user)] || 'Finix Free';

    return (
        <>
            <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border/80 transition-colors">
                <div className="finix-fluid-container relative mx-auto h-11 sm:h-12 flex items-center justify-between">
                    {/* Left: Hamburger menu button only (like Rava) */}
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-foreground hover:bg-muted/70 transition-colors focus:outline-none cursor-pointer"
                            aria-label="Abrir menú de navegación"
                            title="Menú principal"
                        >
                            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>

                    {/* Center: Brand Logo centered (like Rava) */}
                    <div className="absolute left-14 sm:left-1/2 sm:-translate-x-1/2 flex items-center">
                        <Link
                            to="/"
                            className="flex items-center group select-none focus:outline-none"
                            aria-label="Finix Inicio"
                        >
                            <img
                                src="/finix-brand-logo.png"
                                alt="Finix"
                                className="h-4.5 sm:h-5 md:h-5.5 w-auto object-contain transition-transform group-hover:scale-105 dark:hidden drop-shadow-xs"
                            />
                            <img
                                src="/finix-brand-logo-white.png"
                                alt="Finix"
                                className="h-4.5 sm:h-5 md:h-5.5 w-auto object-contain transition-transform group-hover:scale-105 hidden dark:block drop-shadow-xs"
                            />
                        </Link>
                    </div>

                    {/* Right: Search, Theme, Notifications & User / Guest actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Search trigger (compact icon button like Rava) */}
                        <button
                            type="button"
                            onClick={onOpenSearch}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-muted/70 transition-colors focus:outline-none cursor-pointer"
                            aria-label="Buscar en Finix"
                            title="Buscar activos o cotizaciones (Ctrl K)"
                        >
                            <Search className="w-4 h-4" />
                        </button>

                        {/* Theme Toggle (Moon / Sun) */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-muted/70 transition-colors focus:outline-none cursor-pointer"
                            aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                            title={isLight ? 'Modo oscuro' : 'Modo claro'}
                        >
                            {isLight ? (
                                <Moon className="w-4 h-4 text-slate-700" />
                            ) : (
                                <Sun className="w-4 h-4 text-amber-400" />
                            )}
                        </button>

                        {user ? (
                            <>
                                {/* Notifications */}
                                <Link
                                    to="/notifications"
                                    className="relative w-8 h-8 inline-flex items-center justify-center rounded-full text-foreground/75 hover:text-foreground hover:bg-muted/70 transition-colors hidden sm:inline-flex cursor-pointer"
                                    aria-label="Notificaciones"
                                    title="Notificaciones"
                                >
                                    <Bell className="w-4 h-4" />
                                    {notifications > 0 && (
                                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    )}
                                </Link>

                                {/* User Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="flex items-center gap-1 p-0.5 rounded-full border border-border/80 hover:bg-muted/70 transition-colors focus:outline-none cursor-pointer">
                                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[0.6875rem]">
                                            {user.avatarUrl && user.avatarUrl !== failedAvatar ? (
                                                <img
                                                    src={resolveMediaUrl(user.avatarUrl)}
                                                    alt={user.username || 'Usuario'}
                                                    onError={() => setFailedAvatar(user.avatarUrl || null)}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-3.5 h-3.5" />
                                            )}
                                        </div>
                                        <ChevronDown className="w-3 h-3 text-muted-foreground mr-0.5" />
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" sideOffset={8} className="w-56 p-1.5">
                                        <DropdownMenuLabel className="p-2 pb-1.5">
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <span className="font-bold text-sm text-foreground truncate">
                                                    {user.username || 'Mi cuenta'}
                                                </span>
                                                <span className="text-[0.65625rem] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 inline-flex items-center gap-1">
                                                    <Flame className="w-3 h-3 text-amber-500" />
                                                    <span>{streak}d</span>
                                                </span>
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.65625rem] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                <Sparkles className="w-3 h-3 text-emerald-500" />
                                                {plan}
                                            </span>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem asChild>
                                            <Link to="/profile" className="flex items-center gap-2 p-2 cursor-pointer">
                                                <User className="w-4 h-4 text-blue-500" />
                                                <span className="text-xs font-semibold">Mi perfil</span>
                                            </Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem asChild>
                                            <Link to="/pricing#planes" className="flex items-center gap-2 p-2 cursor-pointer">
                                                <Sparkles className="w-4 h-4 text-emerald-500" />
                                                <span className="text-xs font-semibold">Planes & Suscripción</span>
                                            </Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem asChild>
                                            <Link to="/settings" className="flex items-center gap-2 p-2 cursor-pointer">
                                                <Settings className="w-4 h-4 text-violet-500" />
                                                <span className="text-xs font-semibold">Configuración</span>
                                            </Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem asChild>
                                            <Link to="/help" className="flex items-center gap-2 p-2 cursor-pointer">
                                                <HelpCircle className="w-4 h-4 text-sky-500" />
                                                <span className="text-xs font-semibold">Ayuda & FAQ</span>
                                            </Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem asChild>
                                            <Link to="/about" className="flex items-center gap-2 p-2 cursor-pointer">
                                                <Info className="w-4 h-4 text-teal-500" />
                                                <span className="text-xs font-semibold">Sobre Finix</span>
                                            </Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            onSelect={logout}
                                            className="flex items-center gap-2 p-2 cursor-pointer text-rose-500 focus:text-rose-600 focus:bg-rose-500/10"
                                        >
                                            <LogOut className="w-4 h-4 text-rose-500" />
                                            <span className="text-xs font-semibold">Cerrar sesión</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                {/* Abrí tu cuenta — Finix Signature Emerald Pill Button */}
                                <Link
                                    to="/register"
                                    className="hidden sm:inline-flex px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[0.71875rem] sm:text-xs font-bold shadow-xs shadow-emerald-600/20 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    Abrí tu cuenta
                                </Link>

                                {/* Clientes */}
                                <Link
                                    to="/login"
                                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[0.71875rem] sm:text-xs font-bold text-foreground/85 hover:text-emerald-500 hover:bg-muted/50 transition-colors whitespace-nowrap"
                                >
                                    <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Clientes</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Slide-out navigation drawer */}
            <FinixHomeDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
    );
}
