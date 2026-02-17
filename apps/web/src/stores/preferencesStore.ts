import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'es-AR' | 'en-US' | 'pt-BR';
export type Currency = 'USD' | 'ARS' | 'EUR';

export interface AppPreferences {
    language: Language;
    currency: Currency;
    autoRefreshMarket: boolean;
    compactTables: boolean;
    showAdvancedMetrics: boolean;
}

interface PreferencesState extends AppPreferences {
    setLanguage: (lang: Language) => void;
    setCurrency: (curr: Currency) => void;
    toggleAutoRefresh: () => void;
    toggleCompactTables: () => void;
    toggleAdvancedMetrics: () => void;
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

            setLanguage: (language) => set({ language }),
            setCurrency: (currency) => set({ currency }),
            toggleAutoRefresh: () => set((state) => ({ autoRefreshMarket: !state.autoRefreshMarket })),
            toggleCompactTables: () => set((state) => ({ compactTables: !state.compactTables })),
            toggleAdvancedMetrics: () => set((state) => ({ showAdvancedMetrics: !state.showAdvancedMetrics })),
            updatePreferences: (prefs) => set((state) => ({ ...state, ...prefs })),
        }),
        {
            name: 'finix_app_preferences_v2', // bumped version
        }
    )
);
