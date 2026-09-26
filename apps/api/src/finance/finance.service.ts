import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MarketService } from '../market/market.service';
import { AccessControlService } from '../access/access-control.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { PrismaService } from '../prisma.service';

type FinanceCurrency = 'ARS' | 'USD' | 'EUR';
type FinanceReference = { currency: FinanceCurrency; usdToArs: number; eurToArs: number };

const SUPPORTED_CURRENCIES = new Set<FinanceCurrency>(['ARS', 'USD', 'EUR']);
const money = (value: unknown) => Number(Number(value ?? 0).toFixed(2));
const dateOnly = (value: Date | string | null | undefined) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

@Injectable()
export class FinanceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly access: AccessControlService,
        private readonly market: MarketService,
        private readonly portfolios: PortfolioService,
    ) {}

    private async assertPro(userId: string) {
        await this.access.requirePro(userId);
    }

    private async withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
        let timer: NodeJS.Timeout | undefined;
        try {
            return await Promise.race([
                promise,
                new Promise<T>((_, reject) => {
                    timer = setTimeout(() => reject(new Error('Finance data source timeout')), milliseconds);
                }),
            ]);
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    private normalizeCurrency(value: unknown, fallback: FinanceCurrency = 'ARS'): FinanceCurrency {
        const currency = String(value || fallback).toUpperCase() as FinanceCurrency;
        return SUPPORTED_CURRENCIES.has(currency) ? currency : fallback;
    }

    private parseDate(value: unknown, fallback = new Date()) {
        if (!value) return fallback;
        const result = new Date(String(value));
        return Number.isNaN(result.getTime()) ? fallback : result;
    }

    private async reference(currency: unknown): Promise<FinanceReference> {
        const normalized = this.normalizeCurrency(currency);
        let usdToArs = 1500;
        try {
            const ccl = await this.withTimeout(this.market.getDolarCcl(), 1500);
            usdToArs = Number(ccl.venta || ccl.compra || usdToArs);
        } catch {
            // A temporary market outage must not break manual personal-finance data.
        }
        return { currency: normalized, usdToArs, eurToArs: usdToArs * 1.08 };
    }

    private toArs(value: unknown, currency: unknown, rates: FinanceReference) {
        const amount = Number(value || 0);
        const source = this.normalizeCurrency(currency);
        if (source === 'ARS') return amount;
        return amount * (source === 'USD' ? rates.usdToArs : rates.eurToArs);
    }

    private fromArs(value: unknown, rates: FinanceReference) {
        const amount = Number(value || 0);
        if (rates.currency === 'ARS') return amount;
        return amount / (rates.currency === 'USD' ? rates.usdToArs : rates.eurToArs);
    }

    private signedAmount(type: string, value: unknown) {
        const amount = Math.abs(Number(value || 0));
        if (type === 'income') return amount;
        if (type === 'expense' || type === 'investment') return -amount;
        return Number(value || 0);
    }

    private pick(data: Record<string, any>, keys: string[]) {
        return Object.fromEntries(keys.filter((key) => data[key] !== undefined).map((key) => [key, data[key]]));
    }

    private monthBounds(date = new Date()) {
        return {
            start: new Date(date.getFullYear(), date.getMonth(), 1),
            end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
        };
    }

    private async accountForUser(userId: string, id: string) {
        const account = await this.prisma.personalFinanceAccount.findFirst({ where: { id, userId } });
        if (!account) throw new NotFoundException('Cuenta financiera no encontrada');
        return account;
    }

    private async transactionForUser(userId: string, id: string) {
        const transaction = await this.prisma.personalFinanceTransaction.findFirst({ where: { id, userId } });
        if (!transaction) throw new NotFoundException('Movimiento no encontrado');
        return transaction;
    }

    private async ensureReferences(userId: string, accountId?: string, cardId?: string) {
        if (accountId) await this.accountForUser(userId, accountId);
        if (cardId) {
            const card = await this.prisma.personalFinanceCard.findFirst({ where: { id: cardId, userId } });
            if (!card) throw new NotFoundException('Tarjeta financiera no encontrada');
        }
    }

    async getSnapshot(userId: string, currency?: string) {
        await this.assertPro(userId);
        const rates = await this.reference(currency);
        const now = new Date();
        const { start: monthStart, end: monthEnd } = this.monthBounds(now);
        const [accounts, transactions, budgets, goals, recurring, cards] = await Promise.all([
            this.prisma.personalFinanceAccount.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
            this.prisma.personalFinanceTransaction.findMany({
                where: { userId },
                include: { account: true, card: true },
                orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
                take: 1000,
            }),
            this.prisma.personalFinanceBudget.findMany({ where: { userId, month: now.getMonth() + 1, year: now.getFullYear() } }),
            this.prisma.personalFinanceGoal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
            this.prisma.personalFinanceRecurringPayment.findMany({ where: { userId, active: true }, include: { account: true }, orderBy: { nextDate: 'asc' } }),
            this.prisma.personalFinanceCard.findMany({ where: { userId, active: true }, include: { account: true }, orderBy: { createdAt: 'asc' } }),
        ]);

        let investmentRows: any[] = [];
        try {
            const portfolioRows = await this.withTimeout(this.portfolios.getUserPortfolios(userId), 5000);
            investmentRows = portfolioRows.flatMap((portfolio: any) => (portfolio.assets || []).map((asset: any) => asset));
        } catch {
            // Investment data is supplementary; the rest of the finance module remains usable.
        }

        const investmentsRaw = investmentRows.map((asset: any) => {
            const valueArs = Number(asset.cedearTotalValuationArs || asset.value || 0);
            const investedArs = Number(asset.montoInvertido || 0);
            const pnlArs = valueArs - investedArs;
            return {
                id: String(asset.id || asset.ticker),
                ticker: String(asset.cedearTicker || asset.ticker || '—'),
                name: String(asset.cedearName || asset.ticker || 'Activo'),
                type: String(asset.tipoActivo || 'Activo'),
                quantity: Number(asset.cedearQuantity || asset.cantidad || 0),
                averagePrice: this.fromArs(investedArs / Math.max(Number(asset.cantidad || 1), 1), rates),
                currentPrice: this.fromArs(valueArs / Math.max(Number(asset.cedearQuantity || asset.cantidad || 1), 1), rates),
                valueArs,
                value: this.fromArs(valueArs, rates),
                pnl: this.fromArs(pnlArs, rates),
                pnlPct: investedArs ? (pnlArs / investedArs) * 100 : 0,
                weight: 0,
                currency: rates.currency,
                sector: String(asset.tipoActivo || 'Otros'),
            };
        });
        const investedArs = investmentsRaw.reduce((sum, item) => sum + item.valueArs, 0);
        investmentsRaw.forEach((item) => { item.weight = investedArs ? (item.valueArs / investedArs) * 100 : 0; });

        const accountArs = accounts.filter((account) => !account.hidden).reduce((sum, account) => sum + this.toArs(account.balance, account.currency, rates), 0);
        const debtArs = cards.reduce((sum, card) => sum + this.toArs(card.currentBalance, card.currency, rates), 0);
        const netWorthArs = accountArs + investedArs - debtArs;
        const currentTransactions = transactions.filter((transaction) => transaction.date >= monthStart && transaction.date < monthEnd);
        const monthlyIncomeArs = currentTransactions.filter((transaction) => Number(transaction.amount) > 0).reduce((sum, transaction) => sum + this.toArs(transaction.amount, transaction.currency, rates), 0);
        const monthlyExpensesArs = currentTransactions.filter((transaction) => Number(transaction.amount) < 0).reduce((sum, transaction) => sum + Math.abs(this.toArs(transaction.amount, transaction.currency, rates)), 0);
        const monthlySavingsArs = monthlyIncomeArs - monthlyExpensesArs;

        const accountView = accounts.map((account) => ({
            id: account.id,
            name: account.name,
            institution: account.institution || account.name,
            kind: account.kind,
            currency: this.normalizeCurrency(account.currency),
            nativeBalance: money(account.balance),
            balance: money(account.balance),
            balanceArs: money(this.toArs(account.balance, account.currency, rates)),
            balanceReference: money(this.fromArs(this.toArs(account.balance, account.currency, rates), rates)),
            change: Number(account.changePct || 0),
            lastSync: account.lastSyncedAt ? account.lastSyncedAt.toISOString() : 'Manual',
            hidden: account.hidden,
        }));

        const transactionView = transactions.map((transaction) => ({
            id: transaction.id,
            date: transaction.date.toISOString().slice(0, 10),
            description: transaction.description,
            merchant: transaction.merchant || transaction.description,
            category: transaction.category,
            categoryKey: transaction.categoryKey,
            account: transaction.account?.name || transaction.card?.name || 'Sin asignar',
            accountId: transaction.accountId,
            cardId: transaction.cardId,
            type: transaction.type,
            amount: money(this.fromArs(this.toArs(transaction.amount, transaction.currency, rates), rates)),
            originalAmount: money(transaction.amount),
            originalCurrency: this.normalizeCurrency(transaction.currency),
            currency: rates.currency,
            status: transaction.status,
            notes: transaction.notes,
        }));

        const spentByCategory = new Map<string, number>();
        currentTransactions.filter((transaction) => Number(transaction.amount) < 0).forEach((transaction) => {
            spentByCategory.set(transaction.categoryKey, (spentByCategory.get(transaction.categoryKey) || 0) + Math.abs(this.toArs(transaction.amount, transaction.currency, rates)));
        });
        const budgetView = budgets.map((budget) => {
            const spentArs = spentByCategory.get(budget.categoryKey) || 0;
            const limitArs = this.toArs(budget.limit, 'ARS', rates);
            const ratio = limitArs > 0 ? spentArs / limitArs : 0;
            return {
                id: budget.id,
                category: budget.category,
                categoryKey: budget.categoryKey,
                spent: money(this.fromArs(spentArs, rates)),
                limit: money(this.fromArs(limitArs, rates)),
                tone: ratio >= 1 ? 'exceeded' : ratio >= 0.8 ? 'attention' : 'healthy',
            };
        });

        const goalView = goals.map((goal) => ({
            id: goal.id,
            name: goal.name,
            icon: goal.icon,
            saved: money(this.fromArs(this.toArs(goal.saved, goal.currency, rates), rates)),
            target: money(this.fromArs(this.toArs(goal.target, goal.currency, rates), rates)),
            deadline: dateOnly(goal.deadline),
            monthlyContribution: money(this.fromArs(this.toArs(goal.monthlyContribution, goal.currency, rates), rates)),
            currency: rates.currency,
            originalCurrency: this.normalizeCurrency(goal.currency),
            tone: 'forest',
        }));

        const recurringView = recurring.map((payment) => ({
            id: payment.id,
            name: payment.name,
            category: payment.category,
            amount: money(this.fromArs(this.toArs(payment.amount, payment.currency, rates), rates)),
            currency: rates.currency,
            nextDate: payment.nextDate.toISOString().slice(0, 10),
            frequency: payment.frequency,
            account: payment.account?.name || 'Sin asignar',
        }));

        const cardView = cards.map((card) => ({
            id: card.id,
            name: card.name,
            brand: card.brand,
            last4: card.last4,
            currency: rates.currency,
            creditLimit: money(this.fromArs(this.toArs(card.creditLimit, card.currency, rates), rates)),
            currentBalance: money(this.fromArs(this.toArs(card.currentBalance, card.currency, rates), rates)),
            closingDay: card.closingDay,
            dueDay: card.dueDay,
        }));

        const events = [
            ...recurringView.map((payment) => ({ id: `subscription-${payment.id}`, date: payment.nextDate, title: payment.name, kind: 'subscription', amount: payment.amount, currency: rates.currency })),
            ...cards.flatMap((card) => {
                const result: any[] = [];
                const next = new Date(now.getFullYear(), now.getMonth(), card.closingDay || 28);
                if (next < now) next.setMonth(next.getMonth() + 1);
                result.push({ id: `closing-${card.id}`, date: next.toISOString().slice(0, 10), title: `Cierre ${card.name}`, kind: 'card' });
                const due = new Date(next.getFullYear(), next.getMonth(), card.dueDay || 10);
                if (due <= next) due.setMonth(due.getMonth() + 1);
                result.push({ id: `due-${card.id}`, date: due.toISOString().slice(0, 10), title: `Vencimiento ${card.name}`, kind: 'card', amount: money(this.fromArs(this.toArs(card.currentBalance, card.currency, rates), rates)), currency: rates.currency });
                return result;
            }),
        ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 30);

        const netWorthHistory = this.buildHistory(netWorthArs, transactions, rates);
        const netWorth = this.fromArs(netWorthArs, rates);
        const savings = goalView.reduce((sum, goal) => sum + goal.saved, 0);
        const previous = netWorthHistory.length > 1 ? netWorthHistory[netWorthHistory.length - 2].value : netWorth;

        return {
            currency: rates.currency,
            rates: { usdToArs: rates.usdToArs, eurToArs: rates.eurToArs },
            netWorth: money(netWorth),
            netWorthChange: previous ? Number((((netWorth - previous) / Math.abs(previous)) * 100).toFixed(2)) : 0,
            available: money(this.fromArs(accountArs - debtArs, rates)),
            invested: money(this.fromArs(investedArs, rates)),
            savings: money(savings),
            debt: money(this.fromArs(debtArs, rates)),
            monthlyIncome: money(this.fromArs(monthlyIncomeArs, rates)),
            monthlyExpenses: money(this.fromArs(monthlyExpensesArs, rates)),
            monthlySavings: money(this.fromArs(monthlySavingsArs, rates)),
            savingsRate: monthlyIncomeArs ? Number(((monthlySavingsArs / monthlyIncomeArs) * 100).toFixed(1)) : 0,
            accounts: accountView,
            transactions: transactionView,
            budgets: budgetView,
            goals: goalView,
            investments: investmentsRaw.map(({ valueArs: _valueArs, ...item }) => item),
            recurring: recurringView,
            cards: cardView,
            events,
            netWorthHistory,
            meta: { updatedAt: new Date().toISOString(), hasData: Boolean(accounts.length || transactions.length || investmentsRaw.length) },
        };
    }

    private buildHistory(currentNetWorthArs: number, transactions: any[], rates: FinanceReference) {
        const months = Array.from({ length: 12 }, (_, index) => {
            const date = new Date();
            date.setDate(1);
            date.setMonth(date.getMonth() - (11 - index));
            return date;
        });
        if (!transactions.length) return [{ label: months[11].toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''), value: money(this.fromArs(currentNetWorthArs, rates)), income: 0, expenses: 0 }];
        let current = currentNetWorthArs;
        const reversed = months.map((month) => {
            const start = new Date(month.getFullYear(), month.getMonth(), 1);
            const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
            const rows = transactions.filter((transaction) => transaction.date >= start && transaction.date < end);
            const income = rows.filter((transaction) => Number(transaction.amount) > 0).reduce((sum, transaction) => sum + this.toArs(transaction.amount, transaction.currency, rates), 0);
            const expenses = rows.filter((transaction) => Number(transaction.amount) < 0).reduce((sum, transaction) => sum + Math.abs(this.toArs(transaction.amount, transaction.currency, rates)), 0);
            const point = { label: month.toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''), value: money(this.fromArs(current, rates)), income: money(this.fromArs(income, rates)), expenses: money(this.fromArs(expenses, rates)) };
            current -= income - expenses;
            return point;
        });
        return reversed;
    }

    async listAccounts(userId: string) { await this.assertPro(userId); return this.prisma.personalFinanceAccount.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }); }
    async createAccount(userId: string, data: any) { await this.assertPro(userId); return this.prisma.personalFinanceAccount.create({ data: { userId, name: data.name.trim(), institution: data.institution?.trim() || null, kind: data.kind || 'bank', currency: this.normalizeCurrency(data.currency), balance: Number(data.balance || 0), hidden: Boolean(data.hidden), lastSyncedAt: new Date() } }); }
    async updateAccount(userId: string, id: string, data: any) { await this.assertPro(userId); await this.accountForUser(userId, id); const update = this.pick(data, ['name', 'institution', 'kind', 'currency', 'balance', 'hidden']); if (update.currency) update.currency = this.normalizeCurrency(update.currency); if (update.balance !== undefined) update.balance = Number(update.balance); if (update.name !== undefined) update.name = String(update.name).trim(); if (update.institution !== undefined) update.institution = String(update.institution).trim(); return this.prisma.personalFinanceAccount.update({ where: { id }, data: update }); }
    async syncAccount(userId: string, id: string) { await this.assertPro(userId); await this.accountForUser(userId, id); return this.prisma.personalFinanceAccount.update({ where: { id }, data: { lastSyncedAt: new Date() } }); }
    async deleteAccount(userId: string, id: string) { await this.assertPro(userId); await this.accountForUser(userId, id); await this.prisma.personalFinanceAccount.delete({ where: { id } }); return { ok: true }; }

    async listTransactions(userId: string) { await this.assertPro(userId); return this.prisma.personalFinanceTransaction.findMany({ where: { userId }, include: { account: true, card: true }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], take: 1000 }); }
    async createTransaction(userId: string, data: any) { await this.assertPro(userId); await this.ensureReferences(userId, data.accountId, data.cardId); return this.prisma.personalFinanceTransaction.create({ data: { userId, description: data.description.trim(), merchant: data.merchant?.trim() || null, category: data.category || 'Otros', categoryKey: data.categoryKey || 'other', type: data.type, amount: this.signedAmount(data.type, data.amount), currency: this.normalizeCurrency(data.currency), status: data.status || 'confirmed', date: this.parseDate(data.date), accountId: data.accountId || null, cardId: data.cardId || null, notes: data.notes?.trim() || null } }); }
    async updateTransaction(userId: string, id: string, data: any) { await this.assertPro(userId); await this.transactionForUser(userId, id); await this.ensureReferences(userId, data.accountId, data.cardId); const update = this.pick(data, ['description', 'merchant', 'category', 'categoryKey', 'type', 'amount', 'currency', 'status', 'date', 'accountId', 'cardId', 'notes']); if (update.amount !== undefined) update.amount = this.signedAmount(update.type || 'transfer', update.amount); if (update.currency) update.currency = this.normalizeCurrency(update.currency); if (update.date) update.date = this.parseDate(update.date); if (update.description !== undefined) update.description = String(update.description).trim(); if (update.merchant !== undefined) update.merchant = String(update.merchant).trim(); return this.prisma.personalFinanceTransaction.update({ where: { id }, data: update }); }
    async deleteTransaction(userId: string, id: string) { await this.assertPro(userId); await this.transactionForUser(userId, id); await this.prisma.personalFinanceTransaction.delete({ where: { id } }); return { ok: true }; }

    async listBudgets(userId: string) { await this.assertPro(userId); return this.prisma.personalFinanceBudget.findMany({ where: { userId }, orderBy: [{ year: 'desc' }, { month: 'desc' }] }); }
    async createBudget(userId: string, data: any) { await this.assertPro(userId); const now = new Date(); return this.prisma.personalFinanceBudget.create({ data: { userId, category: data.category.trim(), categoryKey: data.categoryKey.trim(), limit: Number(data.limit), month: Number(data.month || now.getMonth() + 1), year: Number(data.year || now.getFullYear()) } }); }
    async updateBudget(userId: string, id: string, data: any) { await this.assertPro(userId); const budget = await this.prisma.personalFinanceBudget.findFirst({ where: { id, userId } }); if (!budget) throw new NotFoundException('Presupuesto no encontrado'); const update = this.pick(data, ['category', 'categoryKey', 'limit', 'month', 'year']); if (update.limit !== undefined) update.limit = Number(update.limit); if (update.category !== undefined) update.category = String(update.category).trim(); if (update.categoryKey !== undefined) update.categoryKey = String(update.categoryKey).trim(); return this.prisma.personalFinanceBudget.update({ where: { id }, data: update }); }
    async deleteBudget(userId: string, id: string) { await this.assertPro(userId); const budget = await this.prisma.personalFinanceBudget.findFirst({ where: { id, userId } }); if (!budget) throw new NotFoundException('Presupuesto no encontrado'); await this.prisma.personalFinanceBudget.delete({ where: { id } }); return { ok: true }; }

    async listGoals(userId: string) { await this.assertPro(userId); return this.prisma.personalFinanceGoal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }); }
    async createGoal(userId: string, data: any) { await this.assertPro(userId); return this.prisma.personalFinanceGoal.create({ data: { userId, name: data.name.trim(), icon: data.icon || '○', target: Number(data.target), saved: Number(data.saved || 0), currency: this.normalizeCurrency(data.currency), deadline: data.deadline ? this.parseDate(data.deadline) : null, monthlyContribution: Number(data.monthlyContribution || 0) } }); }
    async updateGoal(userId: string, id: string, data: any) { await this.assertPro(userId); const goal = await this.prisma.personalFinanceGoal.findFirst({ where: { id, userId } }); if (!goal) throw new NotFoundException('Objetivo no encontrado'); const update = this.pick(data, ['name', 'icon', 'target', 'saved', 'currency', 'deadline', 'monthlyContribution']); if (update.target !== undefined) update.target = Number(update.target); if (update.saved !== undefined) update.saved = Number(update.saved); if (update.monthlyContribution !== undefined) update.monthlyContribution = Number(update.monthlyContribution); if (update.currency) update.currency = this.normalizeCurrency(update.currency); if (update.deadline) update.deadline = this.parseDate(update.deadline); if (update.name !== undefined) update.name = String(update.name).trim(); return this.prisma.personalFinanceGoal.update({ where: { id }, data: update }); }
    async deleteGoal(userId: string, id: string) { await this.assertPro(userId); const goal = await this.prisma.personalFinanceGoal.findFirst({ where: { id, userId } }); if (!goal) throw new NotFoundException('Objetivo no encontrado'); await this.prisma.personalFinanceGoal.delete({ where: { id } }); return { ok: true }; }

    async listRecurring(userId: string) { await this.assertPro(userId); return this.prisma.personalFinanceRecurringPayment.findMany({ where: { userId }, include: { account: true }, orderBy: { nextDate: 'asc' } }); }
    async createRecurring(userId: string, data: any) { await this.assertPro(userId); if (data.accountId) await this.accountForUser(userId, data.accountId); return this.prisma.personalFinanceRecurringPayment.create({ data: { userId, name: data.name.trim(), category: data.category || 'Suscripciones', amount: Number(data.amount), currency: this.normalizeCurrency(data.currency), nextDate: this.parseDate(data.nextDate), frequency: data.frequency || 'monthly', active: data.active !== false, accountId: data.accountId || null } }); }
    async updateRecurring(userId: string, id: string, data: any) { await this.assertPro(userId); const item = await this.prisma.personalFinanceRecurringPayment.findFirst({ where: { id, userId } }); if (!item) throw new NotFoundException('Pago recurrente no encontrado'); if (data.accountId) await this.accountForUser(userId, data.accountId); const update = this.pick(data, ['name', 'category', 'amount', 'currency', 'nextDate', 'frequency', 'active', 'accountId']); if (update.amount !== undefined) update.amount = Number(update.amount); if (update.currency) update.currency = this.normalizeCurrency(update.currency); if (update.nextDate) update.nextDate = this.parseDate(update.nextDate); if (update.name !== undefined) update.name = String(update.name).trim(); return this.prisma.personalFinanceRecurringPayment.update({ where: { id }, data: update }); }
    async deleteRecurring(userId: string, id: string) { await this.assertPro(userId); const item = await this.prisma.personalFinanceRecurringPayment.findFirst({ where: { id, userId } }); if (!item) throw new NotFoundException('Pago recurrente no encontrado'); await this.prisma.personalFinanceRecurringPayment.delete({ where: { id } }); return { ok: true }; }

    async listCards(userId: string) { await this.assertPro(userId); return this.prisma.personalFinanceCard.findMany({ where: { userId }, include: { account: true }, orderBy: { createdAt: 'asc' } }); }
    async createCard(userId: string, data: any) { await this.assertPro(userId); if (data.accountId) await this.accountForUser(userId, data.accountId); return this.prisma.personalFinanceCard.create({ data: { userId, name: data.name.trim(), brand: data.brand || 'Visa', last4: data.last4 || null, currency: this.normalizeCurrency(data.currency), creditLimit: Number(data.creditLimit || 0), currentBalance: Number(data.currentBalance || 0), closingDay: data.closingDay ? Number(data.closingDay) : null, dueDay: data.dueDay ? Number(data.dueDay) : null, active: data.active !== false, accountId: data.accountId || null } }); }
    async updateCard(userId: string, id: string, data: any) { await this.assertPro(userId); const card = await this.prisma.personalFinanceCard.findFirst({ where: { id, userId } }); if (!card) throw new NotFoundException('Tarjeta no encontrada'); if (data.accountId) await this.accountForUser(userId, data.accountId); const update = this.pick(data, ['name', 'brand', 'last4', 'currency', 'creditLimit', 'currentBalance', 'closingDay', 'dueDay', 'active', 'accountId']); if (update.name !== undefined) update.name = String(update.name).trim(); if (update.currency) update.currency = this.normalizeCurrency(update.currency); if (update.creditLimit !== undefined) update.creditLimit = Number(update.creditLimit); if (update.currentBalance !== undefined) update.currentBalance = Number(update.currentBalance); return this.prisma.personalFinanceCard.update({ where: { id }, data: update }); }
    async deleteCard(userId: string, id: string) { await this.assertPro(userId); const card = await this.prisma.personalFinanceCard.findFirst({ where: { id, userId } }); if (!card) throw new NotFoundException('Tarjeta no encontrada'); await this.prisma.personalFinanceCard.delete({ where: { id } }); return { ok: true }; }
}
