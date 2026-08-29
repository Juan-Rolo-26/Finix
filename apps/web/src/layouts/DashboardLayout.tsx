import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { MobileTopBar } from '../components/MobileTopBar';

export default function DashboardLayout() {
    const location = useLocation();
    const isMessages = location.pathname.startsWith('/messages');
    const isComunidad = location.pathname.startsWith('/comunidad');

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
                {/* The sidebar is fixed, so we add padding-left on desktop to avoid overlap.
                    We use lg:pl-[276px] as the default (expanded). When sidebar collapses it updates
                    to pl-[72px] via inline style – but since sidebar is fixed-position, we don't
                    need to track this here. The content naturally fills the remaining space.
                    We use a simpler approach: just set a permanent lg margin. */}
                <div className="hidden lg:block flex-shrink-0" style={{ width: 0, minWidth: '276px', display: 'none' }} />
                <main
                    className="flex-1 flex flex-col w-full lg:pl-[276px]"
                    style={{
                        transition: 'padding-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <Outlet />
                </main>
            </div>

            {/* Bottom Nav — mobile only */}
            <BottomNav />
        </div>
    );
}
