const routes: Record<string, () => Promise<unknown>> = {
    '/dashboard': () => import('@/pages/Dashboard'),
    '/market': () => import('@/pages/Markets'),
    '/portfolio': () => import('@/pages/Portfolio'),
    '/news': () => import('@/pages/News'),
    '/analysis': () => import('@/pages/Analysis'),
    '/calendario': () => import('@/pages/CalendarPage'),
    '/comunidades': () => import('@/pages/Comunidades'),
    '/market/seguimiento': () => import('@/pages/WatchlistPage'),
    '/market/watchlist': () => import('@/pages/WatchlistPage'),
    '/mercado/seguimiento': () => import('@/pages/WatchlistPage'),
    '/calendar': () => import('@/pages/CalendarPage'),
};
const pending = new Map<string, Promise<unknown>>();

/** Warm code only on navigation intent; never fetch private page data here. */
export function prefetchRoute(path: string) {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || connection?.effectiveType?.includes('2g')) return;
    const load = routes[path];
    if (!load || pending.has(path)) return;
    pending.set(path, load().catch(() => { pending.delete(path); }));
}
