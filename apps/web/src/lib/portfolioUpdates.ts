const PORTFOLIO_UPDATE_KEY = 'finix:portfolio-updated';

// Share successful operations with the profile and other open tabs. No amounts
// or holdings are stored in the notification.
export function notifyPortfolioUpdate(portfolioId: string) {
    window.dispatchEvent(new CustomEvent(PORTFOLIO_UPDATE_KEY, { detail: portfolioId }));
    try {
        window.localStorage.setItem(PORTFOLIO_UPDATE_KEY, JSON.stringify({ portfolioId, at: Date.now() }));
    } catch { /* Refresh on focus remains available without local storage. */ }
}

export function subscribePortfolioUpdates(refresh: () => void) {
    const onStorage = (event: StorageEvent) => {
        if (event.key === PORTFOLIO_UPDATE_KEY) refresh();
    };
    window.addEventListener(PORTFOLIO_UPDATE_KEY, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
        window.removeEventListener(PORTFOLIO_UPDATE_KEY, refresh);
        window.removeEventListener('storage', onStorage);
    };
}
