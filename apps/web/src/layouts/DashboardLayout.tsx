import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { MobileTopBar } from '../components/MobileTopBar';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import { GlobalSearch } from '../components/GlobalSearch';
import { useState, useEffect } from 'react';
import { usePreferencesStore } from '../stores/preferencesStore';

export default function DashboardLayout() {
    const location = useLocation();
    const isMessages = location.pathname.startsWith('/messages');
    const isComunidad = location.pathname.startsWith('/comunidad');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const collapsed = usePreferencesStore(s => s.sidebarCollapsed);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        const handleCustomOpen = () => setIsSearchOpen(true);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('finix:open-search', handleCustomOpen);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('finix:open-search', handleCustomOpen);
        };
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Sidebar — desktop only */}
            <Sidebar />

            {/* Top Bar — mobile only (hidden on /messages) */}
            <MobileTopBar />

            {/*
             * Main Content Area
             * pt-[52px] = mobile topbar height
             * pb-[60px] = mobile bottom nav height (updated to 60px)
             * lg: sidebar is 276px expanded, 72px collapsed.
             *     We use a wide margin and let content scroll. The sidebar manages its own width.
             */}
            <div
                className={`flex-1 min-w-0 transition-all duration-300 flex flex-col min-h-screen lg:pt-0 lg:pb-0 ${(isMessages || isComunidad) ? 'pt-0 pb-[60px]' : 'pt-[52px] pb-[60px]'
                    }`}
                style={{
                    marginLeft: 0,
                }}
            >
                {/* The sidebar is fixed, so we add padding-left on desktop to avoid overlap. */}
                <div className="hidden lg:block flex-shrink-0" style={{ width: 0, minWidth: collapsed ? '72px' : '276px', display: 'none' }} />
                <main
                    className={`flex-1 flex flex-col w-full ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-[276px]'}`}
                    style={{
                        transition: 'padding-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <Outlet />
                </main>
            </div>

            {/* Bottom Nav — mobile only */}
            <BottomNav />
            <PWAInstallPrompt />
            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
}
