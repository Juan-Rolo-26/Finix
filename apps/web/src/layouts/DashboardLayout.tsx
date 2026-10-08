import { prefetchRoute } from '@/lib/routePrefetch';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DesktopNavigation } from '../components/DesktopNavigation';
import { BottomNav, FinanceMobileNav } from '../components/BottomNav';
import { MobileTopBar } from '../components/MobileTopBar';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useGlobalSearchState } from '@/hooks/useGlobalSearchState';
import { ScrollToTopButton } from '@/components/common/ScrollToTopButton';
import './desktop.css';
import './desktop-sections.css';
import './desktop-social.css';

const GlobalSearch = lazy(() => import('../components/GlobalSearch').then(module => ({ default: module.GlobalSearch })));

export default function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isMessages = location.pathname.startsWith('/messages');
    const isFinance = location.pathname.startsWith('/finanzas');
    const page = location.pathname.split('/')[1];
    const desktopLayout = ['dashboard', 'social', 'market', 'mercado', 'portfolio', 'news'].includes(page)
        ? 'existing'
        : page === 'messages' ? 'chat'
            : page === 'explore' || location.pathname === '/settings/plan' ? 'sectioned'
                : 'standard';
    const { isSearchOpen, openSearch, closeSearch } = useGlobalSearchState();

    return (
        <div onPointerOver={event => {
            const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
            if (link?.origin === window.location.origin) prefetchRoute(link.pathname);
        }} onFocus={event => {
            const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
            if (link?.origin === window.location.origin) prefetchRoute(link.pathname);
        }} className="finix-desktop-shell min-h-screen w-full max-w-[100vw] overflow-x-clip bg-background text-foreground flex" data-section={location.pathname.split('/')[1]}>
            <DesktopNavigation onOpenSearch={openSearch} />

            {/* Top Bar — mobile only (hidden on /messages) */}
            <MobileTopBar />

            {/* Preserve the mobile bars and their safe-area spacing. */}
            <div
                className={`desktop-content flex-1 min-w-0 flex flex-col min-h-screen lg:pb-0 ${isMessages ? 'pt-0' : 'pt-[calc(52px+env(safe-area-inset-top))]'} pb-[calc(60px+env(safe-area-inset-bottom))]`}
            >
                <main
                    className="desktop-main flex-1 min-w-0 flex flex-col w-full max-w-full overflow-x-clip"
                >
                    <ErrorBoundary key={location.pathname} fallbackTitle="Error al cargar la página" fallbackMessage="Ocurrió un error inesperado al renderizar esta sección. Podés reintentar para recargar los datos.">
                        <div className="desktop-page-frame" data-page={page} data-layout={desktopLayout}>
                            <Suspense fallback={<div className="m-6 h-64 rounded-2xl bg-muted/30 animate-pulse" role="status" aria-label="Cargando sección" />}><Outlet /></Suspense>
                        </div>
                    </ErrorBoundary>
                </main>
            </div>

            {/* Bottom Nav — mobile only */}
            {isFinance
                ? <FinanceMobileNav location={location} navigate={navigate} />
                : <BottomNav />}
            {isSearchOpen && <Suspense fallback={null}><GlobalSearch isOpen onClose={closeSearch} /></Suspense>}
            <ScrollToTopButton />
        </div>
    );
}
