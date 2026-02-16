import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export default function DashboardLayout() {
    const location = useLocation();
    const isMarketRoute = location.pathname.startsWith('/market');

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 lg:ml-64 transition-all duration-300">
                <main className={`p-4 md:p-8 w-full mx-auto ${isMarketRoute ? 'max-w-[110rem]' : 'max-w-7xl'}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
