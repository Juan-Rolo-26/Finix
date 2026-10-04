import { prefetchRoute } from '@/lib/routePrefetch';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { BottomNav, FinanceMobileNav } from '../components/BottomNav';
import { MobileTopBar } from '../components/MobileTopBar';
import { lazy, Suspense, useState, useEffect } from 'react';
import { usePreferencesStore } from '../stores/preferencesStore';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const GlobalSearch = lazy(() => import('../components/GlobalSearch').then(module => ({ default: module.GlobalSearch })));

export default function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isMessages = location.pathname.startsWith('/messages');
    const isFinance = location.pathname.startsWith('/finanzas');
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
        <div onPointerOver={event => {
            const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
            if (link?.origin === window.location.origin) prefetchRoute(link.pathname);
        }} onFocus={event => {
            const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
            if (link?.origin === window.location.origin) prefetchRoute(link.pathname);
        }} className="min-h-screen w-full max-w-[100vw] overflow-x-clip bg-background text-foreground flex">
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
                    className={`flex-1 min-w-0 flex flex-col w-full max-w-full overflow-x-clip ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-[276px]'}`}
                >
                    <ErrorBoundary key={location.pathname} fallbackTitle="Error al cargar la página" fallbackMessage="Ocurrió un error inesperado al renderizar esta sección. Podés reintentar para recargar los datos.">
                        <Suspense fallback={<div className="m-6 h-64 rounded-2xl bg-muted/30 animate-pulse" role="status" aria-label="Cargando sección" />}><Outlet /></Suspense>
                    </ErrorBoundary>
                </main>
            </div>

            {/* Bottom Nav — mobile only */}
            {isFinance
                ? <FinanceMobileNav location={location} navigate={navigate} />
                : <BottomNav />}
            {isSearchOpen && <Suspense fallback={null}><GlobalSearch isOpen onClose={() => setIsSearchOpen(false)} /></Suspense>}
        </div>
    );
}
