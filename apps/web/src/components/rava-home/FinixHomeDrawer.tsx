import { Link, useNavigate } from 'react-router-dom';
import {
    X,
    TrendingUp,
    BarChart3,
    FlaskConical,
    Bookmark,
    Newspaper,
    Calendar,
    Briefcase,
    Settings,
    LogOut,
    LogIn,
    UserPlus,
    Compass,
    Award,
    ArrowRight,
    Crown,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { resolveMediaUrl } from '@/lib/mediaUrl';

export interface FinixHomeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavLinkItem {
    label: string;
    path: string;
    icon: any;
    badge?: string;
    isPro?: boolean;
}

export function FinixHomeDrawer({ isOpen, onClose }: FinixHomeDrawerProps) {
    const { user, token, logout } = useAuthStore();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const navLinks: NavLinkItem[] = [
        { label: 'Inicio', path: '/', icon: Compass, badge: 'Home' },
        { label: 'Mercados & Cotizaciones', path: '/market', icon: TrendingUp },
        { label: 'Laboratorio Financiero', path: '/laboratorio', icon: FlaskConical, isPro: true },
        { label: 'Análisis Fundamental (DCF)', path: '/analysis', icon: BarChart3, isPro: true },
        { label: 'Noticias Financieras', path: '/news', icon: Newspaper, isPro: true },
        { label: 'Calendario Económico', path: '/calendario', icon: Calendar, isPro: true },
        { label: 'Mi Portafolio', path: '/portfolio', icon: Briefcase, isPro: true },
        { label: 'Seguimiento (Watchlists)', path: '/market/seguimiento', icon: Bookmark, isPro: true },
        { label: 'Mejores Rendimientos', path: '/mercado/mejores-rendimientos', icon: Award, isPro: true },
    ];

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
                aria-hidden="true"
            />

            {/* Drawer Panel */}
            <div className="relative w-full max-w-xs bg-card text-card-foreground h-full shadow-2xl flex flex-col z-10 border-r border-border animate-in slide-in-from-left duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/70">
                    <div className="flex items-center gap-2">
                        <img
                            src="/finix-brand-logo.png"
                            alt="Finix"
                            className="h-7 sm:h-8 w-auto object-contain dark:hidden"
                        />
                        <img
                            src="/finix-brand-logo-white.png"
                            alt="Finix"
                            className="h-7 sm:h-8 w-auto object-contain hidden dark:block"
                        />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        aria-label="Cerrar menú"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User info if logged in */}
                {user && (
                    <Link
                        to="/profile"
                        onClick={onClose}
                        className="p-4 border-b border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center gap-3 cursor-pointer group"
                    >
                        <div className="relative w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/30 overflow-hidden shrink-0">
                            {user.avatarUrl ? (
                                <img
                                    src={resolveMediaUrl(user.avatarUrl)}
                                    alt={user.username || 'Avatar'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                    }}
                                />
                            ) : null}
                            <span className="select-none">
                                {user.username ? user.username[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold truncate text-foreground group-hover:text-primary transition-colors">
                                    {user.username || user.email}
                                </p>
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[0.5625rem] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    <Crown className="w-2 h-2 fill-amber-400 text-amber-500" />
                                    PRO
                                </span>
                            </div>
                            <p className="text-[0.6875rem] text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </Link>
                )}

                {/* Navigation links */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {navLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[0.8125rem] font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span>{item.label}</span>
                                </div>
                                {item.isPro ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[0.625rem] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs group-hover:bg-emerald-500/25 group-hover:border-emerald-500/50 transition-all">
                                        <Crown className="w-2.5 h-2.5 fill-amber-400 text-amber-500 shrink-0" />
                                        <span>PRO</span>
                                    </span>
                                ) : item.badge ? (
                                    <span className="text-[0.625rem] font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                                        {item.badge}
                                    </span>
                                ) : (
                                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="p-3 border-t border-border/70 bg-muted/10 space-y-2">
                    {token && user ? (
                        <>
                            <Link
                                to="/settings"
                                onClick={onClose}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Configuración</span>
                            </Link>
                            <button
                                onClick={() => {
                                    logout();
                                    onClose();
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Cerrar sesión</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/register');
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm shadow-emerald-600/25"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Registrarse</span>
                            </button>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/login');
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-border hover:bg-muted/40 text-foreground font-semibold text-xs transition-colors"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Iniciar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
