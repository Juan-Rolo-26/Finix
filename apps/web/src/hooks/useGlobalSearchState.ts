import { useEffect, useState } from 'react';

/** Share the existing Finix search behavior between desktop navigation layouts. */
export function useGlobalSearchState(desktopOnly = false) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    useEffect(() => {
        const open = () => {
            if (!desktopOnly || window.matchMedia('(min-width: 1024px)').matches) setIsSearchOpen(true);
        };
        const keyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'k' && (!desktopOnly || window.matchMedia('(min-width: 1024px)').matches)) {
                event.preventDefault();
                open();
            }
        };
        window.addEventListener('keydown', keyDown);
        window.addEventListener('finix:open-search', open);
        return () => {
            window.removeEventListener('keydown', keyDown);
            window.removeEventListener('finix:open-search', open);
        };
    }, [desktopOnly]);
    return { isSearchOpen, openSearch: () => setIsSearchOpen(true), closeSearch: () => setIsSearchOpen(false) };
}
