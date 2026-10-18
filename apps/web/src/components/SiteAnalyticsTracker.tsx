import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const CONSENT_KEY = 'finix_cookie_consent';
const VISITOR_KEY = 'finix_analytics_visitor';
const SESSION_KEY = 'finix_analytics_session';
const SESSION_TIMEOUT = 30 * 60 * 1000;
const ANALYTICS_EXCLUDED_EMAILS = new Set(['finixarg@gmail.com', 'juanpablorolo2007@gmail.com']);

function analyticsAllowed() {
    try {
        const consent = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
        const savedAt = Date.parse(consent?.timestamp || '');
        return consent?.version === '2' && consent?.prefs?.analytics === true && Number.isFinite(savedAt) && Date.now() - savedAt <= 365 * 24 * 60 * 60 * 1000;
    } catch {
        return false;
    }
}

function safePage(pathname: string) {
    const parts = pathname.split('/').filter(Boolean);
    const root = '/' + (parts[0] || '');
    if (pathname === '/') return '/dashboard';
    const aliases: Record<string, string> = {
        '/social': '/dashboard', '/market': '/markets', '/mercado': '/markets',
        '/calendario': '/calendar', '/comunidades': '/communities',
        '/analisis': '/analysis', '/finanzas-personales': '/finanzas',
        '/pro': '/pricing', '/creador': '/creator', '/contacto': '/info',
        '/contact': '/info', '/post': '/posts',
    };
    const page = aliases[root] || root;
    const allowed = new Set([
        '/dashboard','/explore','/news','/calendar','/educativa','/portfolio','/messages','/settings',
        '/laboratorio','/pricing','/communities','/markets','/profile','/community','/login','/signup',
        '/info','/about','/help','/analysis','/finanzas','/notifications','/creator','/payment-result',
        '/privacy','/terms','/cookies','/legal','/auth','/verify-email','/reset-password','/posts',
        '/mercado','/market','/contacto','/contact',
    ]);
    return allowed.has(page) ? page : '/dashboard';
}

function identity() {
    const now = Date.now();
    let visitorId = localStorage.getItem(VISITOR_KEY);
    if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(VISITOR_KEY, visitorId);
    }
    let session: { id: string; lastSeen: number } | null = null;
    try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch {}
    if (!session?.id || now - session.lastSeen > SESSION_TIMEOUT) session = { id: crypto.randomUUID(), lastSeen: now };
    session.lastSeen = now;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { visitorId, sessionId: session.id };
}

export default function SiteAnalyticsTracker() {
    const { pathname } = useLocation();
    const page = safePage(pathname);
    const userEmail = useAuthStore(state => String(state.user?.email || '').trim().toLowerCase());
    const excludedFromAnalytics = ANALYTICS_EXCLUDED_EMAILS.has(userEmail);
    const [consentVersion, setConsentVersion] = useState(() => analyticsAllowed() ? 1 : 0);

    useEffect(() => {
        const refresh = () => setConsentVersion(value => value + 1);
        window.addEventListener('finix-consent-updated', refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener('finix-consent-updated', refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    useEffect(() => {
        if (!analyticsAllowed() || excludedFromAnalytics) return;
        let alive = true;
        const ids = identity();
        let pageViewId = '';
        let lastSentAt = Date.now();
        const postPage = async () => {
            try {
                const response = await fetch('/api/site-analytics/page', {
                    method: 'POST', credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...ids, page }),
                });
                const result = await response.json();
                if (alive && typeof result.pageViewId === 'string') pageViewId = result.pageViewId;
            } catch {}
        };
        const flush = (seconds: number) => {
            if (!analyticsAllowed() || !pageViewId || seconds < 1) return;
            const payload = JSON.stringify({ ...ids, pageViewId, seconds: Math.min(30, seconds) });
            void fetch('/api/site-analytics/heartbeat', {
                method: 'POST', credentials: 'same-origin', keepalive: true,
                headers: { 'Content-Type': 'application/json' }, body: payload,
            }).catch(() => {});
        };
        void postPage();
        const timer = window.setInterval(() => {
            const now = Date.now();
            const elapsed = Math.min(30, Math.floor((now - lastSentAt) / 1000));
            if (document.visibilityState === 'visible') flush(elapsed);
            lastSentAt = now;
            try {
                const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
                if (session?.id === ids.sessionId) {
                    session.lastSeen = now;
                    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
                }
            } catch {}
        }, 15000);
        const onVisibility = () => {
            const now = Date.now();
            if (document.visibilityState === 'visible') {
                try {
                    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
                    if (!session?.id || now - session.lastSeen > SESSION_TIMEOUT) setConsentVersion(value => value + 1);
                } catch { setConsentVersion(value => value + 1); }
            }
            lastSentAt = now;
        };
        const onPageHide = () => {
            const elapsed = Math.min(30, Math.floor((Date.now() - lastSentAt) / 1000));
            if (document.visibilityState === 'visible') flush(elapsed);
        };
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pagehide', onPageHide);
        return () => {
            alive = false;
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pagehide', onPageHide);
            if (document.visibilityState === 'visible') flush(Math.min(30, Math.floor((Date.now() - lastSentAt) / 1000)));
        };
    }, [page, consentVersion, excludedFromAnalytics]);

    return null;
}
