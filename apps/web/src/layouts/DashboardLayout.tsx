import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export default function DashboardLayout() {

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area — no padding here; each page owns its own spacing */}
            <div className="flex-1 lg:ml-[300px] transition-all duration-300 flex flex-col min-h-screen">
                <main className="flex-1 flex flex-col w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
