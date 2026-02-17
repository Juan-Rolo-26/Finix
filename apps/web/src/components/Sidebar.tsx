import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    PieChart,
    Settings,
    LogOut,
    User,
    TrendingUp,
    Newspaper,
    BarChart3
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useTranslation } from '../i18n';

export function Sidebar() {
    const location = useLocation();
    const { logout, user } = useAuthStore();
    const t = useTranslation();

    const links = [
        { name: t.nav.dashboard, path: '/dashboard', icon: LayoutDashboard },
        { name: t.nav.portfolio, path: '/portfolio', icon: PieChart },
        { name: t.nav.market, path: '/market', icon: TrendingUp },
        { name: t.nav.analysis, path: '/analysis', icon: BarChart3 },
        { name: t.nav.news, path: '/news', icon: Newspaper },
        { name: t.nav.profile, path: '/profile', icon: User },
        { name: t.nav.settings, path: '/settings', icon: Settings },
    ];

    return (
        <aside className="w-64 border-r border-border bg-card/30 backdrop-blur-xl h-screen flex flex-col fixed left-0 top-0 z-40 hidden lg:flex transition-all">
            <div className="p-6 border-b border-border/50 flex items-center justify-center">
                <img src="/logo.png" alt="Finix" className="h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {links.map((link) => {
                    const isActive = location.pathname === link.path
                        || (link.path !== '/dashboard' && location.pathname.startsWith(`${link.path}/`));
                    return (
                        <Link to={link.path} key={link.path}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-3 px-4 py-6 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-sm border border-primary/20"
                                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                )}
                            >
                                <link.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                <span className="font-medium">{link.name}</span>
                            </Button>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border/50 bg-secondary/10">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold truncate">{user?.username || 'Usuario'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full justify-start gap-2 border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30"
                    onClick={() => logout()}
                >
                    <LogOut className="w-4 h-4" />
                    <span>{t.nav.logout}</span>
                </Button>
            </div>
        </aside>
    );
}
