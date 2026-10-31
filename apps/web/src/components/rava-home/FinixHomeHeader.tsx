import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Moon, Sun, User } from 'lucide-react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useAuthStore } from '@/stores/authStore';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { FinixHomeDrawer } from './FinixHomeDrawer';

export interface FinixHomeHeaderProps {
    onOpenSearch?: () => void;
}

export function FinixHomeHeader({ onOpenSearch }: FinixHomeHeaderProps) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { theme, setTheme } = usePreferencesStore();
    const { user, token } = useAuthStore();
    const navigate = useNavigate();

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <>
            <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border/80 transition-colors">
                <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-14 md:h-16 flex items-center justify-between">
                    {/* Left: Hamburger menu */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="p-2 rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors focus:outline-none"
                            aria-label="Abrir menú de navegación"
                        >
                            <Menu className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </div>

                    {/* Center: Brand Logo with official Finix images */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                        <Link
                            to="/"
                            className="flex items-center group select-none focus:outline-none"
                            aria-label="Finix Inicio"
                        >
                            <img
                                src="/finix-brand-logo.png"
                                alt="Finix"
                                className="h-8 sm:h-9 md:h-10 w-auto object-contain transition-transform group-hover:scale-105 dark:hidden drop-shadow-sm"
                            />
                            <img
                                src="/finix-brand-logo-white.png"
                                alt="Finix"
                                className="h-8 sm:h-9 md:h-10 w-auto object-contain transition-transform group-hover:scale-105 hidden dark:block drop-shadow-sm"
                            />
                        </Link>
                    </div>

                    {/* Right: Actions with Finix brand colors */}
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        {/* Search Icon */}
                        <button
                            onClick={onOpenSearch}
                            className="p-2 rounded-full text-foreground/75 hover:text-emerald-500 hover:bg-muted/60 transition-colors focus:outline-none"
                            aria-label="Buscar activos o cotizaciones"
                            title="Buscar activo"
                        >
                            <Search className="w-4 h-4 md:w-5 md:h-5" />
                        </button>

                        {/* Theme Toggle (Moon / Sun) */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-foreground/75 hover:text-foreground hover:bg-muted/60 transition-colors focus:outline-none"
                            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                            title={isDark ? 'Modo claro' : 'Modo oscuro'}
                        >
                            {isDark ? (
                                <Sun className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                            ) : (
                                <Moon className="w-4 h-4 md:w-5 md:h-5 text-slate-700" />
                            )}
                        </button>

                        {/* User CTA Buttons in Finix Emerald */}
                        {token && user ? (
                            <Link
                                to="/profile"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-foreground transition-all"
                            >
                                <div className="relative w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
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
                                    <span>{user.username ? user.username[0].toUpperCase() : 'U'}</span>
                                </div>
                                <span className="hidden sm:inline max-w-[80px] truncate">{user.username || 'Mi Perfil'}</span>
                            </Link>
                        ) : (
                            <>
                                {/* Abrí tu cuenta (Finix Emerald CTA) */}
                                <button
                                    onClick={() => navigate('/login?tab=register')}
                                    className="hidden sm:inline-flex items-center justify-center px-4 md:px-5 py-1.5 md:py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-[13px] font-black shadow-sm shadow-emerald-600/25 transition-all hover:shadow active:scale-95"
                                >
                                    Abrí tu cuenta
                                </button>

                                {/* Clientes */}
                                <button
                                    onClick={() => navigate('/login')}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs md:text-[13px] font-bold text-foreground/85 hover:text-emerald-500 hover:bg-muted/50 transition-colors"
                                >
                                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span className="hidden xs:inline">Clientes</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Slide-out navigation drawer */}
            <FinixHomeDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
    );
}
