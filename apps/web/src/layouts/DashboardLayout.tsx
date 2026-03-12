import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { MobileTopBar } from '../components/MobileTopBar';

export default function DashboardLayout() {
    const location = useLocation();
    const isMessages = location.pathname.startsWith('/messages');

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Sidebar — desktop only */}
            <Sidebar />

            {/* Top Bar — mobile only (hidden on /messages) */}
            <MobileTopBar />

            {/* Main Content Area */}
            {/* pt-[52px] = mobile topbar height | pb-14 = mobile bottom nav | lg: reset both */}
            {/* On /messages: no top padding (page has its own header), keep bottom nav space */}
            <div
                className={`flex-1 lg:ml-[300px] transition-all duration-300 flex flex-col min-h-screen lg:pt-0 lg:pb-0 ${
                    isMessages ? 'pt-0 pb-14' : 'pt-[52px] pb-14'
                }`}
            >
                <main className="flex-1 flex flex-col w-full">
                    <Outlet />
                </main>
            </div>

            {/* Bottom Nav — mobile only */}
            <BottomNav />
        </div>
    );
}
