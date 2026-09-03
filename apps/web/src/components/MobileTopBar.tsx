import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Sun, Moon, Plus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usePreferencesStore } from '../stores/preferencesStore';
import { apiFetch } from '../lib/api';

const PRIMARY = 'hsl(var(--primary))';

export function MobileTopBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { theme, setTheme } = usePreferencesStore();

    const [unreadNotifs, setUnreadNotifs] = useState(0);

    const isLight = theme === 'light' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

    const isMessages = location.pathname.startsWith('/messages');

    useEffect(() => {
        if (isMessages) return;
        const loadUnreadCount = async () => {
            try {
                const res = await apiFetch('/notifications/unread-count');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadNotifs(data.count ?? 0);
                }
            } catch { }
        };
        loadUnreadCount();
        const iv = setInterval(loadUnreadCount, 30_000);
        return () => clearInterval(iv);
    }, [isMessages]);

    // Messages has its own full-screen header — render nothing
    if (isMessages) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-50 lg:hidden flex items-center justify-between px-4"
            style={{
                height: '52px',
                background: 'hsl(var(--sidebar-bg))',
                borderBottom: '1px solid hsl(var(--sidebar-border))',
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-2.5" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                <img
                    src="/logo.png"
                    alt="Finix"
                    className="h-8 w-8 object-contain flex-shrink-0"
                />
                <span
                    className="text-[17px] font-black tracking-[0.12em] uppercase"
                    style={{ color: 'hsl(var(--foreground))' }}
                >
                    FINIX
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                {/* Theme toggle */}
                <button
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    onClick={() => setTheme(isLight ? 'dark' : 'light')}
                >
                    {isLight ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
                </button>

                {/* Create post */}
                <button
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    onClick={() => navigate('/explore?create=true')}
                >
                    <Plus className="w-[18px] h-[18px]" />
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors relative"
                        style={{
                            color: location.pathname === '/notifications' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                            background: location.pathname === '/notifications' ? 'hsl(var(--muted))' : 'transparent',
                        }}
                        onClick={() => navigate('/notifications')}
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
                    className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 ml-1"
                    style={{
                        background: `linear-gradient(135deg, ${PRIMARY} 0%, hsl(var(--primary) / 0.7) 100%)`,
                        boxShadow: `0 0 10px hsl(var(--primary) / 0.3)`,
                        color: 'hsl(var(--primary-foreground))',
                        fontSize: '13px',
                        fontWeight: 800,
                    }}
                    onClick={() => navigate('/profile')}
                >
                    {user?.username?.[0]?.toUpperCase() || 'F'}
                </button>
            </div>
        </div>
    );
}
