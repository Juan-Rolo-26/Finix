import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { MobileTopBar } from '../components/MobileTopBar';
import { GlobalSearch } from '../components/GlobalSearch';
import { useState, useEffect } from 'react';
import { usePreferencesStore } from '../stores/preferencesStore';

export default function DashboardLayout() {
    const location = useLocation();
    const isMessages = location.pathname.startsWith('/messages');
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
        <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background text-foreground flex">
            {/* Sidebar — desktop only */}
            <Sidebar />

            {/* Top Bar — mobile only (hidden on /messages) */}
            <MobileTopBar />

            {/*
             * Main Content Area
             * The mobile top and bottom bars are fixed, so the content gets
             * their real heights (including iOS safe-area insets) reserved.
             * lg: sidebar is 276px expanded, 72px collapsed.
             *     We use a wide margin and let content scroll. The sidebar manages its own width.
             */}
            <div
                className={`flex-1 min-w-0 transition-all duration-300 flex flex-col min-h-screen lg:pt-0 lg:pb-0 ${isMessages ? 'pt-0' : 'pt-[calc(52px+env(safe-area-inset-top))]'} pb-[calc(60px+env(safe-area-inset-bottom))]`}
                style={{
                    marginLeft: 0,
                }}
            >
                {/* The sidebar is fixed, so we add padding-left on desktop to avoid overlap. */}
                <div className="hidden lg:block flex-shrink-0" style={{ width: 0, minWidth: collapsed ? '72px' : '276px', display: 'none' }} />
                <main
                    className={`flex-1 min-w-0 flex flex-col w-full max-w-full overflow-x-hidden ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-[276px]'}`}
                    style={{
                        transition: 'padding-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <Outlet />
                </main>
            </div>

            {/* Bottom Nav — mobile only */}
            <BottomNav />
            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
}
