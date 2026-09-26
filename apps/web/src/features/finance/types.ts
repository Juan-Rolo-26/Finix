export type FinanceCurrency = 'ARS' | 'USD' | 'EUR';
export type FinancePeriod = '1M' | '3M' | '6M' | 'YTD' | '1A' | 'ALL';

export interface FinanceAccount {
    id: string;
    name: string;
    institution: string;
    kind: 'bank' | 'wallet' | 'cash' | 'broker' | 'credit';
    currency: FinanceCurrency;
    balance: number;
    balanceArs: number;
    balanceReference?: number;
    nativeBalance?: number;
    change: number;
    lastSync: string;
    hidden?: boolean;
}

export interface FinanceTransaction {
    id: string;
    date: string;
    description: string;
    merchant: string;
    category: string;
    categoryKey: string;
    account: string;
    type: 'income' | 'expense' | 'transfer' | 'investment';
    amount: number;
    currency: FinanceCurrency;
    status: 'confirmed' | 'pending';
    originalAmount?: number;
    originalCurrency?: FinanceCurrency;
    accountId?: string | null;
    cardId?: string | null;
}

export interface FinanceBudget {
    id: string;
    category: string;
    spent: number;
    limit: number;
    tone: 'healthy' | 'attention' | 'exceeded';
}

export interface FinanceGoal {
    id: string;
    name: string;
    icon: string;
    saved: number;
    target: number;
    deadline: string | null;
    monthlyContribution: number;
    tone: 'forest' | 'ochre' | 'slate';
}

export interface FinanceInvestment {
    id: string;
    ticker: string;
    name: string;
    type: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    valueArs: number;
    pnl: number;
    pnlPct: number;
    weight: number;
    currency: FinanceCurrency;
    sector: string;
    value?: number;
}

export interface FinanceRecurringPayment {
    id: string;
    name: string;
    category: string;
    amount: number;
    currency: FinanceCurrency;
    nextDate: string;
    frequency: string;
    account: string;
}

export interface FinanceCard {
    id: string;
    name: string;
    brand: string;
    last4?: string | null;
    currency: FinanceCurrency;
    creditLimit: number;
    currentBalance: number;
    closingDay?: number | null;
    dueDay?: number | null;
}

export interface FinancePaymentEvent {
    id: string;
    date: string;
    title: string;
    kind: 'card' | 'subscription' | 'income' | 'goal';
    amount?: number;
    currency?: FinanceCurrency;
}

export interface FinanceMonthPoint {
    label: string;
    value: number;
    income: number;
    expenses: number;
}

export interface FinanceSnapshot {
    currency: FinanceCurrency;
    netWorth: number;
    netWorthChange: number;
    available: number;
    invested: number;
    savings: number;
    debt: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    savingsRate: number;
    accounts: FinanceAccount[];
    transactions: FinanceTransaction[];
    budgets: FinanceBudget[];
    goals: FinanceGoal[];
    investments: FinanceInvestment[];
    recurring: FinanceRecurringPayment[];
    cards: FinanceCard[];
    events: FinancePaymentEvent[];
    netWorthHistory: FinanceMonthPoint[];
    rates?: { usdToArs: number; eurToArs: number };
    meta?: { updatedAt: string; hasData: boolean };
}
