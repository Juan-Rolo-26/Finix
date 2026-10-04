import { useCallback, useSyncExternalStore } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch } from '@/lib/api';

type Counter = { count: number; listeners: Set<() => void>; stop: () => void };
const counters = new Map<string, Counter>();

/** Desktop and mobile navigation subscribe to one poller per account/resource. */
export function useUnreadCount(resource: 'notifications' | 'messages') {
    const owner = useAuthStore(state => state.user?.id);
    const key = `${owner || 'anon'}:${resource}`;
    const subscribe = useCallback((listener: () => void) => {
        if (!owner) return () => {};
        let counter = counters.get(key);
        if (!counter) {
            const state: Counter = { count: 0, listeners: new Set(), stop: () => {} };
            let pending: AbortController | null = null;
            const load = async () => {
                if (document.hidden || pending) return;
                const controller = new AbortController();
                pending = controller;
                try {
                    const response = await apiFetch(`/${resource}/unread-count`, { signal: controller.signal });
                    if (!response.ok) return;
                    const data = await response.json();
                    if (!controller.signal.aborted) {
                        state.count = Math.max(0, Number(data.count) || 0);
                        state.listeners.forEach(notify => notify());
                    }
                } catch { /* Keep the last successful count through a short outage. */ }
                finally { if (pending === controller) pending = null; }
            };
            const interval = window.setInterval(() => void load(), 30000);
            const refresh = () => void load();
            document.addEventListener('visibilitychange', refresh);
            window.addEventListener('focus', refresh);
            window.addEventListener('finix:unread-refresh', refresh);
            state.stop = () => {
                window.clearInterval(interval);
                pending?.abort();
                document.removeEventListener('visibilitychange', refresh);
                window.removeEventListener('focus', refresh);
                window.removeEventListener('finix:unread-refresh', refresh);
            };
            counters.set(key, state);
            counter = state;
            void load();
        }
        counter.listeners.add(listener);
        return () => {
            counter!.listeners.delete(listener);
            if (!counter!.listeners.size) { counter!.stop(); counters.delete(key); }
        };
    }, [key, owner, resource]);
    const snapshot = useCallback(() => counters.get(key)?.count ?? 0, [key]);
    const count = useSyncExternalStore(subscribe, snapshot, () => 0);
    const setCount = useCallback((value: number | ((previous: number) => number)) => {
        const state = counters.get(key);
        if (!state) return;
        state.count = typeof value === 'function' ? value(state.count) : value;
        state.listeners.forEach(notify => notify());
    }, [key]);
    return [count, setCount] as const;
}
