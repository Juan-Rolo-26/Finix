import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
            setTheme: (theme) => set({ theme }),
            toggleAutoRefresh: () => set((state) => ({ autoRefreshMarket: !state.autoRefreshMarket })),
            toggleCompactTables: () => set((state) => ({ compactTables: !state.compactTables })),
            toggleAdvancedMetrics: () => set((state) => ({ showAdvancedMetrics: !state.showAdvancedMetrics })),
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            updatePreferences: (prefs) => set((state) => ({ ...state, ...prefs })),
        }),
        {
            name: 'finix_app_preferences_v4',
        }
    )
);
