import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Users, FileText, AlertTriangle, LogOut, Menu } from 'lucide-react';

export default function AdminLayout() {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('auth-token');
        navigate('/login');
    };

    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Usuarios', path: '/users', icon: Users },
        { name: 'Publicaciones', path: '/posts', icon: FileText },
        { name: 'Reportes', path: '/reports', icon: AlertTriangle },
    ];

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex font-sans">
            {/* Mobile Sidebar Toggle */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-zinc-800 rounded-lg border border-zinc-700 text-zinc-300"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#09090b] border-r border-zinc-800/60 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center gap-3 h-16 px-6 border-b border-zinc-800/60 shrink-0">
                    <Shield className="w-6 h-6 text-emerald-500" />
                    <span className="font-bold text-lg tracking-tight text-emerald-500">Finix Admin</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {links.map((link) => (
                        <NavLink
                            key={link.name}
                            to={link.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20'
                                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                                }`
                            }
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <link.icon className="w-4 h-4 flex-shrink-0" />
                            {link.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-800/60 shrink-0">
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
