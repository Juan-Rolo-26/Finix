import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { DesktopNavigation } from '@/components/DesktopNavigation';
import { useGlobalSearchState } from '@/hooks/useGlobalSearchState';
import './desktop.css';
import './desktop-sections.css';
import './information-pages.css';

const GlobalSearch = lazy(() => import('@/components/GlobalSearch').then(module => ({ default: module.GlobalSearch })));

/** Public information pages keep their original mobile navigation and content. */
export default function InformationLayout() {
    const { isSearchOpen, openSearch, closeSearch } = useGlobalSearchState(true);
    return (
        <div className="finix-desktop-shell desktop-info-shell">
            <DesktopNavigation onOpenSearch={openSearch} />
            <div className="desktop-main desktop-info-main"><Outlet /></div>
            {isSearchOpen && <Suspense fallback={null}><GlobalSearch isOpen onClose={closeSearch} /></Suspense>}
        </div>
    );
}
