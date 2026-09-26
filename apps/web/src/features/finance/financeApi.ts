import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useFinancePreferences } from './financePreferences';
import type { FinanceCurrency, FinanceSnapshot } from './types';

export const emptyFinanceSnapshot = (currency: FinanceCurrency): FinanceSnapshot => ({
    currency,
    netWorth: 0,
    netWorthChange: 0,
    available: 0,
    invested: 0,
    savings: 0,
    debt: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlySavings: 0,
    savingsRate: 0,
    accounts: [],
    transactions: [],
    budgets: [],
    goals: [],
    investments: [],
    recurring: [],
    cards: [],
    events: [],
    netWorthHistory: [],
    meta: { updatedAt: new Date().toISOString(), hasData: false },
});

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await apiFetch(path, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message || 'No se pudo actualizar Finanzas personales');
    return payload as T;
}

export function useFinanceSnapshot() {
    const currency = useFinancePreferences((state) => state.currency);
    const [snapshot, setSnapshot] = useState<FinanceSnapshot>(() => emptyFinanceSnapshot(currency));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const next = await request<FinanceSnapshot>(`/personal-finance/snapshot?currency=${currency}`);
            setSnapshot(next);
            setError(null);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'No se pudo cargar la información');
        } finally {
            setLoading(false);
        }
    }, [currency]);

    useEffect(() => { void reload(); }, [reload]);

    return { snapshot, loading, error, reload, request };
}

export async function createFinanceRecord<T>(resource: string, body: unknown) {
    return request<T>(`/personal-finance/${resource}`, { method: 'POST', body: JSON.stringify(body) });
}

export async function updateFinanceRecord<T>(resource: string, id: string, body: unknown) {
    return request<T>(`/personal-finance/${resource}/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function deleteFinanceRecord(resource: string, id: string) {
    return request<{ ok: boolean }>(`/personal-finance/${resource}/${id}`, { method: 'DELETE' });
}
