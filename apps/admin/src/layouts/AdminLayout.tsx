import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Users, FileText, AlertTriangle, LogOut, Menu, ScrollText, Newspaper, BadgeCheck, Sun, Moon, BarChart, Globe, Star, BarChart2, TrendingUp, Calendar } from 'lucide-react';
import { adminFetch } from '../lib/api';

export default function AdminLayout() {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('admin-theme') as 'light' | 'dark') || 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('admin-theme', theme);
    }, [theme]);

    const handleLogout = async () => {
        await adminFetch('/admin/auth/logout', { method: 'POST' });
        navigate('/login');
    };

    const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Estadísticas', path: '/statistics', icon: BarChart },
        { name: 'Usuarios', path: '/users', icon: Users },
        { name: 'Usuarios PRO', path: '/pro-users', icon: Star },
        { name: 'Comunidades', path: '/communities', icon: Globe },
        { name: 'Publicaciones', path: '/posts', icon: FileText },
        { name: 'Noticias', path: '/news', icon: Newspaper },
        { name: 'Rankings S&P 500', path: '/market-rankings', icon: TrendingUp },
        { name: 'Calendario', path: '/calendar', icon: Calendar },
        { name: 'Análisis (Pro)', path: '/analysis', icon: BarChart2 },
        { name: 'Verificaciones', path: '/verifications', icon: BadgeCheck },
        { name: 'Reportes', path: '/reports', icon: AlertTriangle },
        { name: 'Auditoría', path: '/audit-logs', icon: ScrollText },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex font-sans">
            {/* Mobile Sidebar Toggle */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-card rounded-lg border border-border text-foreground shadow-md hover:bg-muted transition-colors"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-primary" />
                        <span className="font-bold text-lg tracking-tight text-primary">Finix Admin</span>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
                        title={theme === 'light' ? 'Cambiar a oscuro' : 'Cambiar a claro'}
                    >
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {links.map((link) => (
                        <NavLink
                            key={link.name}
                            to={link.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                                }`
                            }
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <link.icon className="w-4 h-4 flex-shrink-0" />
                            {link.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-border shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            setIsMobileMenuOpen(false);
                        }
                    }}
                    role="button"
                    tabIndex={0}
                />
            )}

            {/* Main content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
                <div className="flex-1 p-6 md:p-8 xl:p-10 container mx-auto max-w-7xl animate-in fade-in duration-500">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
