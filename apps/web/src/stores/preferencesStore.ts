import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '@/lib/api';

export type Language = 'es-AR' | 'en-US' | 'pt-BR';
export type Currency = 'USD' | 'ARS' | 'EUR';
export type Theme = 'dark' | 'light' | 'system';

export interface AppPreferences {
    language: Language;
    currency: Currency;
    autoRefreshMarket: boolean;
    compactTables: boolean;
    showAdvancedMetrics: boolean;
    theme: Theme;
    sidebarCollapsed: boolean;
}

interface PreferencesState extends AppPreferences {
    setLanguage: (lang: Language) => void;
    setCurrency: (curr: Currency) => void;
    setTheme: (theme: Theme) => void;
    toggleAutoRefresh: () => void;
    toggleCompactTables: () => void;
    toggleAdvancedMetrics: () => void;
    toggleSidebar: () => void;
    updatePreferences: (prefs: Partial<AppPreferences>) => void;
}

function applyThemeToDOM(theme: Theme) {
    if (typeof document === 'undefined') return;
    const resolved = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme || 'light';

    if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
    }
}

function syncThemeToBackend(theme: Theme) {
    if (typeof window === 'undefined') return;
    apiFetch('/users/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
    }).catch(() => {
        // Fallback or retry
    });
}

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            language: 'es-AR',
            currency: 'USD',
            autoRefreshMarket: true,
            compactTables: false,
            showAdvancedMetrics: true,
            theme: 'light',
            sidebarCollapsed: false,

            setLanguage: (language) => set({ language }),
            setCurrency: (currency) => set({ currency }),
            setTheme: (theme) => {
                set({ theme });
                applyThemeToDOM(theme);
                syncThemeToBackend(theme);
            },
            toggleAutoRefresh: () => set((state) => ({ autoRefreshMarket: !state.autoRefreshMarket })),
            toggleCompactTables: () => set((state) => ({ compactTables: !state.compactTables })),
            toggleAdvancedMetrics: () => set((state) => ({ showAdvancedMetrics: !state.showAdvancedMetrics })),
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            updatePreferences: (prefs) => {
                set((state) => ({ ...state, ...prefs }));
                if (prefs.theme) {
                    applyThemeToDOM(prefs.theme);
                    syncThemeToBackend(prefs.theme);
                }
            },
        }),
        {
            name: 'finix_app_preferences_v4',
            onRehydrateStorage: () => (state) => {
                if (state?.theme) {
                    applyThemeToDOM(state.theme);
                }
            },
        }
    )
);
