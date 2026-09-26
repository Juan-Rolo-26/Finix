import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FinanceCurrency } from './types';

interface FinancePreferencesState {
    hideValues: boolean;
    currency: FinanceCurrency;
    toggleHideValues: () => void;
    setCurrency: (currency: FinanceCurrency) => void;
}

export const useFinancePreferences = create<FinancePreferencesState>()(
    persist(
        (set) => ({
            hideValues: false,
            currency: 'ARS',
            toggleHideValues: () => set((state) => ({ hideValues: !state.hideValues })),
            setCurrency: (currency) => set({ currency }),
        }),
        { name: 'finix_finance_preferences_v1' },
    ),
);
